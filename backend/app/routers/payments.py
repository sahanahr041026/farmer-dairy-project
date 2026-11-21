import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas
from app.security import get_current_admin, get_current_user_payload

router = APIRouter(prefix="/payments", tags=["Payments & Settlements"])

@router.get("", response_model=List[schemas.PaymentSettlementResponse])
def get_settlements(
    farmer_id: Optional[int] = None,
    status: Optional[str] = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    query = db.query(models.PaymentSettlement).filter(models.PaymentSettlement.cooperative_id == coop_id)

    if role == "farmer":
        query = query.filter(models.PaymentSettlement.farmer_id == payload.get("user_id"))
    elif farmer_id:
        query = query.filter(models.PaymentSettlement.farmer_id == farmer_id)

    if status:
        query = query.filter(models.PaymentSettlement.status == status)

    settlements = query.order_by(models.PaymentSettlement.created_at.desc()).all()

    result = []
    for s in settlements:
        resp = schemas.PaymentSettlementResponse.model_validate(s)
        resp.farmer_name = s.farmer.full_name if s.farmer else None
        resp.farmer_uid = s.farmer.farmer_uid if s.farmer else None
        result.append(resp)

    return result

@router.post("/settle", response_model=schemas.PaymentSettlementResponse, status_code=status.HTTP_201_CREATED)
def create_settlement(
    data: schemas.SettlementCreate,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Computes and creates a payment settlement for a farmer over a date range.
    Updates all included milk collection records to 'approved'.
    """
    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == data.farmer_id,
        models.Farmer.cooperative_id == admin.cooperative_id
    ).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found.")

    if data.period_start > data.period_end:
        raise HTTPException(status_code=422, detail="Period start cannot be after period end.")

    # Find pending (not yet approved or settled) collections in range
    collections = db.query(models.MilkCollection).filter(
        models.MilkCollection.cooperative_id == admin.cooperative_id,
        models.MilkCollection.farmer_id == farmer.id,
        models.MilkCollection.collection_date >= data.period_start,
        models.MilkCollection.collection_date <= data.period_end,
        models.MilkCollection.payment_status == "pending"
    ).all()

    if not collections:
        raise HTTPException(status_code=400, detail="No unsettled milk records found for the selected date range.")

    total_litres = sum(c.quantity_litres for c in collections)
    calculated_amount = sum(c.total_amount for c in collections)

    settlement = models.PaymentSettlement(
        cooperative_id=admin.cooperative_id,
        farmer_id=farmer.id,
        period_start=data.period_start,
        period_end=data.period_end,
        total_litres=round(total_litres, 1),
        calculated_amount=round(calculated_amount, 2),
        approved_amount=round(calculated_amount, 2),
        paid_amount=0.0,
        payment_mode=data.payment_mode,
        reference_no=data.reference_no,
        status="approved"
    )
    db.add(settlement)
    db.flush()

    # Link collections
    for c in collections:
        c.payment_status = "approved"
        c.settlement_id = settlement.id

    # In-app notification for farmer
    notif = models.Notification(
        cooperative_id=admin.cooperative_id,
        farmer_id=farmer.id,
        title="Payment Approved",
        title_kn="ಪಾವತಿ ಅನುಮೋದಿಸಲಾಗಿದೆ",
        message=f"Milk bill for {data.period_start} to {data.period_end} (₹{calculated_amount:.2f}) has been approved.",
        message_kn=f"{data.period_start} ರಿಂದ {data.period_end} ರ ಹಾಲಿನ ಬಿಲ್ ₹{calculated_amount:.2f} ಅನುಮೋದನೆಯಾಗಿದೆ.",
        category="payment"
    )
    db.add(notif)

    db.commit()
    db.refresh(settlement)

    resp = schemas.PaymentSettlementResponse.model_validate(settlement)
    resp.farmer_name = farmer.full_name
    resp.farmer_uid = farmer.farmer_uid
    return resp

@router.put("/{settlement_id}", response_model=schemas.PaymentSettlementResponse)
def update_settlement_status(
    settlement_id: int,
    data: schemas.SettlementUpdate,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Marks payment settlement as completed/paid and updates linked milk records."""
    settlement = db.query(models.PaymentSettlement).filter(
        models.PaymentSettlement.id == settlement_id,
        models.PaymentSettlement.cooperative_id == admin.cooperative_id
    ).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found.")

    if settlement.status == "completed":
        raise HTTPException(status_code=409, detail="Settlement is already completed and cannot be modified.")
    if data.status == settlement.status:
        raise HTTPException(status_code=409, detail=f"Settlement is already '{settlement.status}'.")
    if data.status != "completed":
        # Only forward transition supported: approved -> completed.
        raise HTTPException(status_code=422, detail="Settlements can only be moved to 'completed'.")

    paid = data.paid_amount if data.paid_amount is not None else settlement.approved_amount
    if paid > settlement.approved_amount + 0.005:
        raise HTTPException(status_code=422, detail="Paid amount cannot exceed the approved amount.")

    settlement.status = "completed"
    settlement.paid_amount = round(paid, 2)
    if data.reference_no:
        settlement.reference_no = data.reference_no
    settlement.payment_date = data.payment_date or settlement.payment_date or datetime.date.today()

    # Settle only the collections that were linked to THIS settlement.
    db.query(models.MilkCollection).filter(
        models.MilkCollection.settlement_id == settlement.id,
        models.MilkCollection.cooperative_id == admin.cooperative_id
    ).update({"payment_status": "settled"}, synchronize_session=False)

    farmer = settlement.farmer
    if farmer:
        db.add(models.Notification(
            cooperative_id=admin.cooperative_id,
            farmer_id=farmer.id,
            title="Payment Settled",
            title_kn="ಪಾವತಿ ಜಮೆಯಾಗಿದೆ",
            message=f"₹{settlement.paid_amount:.2f} paid via {settlement.payment_mode} (Ref: {settlement.reference_no or 'N/A'}). Check your bank account.",
            message_kn=f"₹{settlement.paid_amount:.2f} ಮೊತ್ತವು {settlement.payment_mode} ಮೂಲಕ ಜಮೆಯಾಗಿದೆ (ಉಲ್ಲೇಖ: {settlement.reference_no or 'N/A'}).",
            category="payment"
        ))

    db.commit()
    db.refresh(settlement)

    resp = schemas.PaymentSettlementResponse.model_validate(settlement)
    resp.farmer_name = settlement.farmer.full_name if settlement.farmer else None
    resp.farmer_uid = settlement.farmer.farmer_uid if settlement.farmer else None
    return resp

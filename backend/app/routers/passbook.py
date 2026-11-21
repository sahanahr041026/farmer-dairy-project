import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import case, func
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.money import D, money_sum, q2
from app.security import get_current_user_payload
from app.pdf_service import generate_passbook_pdf

router = APIRouter(prefix="/passbook", tags=["Digital E-Passbook"])

@router.get("", response_model=schemas.PassbookSummaryResponse)
def get_passbook(
    farmer_id: Optional[int] = None,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    # Determine target farmer
    target_farmer_id = payload.get("user_id") if role == "farmer" else farmer_id
    if not target_farmer_id:
        raise HTTPException(status_code=400, detail="farmer_id is required for admin.")

    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == target_farmer_id,
        models.Farmer.cooperative_id == coop_id
    ).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found in your cooperative.")

    # Default to current month if dates not provided
    today = datetime.date.today()
    if not start_date:
        start_date = today.replace(day=1)
    if not end_date:
        end_date = today

    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date cannot be after end date.")

    records_query = db.query(models.MilkCollection).filter(
        models.MilkCollection.farmer_id == farmer.id,
        models.MilkCollection.collection_date >= start_date,
        models.MilkCollection.collection_date <= end_date
    ).order_by(models.MilkCollection.collection_date.asc(), models.MilkCollection.session.asc())

    records = records_query.all()

    MC = models.MilkCollection

    def _aggregate(*conditions):
        """One SQL round-trip: litres, amount, settled amount, avg fat/snf."""
        row = db.query(
            func.coalesce(func.sum(MC.quantity_litres), 0.0),
            func.coalesce(func.sum(MC.total_amount), 0.0),
            func.coalesce(func.sum(case((MC.payment_status == "settled", MC.total_amount), else_=0)), 0),
            func.coalesce(func.avg(MC.fat_percentage), 0.0),
            func.coalesce(func.avg(MC.snf_percentage), 0.0),
        ).filter(MC.farmer_id == farmer.id, *conditions).one()
        return [float(x) for x in row]

    total_litres, total_amount, paid_amount, avg_fat, avg_snf = _aggregate(
        MC.collection_date >= start_date, MC.collection_date <= end_date
    )
    pending_amount = q2(D(total_amount) - D(paid_amount))

    today = datetime.date.today()
    today_litres, today_earnings, _, _, _ = _aggregate(MC.collection_date == today)
    month_start = today.replace(day=1)
    month_litres, month_earnings, _, _, _ = _aggregate(
        MC.collection_date >= month_start, MC.collection_date <= today
    )

    coop = farmer.cooperative

    record_responses = []
    for r in records:
        resp = schemas.MilkCollectionResponse.model_validate(r)
        resp.farmer_name = farmer.full_name
        resp.farmer_uid = farmer.farmer_uid
        resp.audits = [schemas.MilkAuditResponse.model_validate(a) for a in r.audits]
        record_responses.append(resp)

    return schemas.PassbookSummaryResponse(
        farmer_id=farmer.id,
        farmer_name=farmer.full_name,
        farmer_uid=farmer.farmer_uid,
        cooperative_name=coop.name if coop else "",
        cooperative_code=coop.code if coop else "",
        total_litres=round(total_litres, 1),
        avg_fat=round(avg_fat, 2),
        avg_snf=round(avg_snf, 2),
        total_earnings=q2(total_amount),
        paid_amount=q2(paid_amount),
        pending_amount=pending_amount,
        today_litres=round(today_litres, 1),
        today_earnings=q2(today_earnings),
        month_litres=round(month_litres, 1),
        month_earnings=q2(month_earnings),
        records=record_responses
    )

@router.get("/pdf")
def download_passbook_pdf(
    farmer_id: Optional[int] = None,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """
    Generates and downloads an authorized digital e-passbook PDF statement for the requested period.
    Strictly enforces cooperative isolation and farmer data ownership.
    Logs audit record of the statement generation.
    """
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    # Security check: Farmers can only download their own passbook
    if role == "farmer":
        target_farmer_id = payload.get("user_id")
    else:
        # Admin must specify farmer_id
        if not farmer_id:
            raise HTTPException(status_code=400, detail="farmer_id is required for admin statement generation.")
        target_farmer_id = farmer_id

    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == target_farmer_id,
        models.Farmer.cooperative_id == coop_id
    ).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found in your cooperative.")

    today = datetime.date.today()
    if not start_date:
        start_date = today.replace(day=1)
    if not end_date:
        end_date = today

    # Date range validation
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date cannot be after end date.")

    records = db.query(models.MilkCollection).filter(
        models.MilkCollection.farmer_id == farmer.id,
        models.MilkCollection.collection_date >= start_date,
        models.MilkCollection.collection_date <= end_date
    ).order_by(models.MilkCollection.collection_date.asc(), models.MilkCollection.session.asc()).all()

    coop = farmer.cooperative
    reference_no = f"DS-PB-{coop.code}-{farmer.farmer_uid}-{start_date.strftime('%Y%m%d')}-{end_date.strftime('%Y%m%d')}"

    # Log statement generation audit
    audit = models.PassbookDownloadAudit(
        cooperative_id=coop_id,
        farmer_id=farmer.id,
        requested_by_role=role or "farmer",
        requested_by_id=payload.get("user_id") or 0,
        period_start=start_date,
        period_end=end_date,
        record_count=len(records),
        total_milk_value=money_sum(r.total_amount for r in records),
        reference_number=reference_no
    )
    db.add(audit)
    db.commit()

    records_data = []
    for r in records:
        records_data.append({
            "collection_date": r.collection_date.isoformat(),
            "session": r.session,
            "quantity_litres": r.quantity_litres,
            "fat_percentage": r.fat_percentage,
            "snf_percentage": r.snf_percentage,
            "rate_per_litre": r.rate_per_litre,
            "total_amount": r.total_amount,
            "payment_status": r.payment_status,
            "record_status": r.record_status,
            "correction_reason": r.correction_reason
        })

    pdf_bytes = generate_passbook_pdf(
        cooperative={
            "name": coop.name,
            "code": coop.code,
            "locality": coop.locality,
            "contact_phone": coop.contact_phone,
            "address": coop.address
        },
        farmer={
            "full_name": farmer.full_name,
            "farmer_uid": farmer.farmer_uid,
            "phone": farmer.phone,
            "village": farmer.village,
            "bank_account_no": farmer.bank_account_no,
            "ifsc_code": farmer.ifsc_code
        },
        records=records_data,
        period_start=start_date.isoformat(),
        period_end=end_date.isoformat(),
        reference_no=reference_no
    )

    filename = f"DairySathi_Passbook_{farmer.farmer_uid}_{start_date}_{end_date}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


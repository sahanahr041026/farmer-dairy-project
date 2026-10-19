import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas
from app.security import get_current_admin, get_current_user_payload
from app.routers.rates import compute_rate

router = APIRouter(prefix="/milk", tags=["Milk Collection Management"])

@router.get("", response_model=List[schemas.MilkCollectionResponse])
def get_collections(
    farmer_id: Optional[int] = None,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    session: Optional[str] = None,
    payment_status: Optional[str] = None,
    limit: int = 100,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """
    Retrieves milk collections.
    If authenticated user is a farmer, strictly enforces farmer_id to their own account.
    If admin, filters by their cooperative.
    """
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    query = db.query(models.MilkCollection).filter(models.MilkCollection.cooperative_id == coop_id)

    if role == "farmer":
        user_farmer_id = payload.get("user_id")
        query = query.filter(models.MilkCollection.farmer_id == user_farmer_id)
    elif farmer_id:
        query = query.filter(models.MilkCollection.farmer_id == farmer_id)

    if start_date:
        query = query.filter(models.MilkCollection.collection_date >= start_date)
    if end_date:
        query = query.filter(models.MilkCollection.collection_date <= end_date)
    if session:
        query = query.filter(models.MilkCollection.session == session)
    if payment_status:
        query = query.filter(models.MilkCollection.payment_status == payment_status)

    collections = query.order_by(
        models.MilkCollection.collection_date.desc(),
        models.MilkCollection.session.desc()
    ).limit(limit).all()

    result = []
    for c in collections:
        resp = schemas.MilkCollectionResponse.from_orm(c)
        resp.farmer_name = c.farmer.full_name if c.farmer else None
        resp.farmer_uid = c.farmer.farmer_uid if c.farmer else None
        # Add audits
        resp.audits = [schemas.MilkAuditResponse.from_orm(a) for a in c.audits]
        result.append(resp)

    return result

@router.get("/today")
def get_today_collection_summary(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Returns today's morning and evening collection summary for dashboard."""
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")
    today = datetime.date.today()

    query = db.query(models.MilkCollection).filter(
        models.MilkCollection.cooperative_id == coop_id,
        models.MilkCollection.collection_date == today
    )

    if role == "farmer":
        user_farmer_id = payload.get("user_id")
        query = query.filter(models.MilkCollection.farmer_id == user_farmer_id)

    records = query.all()

    morning_records = [r for r in records if r.session == "morning"]
    evening_records = [r for r in records if r.session == "evening"]

    morning_litres = sum(r.quantity_litres for r in morning_records)
    evening_litres = sum(r.quantity_litres for r in evening_records)
    total_litres = morning_litres + evening_litres
    total_amount = sum(r.total_amount for r in records)

    return {
        "date": today.isoformat(),
        "total_litres": round(total_litres, 1),
        "morning_litres": round(morning_litres, 1),
        "evening_litres": round(evening_litres, 1),
        "total_amount": round(total_amount, 2),
        "total_entries": len(records)
    }

@router.post("", response_model=schemas.MilkCollectionResponse, status_code=status.HTTP_201_CREATED)
def record_milk_collection(
    data: schemas.MilkCollectionCreate,
    allow_duplicate: bool = False,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Records a new milk collection for a farmer with automatic rate calculation,
    duplicate prevention, and instant farmer portal synchronization.
    """
    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == data.farmer_id,
        models.Farmer.cooperative_id == admin.cooperative_id
    ).first()

    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found in your cooperative.")
    if not farmer.is_active:
        raise HTTPException(status_code=400, detail="Farmer membership is inactive.")

    # Duplicate check
    existing = db.query(models.MilkCollection).filter(
        models.MilkCollection.farmer_id == data.farmer_id,
        models.MilkCollection.collection_date == data.collection_date,
        models.MilkCollection.session == data.session
    ).first()

    if existing and not allow_duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Record already exists for {farmer.full_name} on {data.collection_date} ({data.session} session). Confirm overwrite or edit existing."
        )

    # Active rate rule
    rule = db.query(models.MilkRateRule).filter(
        models.MilkRateRule.cooperative_id == admin.cooperative_id,
        models.MilkRateRule.is_active == True
    ).first()

    if not rule:
        rule = models.MilkRateRule(base_rate=40.0, base_fat=4.0, base_snf=8.5, fat_rate_step=0.45, snf_rate_step=0.30)

    fat = data.fat_percentage if data.fat_percentage is not None else rule.base_fat
    snf = data.snf_percentage if data.snf_percentage is not None else rule.base_snf

    rate = compute_rate(rule, fat, snf)
    amount = round(data.quantity_litres * rate, 2)

    collection = models.MilkCollection(
        cooperative_id=admin.cooperative_id,
        farmer_id=data.farmer_id,
        collection_date=data.collection_date,
        session=data.session,
        quantity_litres=data.quantity_litres,
        fat_percentage=data.fat_percentage,
        snf_percentage=data.snf_percentage,
        rate_per_litre=rate,
        total_amount=amount,
        payment_status="pending",
        recorded_by_admin_id=admin.id,
        notes=data.notes
    )
    db.add(collection)
    db.flush()

    # Create in-app notification for farmer for automatic synchronization
    notif = models.Notification(
        cooperative_id=admin.cooperative_id,
        farmer_id=farmer.id,
        title="Milk Recorded",
        title_kn="ಹಾಲು ಸಂಗ್ರಹ ದಾಖಲಾಗಿದೆ",
        message=f"{data.quantity_litres:.1f}L recorded for {data.collection_date} ({data.session}). Amount: ₹{amount:.2f}.",
        message_kn=f"{data.collection_date} ({data.session}) ಕ್ಕೆ {data.quantity_litres:.1f} ಲೀಟರ್ ಹಾಲು ದಾಖಲಾಗಿದೆ. ಮೌಲ್ಯ: ₹{amount:.2f}.",
        category="milk"
    )
    db.add(notif)

    db.commit()
    db.refresh(collection)

    resp = schemas.MilkCollectionResponse.from_orm(collection)
    resp.farmer_name = farmer.full_name
    resp.farmer_uid = farmer.farmer_uid
    return resp

@router.put("/{collection_id}", response_model=schemas.MilkCollectionResponse)
def correct_milk_collection(
    collection_id: int,
    data: schemas.MilkCollectionCorrection,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Corrects a saved milk collection record with an audit log trail,
    recalculating amounts and immediately syncing with the farmer's portal.
    """
    collection = db.query(models.MilkCollection).filter(
        models.MilkCollection.id == collection_id,
        models.MilkCollection.cooperative_id == admin.cooperative_id
    ).first()

    if not collection:
        raise HTTPException(status_code=404, detail="Milk collection record not found.")

    # Active rate rule
    rule = db.query(models.MilkRateRule).filter(
        models.MilkRateRule.cooperative_id == admin.cooperative_id,
        models.MilkRateRule.is_active == True
    ).first()

    fat = data.fat_percentage if data.fat_percentage is not None else (collection.fat_percentage or 4.0)
    snf = data.snf_percentage if data.snf_percentage is not None else (collection.snf_percentage or 8.5)
    new_rate = compute_rate(rule, fat, snf)
    new_amount = round(data.quantity_litres * new_rate, 2)

    # Record Audit Log
    audit = models.MilkRecordAudit(
        collection_id=collection.id,
        admin_id=admin.id,
        previous_quantity=collection.quantity_litres,
        new_quantity=data.quantity_litres,
        previous_fat=collection.fat_percentage,
        new_fat=data.fat_percentage,
        previous_snf=collection.snf_percentage,
        new_snf=data.snf_percentage,
        previous_amount=collection.total_amount,
        new_amount=new_amount,
        reason=data.reason.strip()
    )
    db.add(audit)

    # Apply changes
    collection.quantity_litres = data.quantity_litres
    collection.fat_percentage = data.fat_percentage
    collection.snf_percentage = data.snf_percentage
    collection.rate_per_litre = new_rate
    collection.total_amount = new_amount
    if data.notes:
        collection.notes = data.notes

    # Notification for farmer regarding correction
    farmer = collection.farmer
    if farmer:
        notif = models.Notification(
            cooperative_id=admin.cooperative_id,
            farmer_id=farmer.id,
            title="Milk Record Updated",
            title_kn="ಹಾಲು ದಾಖಲೆ ತಿದ್ದುಪಡಿಯಾಗಿದೆ",
            message=f"Collection for {collection.collection_date} ({collection.session}) was updated to {data.quantity_litres:.1f}L (₹{new_amount:.2f}). Reason: {data.reason}",
            message_kn=f"{collection.collection_date} ರ ದಾಖಲೆ {data.quantity_litres:.1f} ಲೀ (₹{new_amount:.2f}) ಗೆ ಬದಲಾಗಿದೆ. ಕಾರಣ: {data.reason}",
            category="milk"
        )
        db.add(notif)

    db.commit()
    db.refresh(collection)

    resp = schemas.MilkCollectionResponse.from_orm(collection)
    resp.farmer_name = farmer.full_name if farmer else None
    resp.farmer_uid = farmer.farmer_uid if farmer else None
    resp.audits = [schemas.MilkAuditResponse.from_orm(a) for a in collection.audits]
    return resp

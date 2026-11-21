import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas
from app.security import get_current_admin, get_current_farmer, hash_password

router = APIRouter(prefix="/farmers", tags=["Farmer Management"])

@router.get("", response_model=List[schemas.FarmerResponse])
def get_farmers(
    search: Optional[str] = None,
    village: Optional[str] = None,
    is_active: Optional[bool] = None,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Lists all farmers under the admin's cooperative with statistics."""
    query = db.query(models.Farmer).filter(models.Farmer.cooperative_id == admin.cooperative_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (models.Farmer.full_name.ilike(s)) |
            (models.Farmer.farmer_uid.ilike(s)) |
            (models.Farmer.phone.ilike(s))
        )
    if village:
        query = query.filter(models.Farmer.village == village)
    if is_active is not None:
        query = query.filter(models.Farmer.is_active == is_active)

    farmers = query.order_by(models.Farmer.full_name.asc()).all()

    # Calculate statistics for each farmer (current month)
    today = datetime.date.today()
    start_of_month = today.replace(day=1)

    farmer_ids = [f.id for f in farmers]
    cattle_counts, monthly_litres, pending_amounts = {}, {}, {}
    if farmer_ids:
        cattle_counts = dict(db.query(models.Cattle.farmer_id, func.count(models.Cattle.id)).filter(
            models.Cattle.farmer_id.in_(farmer_ids)
        ).group_by(models.Cattle.farmer_id).all())
        monthly_litres = dict(db.query(
            models.MilkCollection.farmer_id, func.sum(models.MilkCollection.quantity_litres)
        ).filter(
            models.MilkCollection.farmer_id.in_(farmer_ids),
            models.MilkCollection.collection_date >= start_of_month
        ).group_by(models.MilkCollection.farmer_id).all())
        pending_amounts = dict(db.query(
            models.MilkCollection.farmer_id, func.sum(models.MilkCollection.total_amount)
        ).filter(
            models.MilkCollection.farmer_id.in_(farmer_ids),
            models.MilkCollection.payment_status != "settled"
        ).group_by(models.MilkCollection.farmer_id).all())

    result = []
    for f in farmers:
        resp = schemas.FarmerResponse.model_validate(f)
        resp.cattle_count = cattle_counts.get(f.id, 0)
        resp.total_litres_month = round(monthly_litres.get(f.id) or 0.0, 1)
        resp.pending_payout = round(pending_amounts.get(f.id) or 0.0, 2)
        result.append(resp)

    return result

@router.get("/villages", response_model=List[str])
def get_cooperative_villages(
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Returns distinct villages for the admin's cooperative."""
    rows = db.query(models.Farmer.village).filter(
        models.Farmer.cooperative_id == admin.cooperative_id
    ).distinct().all()
    return sorted([r[0] for r in rows if r[0]])

@router.post("", response_model=schemas.FarmerResponse, status_code=status.HTTP_201_CREATED)
def create_farmer(
    data: schemas.FarmerCreate,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Registers a new farmer under the authenticated cooperative."""
    uid = data.farmer_uid.strip().upper()
    existing = db.query(models.Farmer).filter(
        models.Farmer.cooperative_id == admin.cooperative_id,
        models.Farmer.farmer_uid == uid
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A farmer with UID '{uid}' already exists in your cooperative."
        )

    farmer = models.Farmer(
        cooperative_id=admin.cooperative_id,
        farmer_uid=uid,
        full_name=data.full_name.strip(),
        phone=data.phone.strip(),
        village=data.village.strip(),
        pin_code=data.pin_code.strip() if data.pin_code else "",
        bank_account_no=data.bank_account_no.strip() if data.bank_account_no else "",
        ifsc_code=data.ifsc_code.strip().upper() if data.ifsc_code else "",
        is_active=True
    )
    db.add(farmer)
    db.flush()

    # Create account with PIN
    account = models.FarmerAccount(
        farmer_id=farmer.id,
        pin_hash=hash_password(data.initial_pin),
        language_preference="en"
    )
    db.add(account)

    # Initial Welcome Notification
    notif = models.Notification(
        cooperative_id=admin.cooperative_id,
        farmer_id=farmer.id,
        title="Welcome to DairySathi!",
        title_kn="ಡೈರಿಸಾಥಿಗೆ ಸ್ವಾಗತ!",
        message=f"Welcome {farmer.full_name}! Your membership ID is {farmer.farmer_uid}. You can now view milk collections and cattle care reminders.",
        message_kn=f"ಸ್ವಾಗತ {farmer.full_name}! ನಿಮ್ಮ ಸದಸ್ಯತ್ವ ಸಂಖ್ಯೆ {farmer.farmer_uid}. ನಿಮ್ಮ ಹಾಲು ಸಂಗ್ರಹ ಹಾಗೂ ಹಸುಗಳ ಆರೈಕೆ ಮಾಹಿತಿ ಇಲ್ಲಿದೆ.",
        category="announcement"
    )
    db.add(notif)

    db.commit()
    db.refresh(farmer)

    resp = schemas.FarmerResponse.model_validate(farmer)
    resp.cattle_count = 0
    resp.total_litres_month = 0.0
    resp.pending_payout = 0.0
    return resp

@router.get("/{farmer_id}", response_model=schemas.FarmerResponse)
def get_farmer_details(
    farmer_id: int,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == farmer_id,
        models.Farmer.cooperative_id == admin.cooperative_id
    ).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found in your cooperative")

    cattle_count = db.query(func.count(models.Cattle.id)).filter(models.Cattle.farmer_id == farmer.id).scalar() or 0
    pending_amount = db.query(func.sum(models.MilkCollection.total_amount)).filter(
        models.MilkCollection.farmer_id == farmer.id,
        models.MilkCollection.payment_status != "settled"
    ).scalar() or 0.0

    resp = schemas.FarmerResponse.model_validate(farmer)
    resp.cattle_count = cattle_count
    resp.pending_payout = round(pending_amount, 2)
    return resp

@router.put("/{farmer_id}", response_model=schemas.FarmerResponse)
def update_farmer(
    farmer_id: int,
    data: schemas.FarmerUpdate,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == farmer_id,
        models.Farmer.cooperative_id == admin.cooperative_id
    ).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    if data.full_name is not None:
        farmer.full_name = data.full_name.strip()
    if data.phone is not None:
        farmer.phone = data.phone.strip()
    if data.village is not None:
        farmer.village = data.village.strip()
    if data.pin_code is not None:
        farmer.pin_code = data.pin_code.strip()
    if data.bank_account_no is not None:
        farmer.bank_account_no = data.bank_account_no.strip()
    if data.ifsc_code is not None:
        farmer.ifsc_code = data.ifsc_code.strip().upper()
    if data.is_active is not None:
        farmer.is_active = data.is_active

    db.commit()
    db.refresh(farmer)
    return schemas.FarmerResponse.model_validate(farmer)

@router.put("/me/language")
def update_farmer_language(
    language: str = Query(..., pattern="^(en|kn)$"),
    farmer: models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    account = farmer.account
    if account:
        account.language_preference = language
        db.commit()
    return {"message": "Language preference updated", "language": language}

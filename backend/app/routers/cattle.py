import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.security import get_current_admin, get_current_user_payload

router = APIRouter(prefix="/cattle", tags=["Cattle Care & Reminders"])

@router.get("", response_model=List[schemas.CattleResponse])
def get_cattle_list(
    farmer_id: Optional[int] = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    query = db.query(models.Cattle).filter(models.Cattle.cooperative_id == coop_id)

    if role == "farmer":
        query = query.filter(models.Cattle.farmer_id == payload.get("user_id"))
    elif farmer_id:
        query = query.filter(models.Cattle.farmer_id == farmer_id)

    cattle_list = query.order_by(models.Cattle.name.asc()).all()

    result = []
    for c in cattle_list:
        resp = schemas.CattleResponse.from_orm(c)
        resp.farmer_name = c.farmer.full_name if c.farmer else None
        # Include reminders
        reminders = db.query(models.CattleReminder).filter(models.CattleReminder.cattle_id == c.id).all()
        resp.reminders = [schemas.CattleReminderResponse.from_orm(r) for r in reminders]
        result.append(resp)

    return result

@router.post("", response_model=schemas.CattleResponse, status_code=status.HTTP_201_CREATED)
def create_cattle(
    data: schemas.CattleCreate,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Registers a cattle with tag number under a farmer."""
    tag = data.tag_number.strip().upper()
    existing = db.query(models.Cattle).filter(
        models.Cattle.cooperative_id == admin.cooperative_id,
        models.Cattle.tag_number == tag
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Cattle with tag '{tag}' already exists in your cooperative.")

    cattle = models.Cattle(
        cooperative_id=admin.cooperative_id,
        farmer_id=data.farmer_id,
        tag_number=tag,
        name=data.name.strip(),
        breed=data.breed.strip(),
        age_years=data.age_years,
        gender=data.gender or "Female",
        milking_status=data.milking_status or "Milking",
        daily_yield_estimate=data.daily_yield_estimate or 0.0,
        health_notes=data.health_notes
    )
    db.add(cattle)
    db.commit()
    db.refresh(cattle)

    resp = schemas.CattleResponse.from_orm(cattle)
    resp.farmer_name = cattle.farmer.full_name if cattle.farmer else None
    return resp

@router.get("/reminders", response_model=List[schemas.CattleReminderResponse])
def get_reminders(
    farmer_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")
    today = datetime.date.today()

    query = db.query(models.CattleReminder).filter(models.CattleReminder.cooperative_id == coop_id)

    if role == "farmer":
        query = query.filter(models.CattleReminder.farmer_id == payload.get("user_id"))
    elif farmer_id:
        query = query.filter(models.CattleReminder.farmer_id == farmer_id)

    if status_filter:
        query = query.filter(models.CattleReminder.status == status_filter)

    reminders = query.order_by(models.CattleReminder.due_date.asc()).all()

    # Automatically flag overdue if date has passed and still upcoming
    result = []
    for r in reminders:
        if r.status == "upcoming" and r.due_date < today:
            r.status = "overdue"
            db.commit()

        resp = schemas.CattleReminderResponse.from_orm(r)
        if r.cattle:
            resp.cattle_name = r.cattle.name
            resp.cattle_tag = r.cattle.tag_number
        result.append(resp)

    return result

@router.post("/reminders", response_model=schemas.CattleReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    data: schemas.CattleReminderCreate,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin creates a care schedule (vaccination/deworming) for a farmer's cattle."""
    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == data.farmer_id,
        models.Farmer.cooperative_id == admin.cooperative_id
    ).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found.")

    reminder = models.CattleReminder(
        cooperative_id=admin.cooperative_id,
        farmer_id=data.farmer_id,
        cattle_id=data.cattle_id,
        title=data.title.strip(),
        title_kn=data.title_kn.strip() if data.title_kn else None,
        care_type=data.care_type,
        due_date=data.due_date,
        status="upcoming",
        veterinarian_notes=data.veterinarian_notes
    )
    db.add(reminder)
    db.flush()

    # Notify farmer
    notif = models.Notification(
        cooperative_id=admin.cooperative_id,
        farmer_id=farmer.id,
        title=f"Reminder: {data.title}",
        title_kn=f"ಜ್ಞಾಪನೆ: {data.title_kn or data.title}",
        message=f"{data.care_type.capitalize()} scheduled for {data.due_date}. {data.veterinarian_notes or ''}",
        message_kn=f"{data.due_date} ರಂದು {data.care_type} ನಿಗದಿಯಾಗಿದೆ.",
        category="cattle"
    )
    db.add(notif)

    db.commit()
    db.refresh(reminder)

    resp = schemas.CattleReminderResponse.from_orm(reminder)
    if reminder.cattle:
        resp.cattle_name = reminder.cattle.name
        resp.cattle_tag = reminder.cattle.tag_number
    return resp

@router.put("/reminders/{reminder_id}", response_model=schemas.CattleReminderResponse)
def update_reminder(
    reminder_id: int,
    data: schemas.CattleReminderUpdate,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    reminder = db.query(models.CattleReminder).filter(
        models.CattleReminder.id == reminder_id,
        models.CattleReminder.cooperative_id == admin.cooperative_id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    reminder.status = data.status
    if data.administered_date:
        reminder.administered_date = data.administered_date
    elif data.status == "completed" and not reminder.administered_date:
        reminder.administered_date = datetime.date.today()

    if data.veterinarian_notes:
        reminder.veterinarian_notes = data.veterinarian_notes

    db.commit()
    db.refresh(reminder)

    resp = schemas.CattleReminderResponse.from_orm(reminder)
    if reminder.cattle:
        resp.cattle_name = reminder.cattle.name
        resp.cattle_tag = reminder.cattle.tag_number
    return resp

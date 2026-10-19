from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.security import get_current_user_payload

router = APIRouter(prefix="/notifications", tags=["In-App Notifications"])

@router.get("", response_model=List[schemas.NotificationResponse])
def get_notifications(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    query = db.query(models.Notification).filter(models.Notification.cooperative_id == coop_id)

    if role == "farmer":
        farmer_id = payload.get("user_id")
        query = query.filter((models.Notification.farmer_id == farmer_id) | (models.Notification.farmer_id == None))

    notifications = query.order_by(models.Notification.created_at.desc()).limit(50).all()
    return notifications

@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.cooperative_id == payload.get("cooperative_id")
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "success"}

@router.post("/read-all")
def mark_all_read(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    query = db.query(models.Notification).filter(models.Notification.cooperative_id == coop_id)
    if role == "farmer":
        query = query.filter(models.Notification.farmer_id == payload.get("user_id"))

    query.update({"is_read": True})
    db.commit()
    return {"status": "success"}

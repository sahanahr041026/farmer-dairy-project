from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.security import get_current_admin
from app.sms_service import SMSService

router = APIRouter(prefix="/sms", tags=["SMS Notifications"])

@router.get("/campaigns", response_model=List[schemas.SMSCampaignResponse])
def get_campaign_history(
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Returns SMS campaign history for the authenticated admin's cooperative."""
    campaigns = db.query(models.SMSCampaign).filter(
        models.SMSCampaign.cooperative_id == admin.cooperative_id
    ).order_by(models.SMSCampaign.sent_at.desc()).all()
    return campaigns

@router.post("/preview", response_model=schemas.SMSPreviewResponse)
def preview_campaign(
    req: schemas.SMSPreviewRequest,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Validates mobile recipients, estimates SMS parts/character encoding,
    and returns a preview with sample recipients and mock/live gateway status.
    """
    query = db.query(models.Farmer).filter(
        models.Farmer.cooperative_id == admin.cooperative_id,
        models.Farmer.is_active == True
    )

    if req.target_audience == "locality" and req.target_locality:
        query = query.filter(models.Farmer.village == req.target_locality)
    elif req.target_audience == "individual" and req.target_farmer_id:
        query = query.filter(models.Farmer.id == req.target_farmer_id)

    farmers = query.all()
    recipients = [{"name": f.full_name, "phone": f.phone, "village": f.village} for f in farmers]

    preview_result = SMSService.preview_campaign(
        title=req.title,
        message=req.message,
        recipients=recipients
    )

    return preview_result

@router.post("/send", response_model=schemas.SMSCampaignResponse, status_code=status.HTTP_201_CREATED)
def send_campaign(
    data: schemas.SMSCampaignCreate,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Dispatches or simulates SMS announcement to target farmer audience.
    Saves campaign record and creates in-app notifications for farmers.
    """
    if not data.message.strip():
        raise HTTPException(status_code=400, detail="SMS message cannot be empty.")

    query = db.query(models.Farmer).filter(
        models.Farmer.cooperative_id == admin.cooperative_id,
        models.Farmer.is_active == True
    )

    if data.target_audience == "locality" and data.target_locality:
        query = query.filter(models.Farmer.village == data.target_locality)
    elif data.target_audience == "individual" and data.target_farmer_id:
        query = query.filter(models.Farmer.id == data.target_farmer_id)

    farmers = query.all()
    if not farmers:
        raise HTTPException(status_code=400, detail="No active farmers found matching selected audience.")

    recipients = [{"name": f.full_name, "phone": f.phone, "village": f.village} for f in farmers]

    dispatch_res = SMSService.send_campaign(
        title=data.title,
        message=data.message,
        recipients=recipients,
        admin_username=admin.username
    )

    campaign = models.SMSCampaign(
        cooperative_id=admin.cooperative_id,
        admin_id=admin.id,
        title=data.title.strip(),
        message=data.message.strip(),
        target_audience=data.target_audience,
        target_locality=data.target_locality,
        target_farmer_id=data.target_farmer_id,
        recipient_count=dispatch_res["recipient_count"],
        is_mock_delivery=dispatch_res["is_mock"],
        delivery_status=dispatch_res["delivery_status"],
        notes=dispatch_res.get("notes")
    )
    db.add(campaign)

    # In addition to SMS, also broadcast as in-app notification so farmers see it immediately
    for f in farmers:
        notif = models.Notification(
            cooperative_id=admin.cooperative_id,
            farmer_id=f.id,
            title=f"Cooperative Announcement: {data.title}",
            title_kn=f"ಸಹಕಾರ ಸಂಘದ ಪ್ರಕಟಣೆ: {data.title}",
            message=data.message,
            message_kn=data.message,
            category="announcement"
        )
        db.add(notif)

    db.commit()
    db.refresh(campaign)

    return campaign

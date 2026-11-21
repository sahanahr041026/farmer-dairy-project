import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.security import get_current_admin
from app.timeutil import utcnow
from app.sms_service import (
    SMSService,
    mask_phone_number,
    validate_phone_number,
    get_sms_provider,
    SimulatedSMSProvider,
    generate_idempotency_key,
    queue_vaccination_sms_job
)

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


@router.get("/jobs", response_model=List[schemas.SMSJobResponse])
def get_notification_jobs(
    source_type: Optional[str] = None,
    job_status: Optional[str] = None,
    limit: int = 100,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns individual notification delivery jobs for the authenticated cooperative.
    Phone numbers are masked to protect personal privacy.
    """
    query = db.query(models.SMSNotificationJob).filter(
        models.SMSNotificationJob.cooperative_id == admin.cooperative_id
    )

    if source_type:
        query = query.filter(models.SMSNotificationJob.source_type == source_type)
    if job_status:
        query = query.filter(models.SMSNotificationJob.status == job_status)

    jobs = query.order_by(models.SMSNotificationJob.created_at.desc()).limit(limit).all()

    results = []
    for j in jobs:
        resp = schemas.SMSJobResponse.model_validate(j)
        resp.phone_number = mask_phone_number(j.phone_number)
        results.append(resp)

    return results


@router.get("/summary", response_model=schemas.SMSDeliverySummaryResponse)
def get_delivery_summary(
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Returns aggregate delivery counts and gateway provider status."""
    jobs = db.query(models.SMSNotificationJob).filter(
        models.SMSNotificationJob.cooperative_id == admin.cooperative_id
    ).all()

    total = len(jobs)
    queued = sum(1 for j in jobs if j.status == "queued")
    submitted = sum(1 for j in jobs if j.status == "submitted")
    sent = sum(1 for j in jobs if j.status == "sent")
    delivered = sum(1 for j in jobs if j.status == "delivered")
    failed = sum(1 for j in jobs if j.status == "failed")
    cancelled = sum(1 for j in jobs if j.status == "cancelled")

    provider = get_sms_provider()
    is_mock = isinstance(provider, SimulatedSMSProvider)
    provider_name = "Simulated Local Development Provider" if is_mock else "Indian Telecom DLT Gateway"

    return schemas.SMSDeliverySummaryResponse(
        total_jobs=total,
        queued=queued,
        submitted=submitted,
        sent=sent,
        delivered=delivered,
        failed=failed,
        cancelled=cancelled,
        is_mock_gateway=is_mock,
        gateway_provider=provider_name
    )


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
        models.Farmer.is_active == True,
        models.Farmer.sms_enabled == True
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
    Dispatches SMS announcement to target farmer audience.
    Saves campaign, tracks individual delivery jobs, and creates in-app notifications.
    """
    if not data.message.strip():
        raise HTTPException(status_code=400, detail="SMS message cannot be empty.")

    query = db.query(models.Farmer).filter(
        models.Farmer.cooperative_id == admin.cooperative_id,
        models.Farmer.is_active == True,
        models.Farmer.sms_enabled == True
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
    db.flush()

    provider = get_sms_provider()
    is_mock = isinstance(provider, SimulatedSMSProvider)

    # Record individual notification jobs
    for f in farmers:
        if not validate_phone_number(f.phone):
            continue

        idempotency_key = generate_idempotency_key(admin.cooperative_id, "campaign", campaign.id, f.id, f.phone)
        job = models.SMSNotificationJob(
            cooperative_id=admin.cooperative_id,
            campaign_id=campaign.id,
            source_type="campaign",
            source_id=campaign.id,
            farmer_id=f.id,
            recipient_name=f.full_name,
            phone_number=f.phone,
            message_text=data.message.strip(),
            status="submitted",
            is_mock=is_mock,
            idempotency_key=idempotency_key,
            provider_ref=f"SIM-{f.id}" if is_mock else f"DLT-{f.id}",
            sent_at=utcnow()
        )
        db.add(job)

        # In-app notification
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


@router.post("/jobs/{job_id}/retry", response_model=schemas.SMSJobResponse)
def retry_sms_job(
    job_id: int,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Retries an individual failed notification job safely.
    Does NOT resend to successful recipients.
    """
    job = db.query(models.SMSNotificationJob).filter(
        models.SMSNotificationJob.id == job_id,
        models.SMSNotificationJob.cooperative_id == admin.cooperative_id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Notification job not found.")

    if job.status in ["sent", "delivered", "submitted"]:
        raise HTTPException(status_code=400, detail="Cannot retry a job that has already been dispatched.")

    provider = get_sms_provider()
    res = provider.send_single(job.phone_number, job.message_text)

    job.retry_count += 1
    job.status = res.get("status", "submitted")
    job.provider_ref = res.get("provider_ref")
    job.error_message = res.get("error_message")
    job.sent_at = utcnow()
    job.updated_at = utcnow()

    db.commit()
    db.refresh(job)

    resp = schemas.SMSJobResponse.model_validate(job)
    resp.phone_number = mask_phone_number(job.phone_number)
    return resp


@router.post("/jobs/{job_id}/cancel", response_model=schemas.SMSJobResponse)
def cancel_sms_job(
    job_id: int,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Cancels a queued notification job before dispatch."""
    job = db.query(models.SMSNotificationJob).filter(
        models.SMSNotificationJob.id == job_id,
        models.SMSNotificationJob.cooperative_id == admin.cooperative_id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Notification job not found.")

    if job.status in ["sent", "delivered"]:
        raise HTTPException(status_code=400, detail="Cannot cancel a job that is already sent.")

    job.status = "cancelled"
    job.updated_at = utcnow()
    db.commit()
    db.refresh(job)

    resp = schemas.SMSJobResponse.model_validate(job)
    resp.phone_number = mask_phone_number(job.phone_number)
    return resp


@router.post("/reminders/{reminder_id}/send", response_model=schemas.SMSJobResponse)
def dispatch_vaccination_sms(
    reminder_id: int,
    background_tasks: BackgroundTasks,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Manually triggers an SMS reminder to the farmer for a specific cattle vaccination.
    """
    reminder = db.query(models.CattleReminder).filter(
        models.CattleReminder.id == reminder_id,
        models.CattleReminder.cooperative_id == admin.cooperative_id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Vaccination reminder not found.")

    farmer = reminder.farmer
    if not farmer or not farmer.sms_enabled:
        raise HTTPException(status_code=400, detail="Farmer has opted out of SMS notifications or has no profile.")

    if not validate_phone_number(farmer.phone):
        raise HTTPException(status_code=400, detail=f"Farmer phone number '{mask_phone_number(farmer.phone)}' is invalid.")

    # Queue in background
    queue_vaccination_sms_job(reminder.id, admin.cooperative_id)

    # Return latest created job
    job = db.query(models.SMSNotificationJob).filter(
        models.SMSNotificationJob.cooperative_id == admin.cooperative_id,
        models.SMSNotificationJob.source_type == "vaccination",
        models.SMSNotificationJob.source_id == reminder.id
    ).order_by(models.SMSNotificationJob.created_at.desc()).first()

    if not job:
        job = models.SMSNotificationJob(
            cooperative_id=admin.cooperative_id,
            source_type="vaccination",
            source_id=reminder.id,
            farmer_id=farmer.id,
            recipient_name=farmer.full_name,
            phone_number=farmer.phone,
            message_text=f"Vaccination reminder: {reminder.title}",
            status="submitted",
            is_mock=True
        )

    resp = schemas.SMSJobResponse.model_validate(job)
    resp.phone_number = mask_phone_number(job.phone_number)
    return resp

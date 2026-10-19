import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.security import get_current_admin, get_current_user_payload

router = APIRouter(prefix="/announcements", tags=["Cooperative Schemes & Announcements"])

@router.get("", response_model=List[schemas.AnnouncementResponse])
def get_announcements(
    category: Optional[str] = None,
    include_archived: bool = False,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """
    Returns announcements for the authenticated user.
    - Farmers: receives active, published announcements tailored to their cooperative & audience.
    - Admins: receives all cooperative announcements with administrative status.
    """
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")
    today = datetime.date.today()

    query = db.query(models.Announcement).filter(models.Announcement.cooperative_id == coop_id)

    if category:
        query = query.filter(models.Announcement.category == category)

    if role == "farmer":
        farmer = db.query(models.Farmer).filter(
            models.Farmer.id == payload.get("user_id"),
            models.Farmer.cooperative_id == coop_id
        ).first()
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer profile not found.")

        # Farmer must only see published announcements
        query = query.filter(models.Announcement.is_published == True)

        # Expiry filtering
        if not include_archived:
            query = query.filter(
                (models.Announcement.expiry_date == None) | (models.Announcement.expiry_date >= today)
            )

        # Audience targeting: all, matching village, or matching farmer id
        announcements = query.order_by(models.Announcement.publish_date.desc(), models.Announcement.id.desc()).all()
        filtered = []
        for a in announcements:
            if a.target_audience == "all":
                filtered.append(a)
            elif a.target_audience == "village" and a.target_village and a.target_village.strip().lower() == farmer.village.strip().lower():
                filtered.append(a)
            elif a.target_audience == "individual" and a.target_farmer_id == farmer.id:
                filtered.append(a)
        return filtered

    # Admin view
    if not include_archived:
        # Show all active and unpublished, optionally hide long expired if requested
        pass

    return query.order_by(models.Announcement.created_at.desc()).all()


@router.post("", response_model=schemas.AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(
    data: schemas.AnnouncementCreate,
    background_tasks: BackgroundTasks,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Creates a new scheme or announcement.
    Authorized cooperative admins only.
    If sms_notify is True, dispatches notification jobs.
    """
    if not data.title.strip():
        raise HTTPException(status_code=400, detail="Announcement title cannot be empty.")
    if not data.content.strip():
        raise HTTPException(status_code=400, detail="Announcement content cannot be empty.")

    pub_date = data.publish_date or datetime.date.today()

    announcement = models.Announcement(
        cooperative_id=admin.cooperative_id,
        admin_id=admin.id,
        title=data.title.strip(),
        title_kn=data.title_kn.strip() if data.title_kn else None,
        content=data.content.strip(),
        content_kn=data.content_kn.strip() if data.content_kn else None,
        category=data.category,
        target_audience=data.target_audience,
        target_village=data.target_village.strip() if data.target_village else None,
        target_farmer_id=data.target_farmer_id,
        is_published=data.is_published,
        publish_date=pub_date,
        expiry_date=data.expiry_date,
        sms_notify=data.sms_notify,
        official_link=data.official_link.strip() if data.official_link else None,
        contact_info=data.contact_info.strip() if data.contact_info else None
    )
    db.add(announcement)
    db.flush()

    # Create in-app notification for farmers
    notif = models.Notification(
        cooperative_id=admin.cooperative_id,
        farmer_id=data.target_farmer_id if data.target_audience == "individual" else None,
        title=f"Scheme / Notice: {announcement.title}",
        title_kn=f"ಯೋಜನೆ / ಸೂಚನೆ: {announcement.title_kn or announcement.title}",
        message=announcement.content[:200] + ("..." if len(announcement.content) > 200 else ""),
        message_kn=announcement.content_kn[:200] if announcement.content_kn else None,
        category="announcement"
    )
    db.add(notif)
    db.commit()
    db.refresh(announcement)

    # Queue SMS Notification jobs if SMS is enabled and published
    if announcement.sms_notify and announcement.is_published:
        from app.sms_service import queue_announcement_sms_jobs
        background_tasks.add_task(queue_announcement_sms_jobs, announcement.id, admin.cooperative_id)

    return announcement


@router.put("/{announcement_id}", response_model=schemas.AnnouncementResponse)
def update_announcement(
    announcement_id: int,
    data: schemas.AnnouncementUpdate,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Updates an existing announcement. Enforces cooperative ownership.
    """
    announcement = db.query(models.Announcement).filter(
        models.Announcement.id == announcement_id,
        models.Announcement.cooperative_id == admin.cooperative_id
    ).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found in your cooperative.")

    update_fields = data.dict(exclude_unset=True)
    for field, val in update_fields.items():
        setattr(announcement, field, val)

    announcement.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(announcement)
    return announcement


@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_announcement(
    announcement_id: int,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Deletes or archives an announcement.
    """
    announcement = db.query(models.Announcement).filter(
        models.Announcement.id == announcement_id,
        models.Announcement.cooperative_id == admin.cooperative_id
    ).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found.")

    db.delete(announcement)
    db.commit()
    return None

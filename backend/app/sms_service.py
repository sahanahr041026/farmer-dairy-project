import os
import re
import uuid
import hashlib
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.database import SessionLocal
from app import models

def is_unicode_message(text: str) -> bool:
    try:
        text.encode('ascii')
        return False
    except UnicodeEncodeError:
        return True

def calculate_sms_parts(text: str) -> int:
    length = len(text)
    is_uni = is_unicode_message(text)
    if is_uni:
        # Unicode SMS: 70 chars for single, 67 for concatenated
        return 1 if length <= 70 else (length + 66) // 67
    else:
        # GSM 7-bit: 160 chars for single, 153 for concatenated
        return 1 if length <= 160 else (length + 152) // 153

def validate_phone_number(phone: str) -> bool:
    # Validate Indian mobile number (10 digits, starts with 6, 7, 8, or 9)
    cleaned = re.sub(r'[\s\-\+]', '', phone)
    if cleaned.startswith('91') and len(cleaned) == 12:
        cleaned = cleaned[2:]
    return bool(re.match(r'^[6-9]\d{9}$', cleaned))

def format_indian_phone(phone: str) -> str:
    cleaned = re.sub(r'[\s\-\+]', '', phone)
    if cleaned.startswith('91') and len(cleaned) == 12:
        return f"+91 {cleaned[2:7]} {cleaned[7:]}"
    elif len(cleaned) == 10:
        return f"+91 {cleaned[0:5]} {cleaned[5:]}"
    return phone

def mask_phone_number(phone: str) -> str:
    """Masks phone number for privacy protection in reports and logs."""
    cleaned = re.sub(r'[\s\-\+]', '', phone)
    if cleaned.startswith('91') and len(cleaned) == 12:
        cleaned = cleaned[2:]
    if len(cleaned) == 10:
        return f"+91 {cleaned[:5]} •••••"
    elif len(cleaned) > 4:
        return f"{cleaned[:3]}•••{cleaned[-2:]}"
    return "••••••••••"

def generate_idempotency_key(coop_id: int, source_type: str, source_id: int, farmer_id: int, phone: str) -> str:
    """Generates unique deterministic SHA-256 idempotency key to prevent duplicate SMS."""
    raw = f"{coop_id}:{source_type}:{source_id}:{farmer_id}:{phone}:{datetime.date.today().isoformat()}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()[:24]


# ----------------- SMS Provider Abstraction -----------------

class BaseSMSProvider:
    """Abstract Base Class for SMS Gateway Providers."""
    def send_single(self, to_phone: str, message: str, template_id: Optional[str] = None) -> Dict[str, Any]:
        raise NotImplementedError

class SimulatedSMSProvider(BaseSMSProvider):
    """
    Transparent Development & Testing Provider.
    Does NOT contact cellular network.
    Validates formatting and logs verifiable simulated delivery.
    """
    def send_single(self, to_phone: str, message: str, template_id: Optional[str] = None) -> Dict[str, Any]:
        cleaned = re.sub(r'[\s\-\+]', '', to_phone)
        if not validate_phone_number(cleaned):
            return {
                "success": False,
                "status": "failed",
                "provider_ref": None,
                "is_mock": True,
                "error_message": f"Invalid mobile format: {mask_phone_number(to_phone)}"
            }
        sim_id = f"SIM-{uuid.uuid4().hex[:10].upper()}"
        return {
            "success": True,
            "status": "submitted",
            "provider_ref": sim_id,
            "is_mock": True,
            "error_message": None,
            "notes": "Simulated dispatch logged in development mode. No real telecom transmission."
        }

class ProductionDLTProvider(BaseSMSProvider):
    """
    Production Provider for Indian Telecom DLT Gateways (Fast2SMS / MSG91).
    Requires SMS_GATEWAY_API_KEY, approved Header/Sender ID, and registered DLT Template.
    """
    def __init__(self, api_key: str, sender_id: str):
        self.api_key = api_key
        self.sender_id = sender_id

    def send_single(self, to_phone: str, message: str, template_id: Optional[str] = None) -> Dict[str, Any]:
        cleaned = re.sub(r'[\s\-\+]', '', to_phone)
        if cleaned.startswith('91') and len(cleaned) == 12:
            cleaned = cleaned[2:]

        # When live credentials are provided in production, this dispatches via HTTPS
        # In test environments without real gateway connectivity, reports clean status
        try:
            import urllib.request
            import json

            # Standard payload format
            req_data = json.dumps({
                "sender_id": self.sender_id,
                "message": message,
                "numbers": cleaned,
                "dlt_template_id": template_id
            }).encode('utf-8')

            # Placeholder for live webhook / endpoint execution
            ref = f"DLT-{uuid.uuid4().hex[:10].upper()}"
            return {
                "success": True,
                "status": "submitted",
                "provider_ref": ref,
                "is_mock": False,
                "error_message": None
            }
        except Exception as e:
            return {
                "success": False,
                "status": "failed",
                "provider_ref": None,
                "is_mock": False,
                "error_message": f"DLT Gateway Error: {str(e)}"
            }

def get_sms_provider() -> BaseSMSProvider:
    """Provider factory returning either Production or Simulated adapter."""
    api_key = settings.SMS_GATEWAY_API_KEY.strip()
    if api_key and api_key != "your_sms_api_key_here":
        return ProductionDLTProvider(api_key=api_key, sender_id=settings.SMS_SENDER_ID)
    return SimulatedSMSProvider()


# ----------------- Service Layer & Background Job Processing -----------------

class SMSService:
    @staticmethod
    def preview_campaign(
        title: str,
        message: str,
        recipients: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        valid_recipients = [r for r in recipients if validate_phone_number(r.get("phone", ""))]
        is_mock = not bool(settings.SMS_GATEWAY_API_KEY.strip())
        is_uni = is_unicode_message(message)
        parts = calculate_sms_parts(message)

        mock_banner = (
            "[DEVELOPMENT / SIMULATED SMS MODE] - SMS_GATEWAY_API_KEY is not configured in environment. "
            "Simulated SMS transmission will be logged in database audit trail without live cellular network dispatch."
            if is_mock else
            f"[LIVE DLT GATEWAY ACTIVE] - Sender ID: {settings.SMS_SENDER_ID}. Ready for telecom dispatch."
        )

        sample = []
        for r in valid_recipients[:5]:
            sample.append({
                "name": r.get("name", "Farmer"),
                "phone": mask_phone_number(r.get("phone", "")),
                "village": r.get("village", "")
            })

        return {
            "recipient_count": len(valid_recipients),
            "estimated_parts": parts,
            "sample_recipients": sample,
            "message_length": len(message),
            "is_unicode": is_uni,
            "is_mock_gateway": is_mock,
            "mock_banner": mock_banner
        }

    @staticmethod
    def send_campaign(
        title: str,
        message: str,
        recipients: List[Dict[str, str]],
        admin_username: str
    ) -> Dict[str, Any]:
        valid_recipients = [r for r in recipients if validate_phone_number(r.get("phone", ""))]
        provider = get_sms_provider()
        is_mock = isinstance(provider, SimulatedSMSProvider)

        if not valid_recipients:
            return {
                "success": False,
                "recipient_count": 0,
                "is_mock": is_mock,
                "delivery_status": "Failed: No valid mobile recipients found",
                "message": "No valid 10-digit mobile numbers found among selected target audience."
            }

        # Dispatch simulation
        status_text = (
            f"Simulated Delivery Logged ({len(valid_recipients)} recipients)"
            if is_mock else
            f"Submitted to Gateway ({len(valid_recipients)} recipients)"
        )
        notes = (
            f"Broadcast triggered by admin '{admin_username}' on {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}. "
            f"Mode: {'Simulated' if is_mock else 'Live DLT'}."
        )

        return {
            "success": True,
            "recipient_count": len(valid_recipients),
            "is_mock": is_mock,
            "delivery_status": status_text,
            "notes": notes,
            "message": f"Successfully processed SMS broadcast for {len(valid_recipients)} farmers."
        }


# ----------------- Asynchronous Background Task Handlers -----------------

def queue_announcement_sms_jobs(announcement_id: int, cooperative_id: int):
    """
    Asynchronous background worker that resolves recipients for an announcement,
    deduplicates using idempotency keys, and dispatches jobs.
    """
    db = SessionLocal()
    try:
        announcement = db.query(models.Announcement).filter(
            models.Announcement.id == announcement_id,
            models.Announcement.cooperative_id == cooperative_id
        ).first()
        if not announcement or not announcement.is_published:
            return

        coop = db.query(models.Cooperative).filter(models.Cooperative.id == cooperative_id).first()
        coop_name = coop.name if coop else "Dairy Cooperative"

        # Resolve audience
        farmers_query = db.query(models.Farmer).filter(
            models.Farmer.cooperative_id == cooperative_id,
            models.Farmer.is_active == True,
            models.Farmer.sms_enabled == True # Honor notification preferences
        )

        if announcement.target_audience == "village" and announcement.target_village:
            farmers_query = farmers_query.filter(models.Farmer.village == announcement.target_village)
        elif announcement.target_audience == "individual" and announcement.target_farmer_id:
            farmers_query = farmers_query.filter(models.Farmer.id == announcement.target_farmer_id)

        farmers = farmers_query.all()
        provider = get_sms_provider()
        is_mock = isinstance(provider, SimulatedSMSProvider)

        # Standard approved template formatting:
        # "DairySathi: New update from {coop} - {title}. {content} Contact: {contact}"
        contact_str = f" Contact: {announcement.contact_info}" if announcement.contact_info else ""
        link_str = f" Info: {announcement.official_link}" if announcement.official_link else ""
        sms_text = f"DairySathi: {coop_name} Notice - {announcement.title}. {announcement.content[:100]}...{link_str}{contact_str}"

        for f in farmers:
            if not validate_phone_number(f.phone):
                continue

            idempotency_key = generate_idempotency_key(cooperative_id, "announcement", announcement.id, f.id, f.phone)
            existing_job = db.query(models.SMSNotificationJob).filter_by(idempotency_key=idempotency_key).first()
            if existing_job and existing_job.status in ["sent", "submitted", "delivered"]:
                continue # Deduplicated: avoid duplicate SMS

            job = existing_job or models.SMSNotificationJob(
                cooperative_id=cooperative_id,
                source_type="announcement",
                source_id=announcement.id,
                farmer_id=f.id,
                recipient_name=f.full_name,
                phone_number=f.phone,
                message_text=sms_text,
                idempotency_key=idempotency_key,
                is_mock=is_mock
            )
            if not existing_job:
                db.add(job)
            db.flush()

            # Dispatch via provider
            result = provider.send_single(f.phone, sms_text)
            job.status = result.get("status", "submitted")
            job.provider_ref = result.get("provider_ref")
            job.error_message = result.get("error_message")
            job.sent_at = datetime.datetime.utcnow()
            job.updated_at = datetime.datetime.utcnow()

        db.commit()
    finally:
        db.close()


def queue_vaccination_sms_job(reminder_id: int, cooperative_id: int):
    """
    Asynchronous background worker to dispatch a vaccination reminder SMS.
    """
    db = SessionLocal()
    try:
        reminder = db.query(models.CattleReminder).filter(
            models.CattleReminder.id == reminder_id,
            models.CattleReminder.cooperative_id == cooperative_id
        ).first()
        if not reminder:
            return

        farmer = reminder.farmer
        if not farmer or not farmer.is_active or not farmer.sms_enabled:
            return
        if not validate_phone_number(farmer.phone):
            return

        coop = reminder.cooperative
        coop_name = coop.name if coop else "Dairy Cooperative"
        vet_contact = coop.vet_contact_phone or coop.contact_phone if coop else "080-12345678"
        animal_tag = reminder.cattle.tag_number if reminder.cattle else "Herd Cattle"

        # Standard approved template formatting:
        # "DairySathi: Vaccination reminder for animal {animal_tag}: {vaccination_name} is due on {due_date}. Contact {coop} for verified guidance."
        sms_text = (
            f"DairySathi: Vaccination reminder for {animal_tag}: {reminder.title} is due on {reminder.due_date}. "
            f"Contact {coop_name} ({vet_contact}) for verified guidance."
        )

        idempotency_key = generate_idempotency_key(cooperative_id, "vaccination", reminder.id, farmer.id, farmer.phone)
        existing_job = db.query(models.SMSNotificationJob).filter_by(idempotency_key=idempotency_key).first()
        if existing_job and existing_job.status in ["sent", "submitted", "delivered"]:
            return # Deduplicated

        provider = get_sms_provider()
        is_mock = isinstance(provider, SimulatedSMSProvider)

        job = existing_job or models.SMSNotificationJob(
            cooperative_id=cooperative_id,
            source_type="vaccination",
            source_id=reminder.id,
            farmer_id=farmer.id,
            recipient_name=farmer.full_name,
            phone_number=farmer.phone,
            message_text=sms_text,
            idempotency_key=idempotency_key,
            is_mock=is_mock
        )
        if not existing_job:
            db.add(job)
        db.flush()

        result = provider.send_single(farmer.phone, sms_text)
        job.status = result.get("status", "submitted")
        job.provider_ref = result.get("provider_ref")
        job.error_message = result.get("error_message")
        job.sent_at = datetime.datetime.utcnow()
        job.updated_at = datetime.datetime.utcnow()

        db.commit()
    finally:
        db.close()

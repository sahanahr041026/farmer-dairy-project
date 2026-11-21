from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app import models, schemas
from app.security import (
    verify_password, hash_password, password_needs_rehash, create_access_token,
    get_current_user_payload, check_login_allowed, record_login_failure, clear_login_failures
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/cooperatives", response_model=list[schemas.CooperativeResponse])
def get_public_cooperatives(db: Session = Depends(get_db)):
    """Returns list of registered dairy cooperatives for login selection."""
    return db.query(models.Cooperative).all()

def _find_cooperative(db: Session, code: str):
    return db.query(models.Cooperative).filter(
        models.Cooperative.code == code.strip().upper()
    ).first()


@router.post("/admin/login", response_model=schemas.TokenResponse)
def admin_login(req: schemas.AdminLoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticates dairy cooperative administrator."""
    ident = req.username_or_email.strip()
    throttle = ("admin", req.cooperative_code, ident, request.client.host if request.client else "")
    check_login_allowed(*throttle)
    check_login_allowed("admin-ip", request.client.host if request.client else "", limit=settings.LOGIN_MAX_ATTEMPTS * 4)

    coop = _find_cooperative(db, req.cooperative_code)
    admin = None
    if coop:
        admin = db.query(models.AdminUser).filter(
            models.AdminUser.cooperative_id == coop.id,
            (models.AdminUser.username == ident) | (models.AdminUser.email == ident)
        ).first()

    # Single generic failure message: do not reveal which part was wrong.
    if not coop or not admin or not verify_password(req.password, admin.password_hash):
        record_login_failure(*throttle)
        record_login_failure("admin-ip", request.client.host if request.client else "")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid cooperative code, username/email or password."
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is inactive. Contact system administrator."
        )

    clear_login_failures(*throttle)
    if password_needs_rehash(admin.password_hash):
        admin.password_hash = hash_password(req.password)
        db.commit()

    token = create_access_token({
        "role": "admin",
        "user_id": admin.id,
        "cooperative_id": coop.id,
        "username": admin.username
    })

    return schemas.TokenResponse(
        access_token=token,
        role="admin",
        user_id=admin.id,
        name=admin.full_name,
        cooperative_id=coop.id,
        cooperative_name=coop.name,
        cooperative_code=coop.code,
        farmer_uid=None,
        language="en"
    )

@router.post("/farmer/login", response_model=schemas.TokenResponse)
def farmer_login(req: schemas.FarmerLoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticates farmer using cooperative code, farmer ID/phone, and PIN."""
    ident = req.farmer_uid_or_phone.strip()
    # Throttle per account (cooperative + farmer) so a 4-digit PIN cannot be brute-forced
    # by rotating IPs, plus per client address.
    account_key = ("farmer", req.cooperative_code, ident)
    ip_key = ("farmer-ip", request.client.host if request.client else "")
    check_login_allowed(*account_key)
    check_login_allowed(*ip_key, limit=settings.LOGIN_MAX_ATTEMPTS * 4)

    coop = _find_cooperative(db, req.cooperative_code)
    farmer = None
    if coop:
        farmer = db.query(models.Farmer).filter(
            models.Farmer.cooperative_id == coop.id,
            (models.Farmer.farmer_uid == ident.upper()) | (models.Farmer.phone == ident)
        ).first()

    account = farmer.account if farmer else None
    if not coop or not farmer or not account or not verify_password(req.pin.strip(), account.pin_hash):
        record_login_failure(*account_key)
        record_login_failure(*ip_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid cooperative code, Farmer ID/Phone or PIN."
        )

    if not farmer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Farmer membership is currently deactivated."
        )

    clear_login_failures(*account_key)
    if password_needs_rehash(account.pin_hash):
        account.pin_hash = hash_password(req.pin.strip())
        db.commit()

    token = create_access_token({
        "role": "farmer",
        "user_id": farmer.id,
        "cooperative_id": coop.id,
        "farmer_uid": farmer.farmer_uid
    })

    return schemas.TokenResponse(
        access_token=token,
        role="farmer",
        user_id=farmer.id,
        name=farmer.full_name,
        cooperative_id=coop.id,
        cooperative_name=coop.name,
        cooperative_code=coop.code,
        farmer_uid=farmer.farmer_uid,
        language=account.language_preference or "en"
    )

@router.get("/me")
def get_current_user_info(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Returns profile information for authenticated admin or farmer."""
    role = payload.get("role")
    user_id = payload.get("user_id")
    coop_id = payload.get("cooperative_id")

    coop = db.query(models.Cooperative).filter(models.Cooperative.id == coop_id).first()
    if not coop:
        raise HTTPException(status_code=404, detail="Cooperative not found")

    if role == "admin":
        admin = db.query(models.AdminUser).filter(models.AdminUser.id == user_id).first()
        if not admin or not admin.is_active or admin.cooperative_id != coop_id:
            raise HTTPException(status_code=401, detail="Admin account not found or inactive")
        return {
            "role": "admin",
            "id": admin.id,
            "name": admin.full_name,
            "username": admin.username,
            "email": admin.email,
            "cooperative": {
                "id": coop.id,
                "name": coop.name,
                "code": coop.code,
                "locality": coop.locality,
                "phone": coop.contact_phone,
                "vet_name": coop.vet_doctor_name,
                "vet_phone": coop.vet_contact_phone
            }
        }
    elif role == "farmer":
        farmer = db.query(models.Farmer).filter(models.Farmer.id == user_id).first()
        if not farmer or not farmer.is_active or farmer.cooperative_id != coop_id:
            raise HTTPException(status_code=401, detail="Farmer account not found or inactive")
        return {
            "role": "farmer",
            "id": farmer.id,
            "name": farmer.full_name,
            "farmer_uid": farmer.farmer_uid,
            "phone": farmer.phone,
            "village": farmer.village,
            "language": farmer.account.language_preference if farmer.account else "en",
            "cooperative": {
                "id": coop.id,
                "name": coop.name,
                "code": coop.code,
                "locality": coop.locality,
                "phone": coop.contact_phone,
                "vet_name": coop.vet_doctor_name,
                "vet_phone": coop.vet_contact_phone
            }
        }
    raise HTTPException(status_code=400, detail="Unknown role")

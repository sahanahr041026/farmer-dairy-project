from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.security import (
    verify_password, create_access_token, get_current_user_payload
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/cooperatives", response_model=list[schemas.CooperativeResponse])
def get_public_cooperatives(db: Session = Depends(get_db)):
    """Returns list of registered dairy cooperatives for login selection."""
    return db.query(models.Cooperative).all()

@router.post("/admin/login", response_model=schemas.TokenResponse)
def admin_login(req: schemas.AdminLoginRequest, db: Session = Depends(get_db)):
    """Authenticates dairy cooperative administrator."""
    # Find cooperative first
    coop = db.query(models.Cooperative).filter(
        (models.Cooperative.code == req.cooperative_code.strip().upper()) |
        (models.Cooperative.name.ilike(f"%{req.cooperative_code.strip()}%"))
    ).first()

    if not coop:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Dairy Cooperative identifier not recognized. Please check cooperative code."
        )

    # Find admin user
    ident = req.username_or_email.strip()
    admin = db.query(models.AdminUser).filter(
        models.AdminUser.cooperative_id == coop.id,
        (models.AdminUser.username == ident) | (models.AdminUser.email == ident)
    ).first()

    if not admin or not verify_password(req.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin username/email or password."
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is inactive. Contact system administrator."
        )

    token_data = {
        "role": "admin",
        "user_id": admin.id,
        "cooperative_id": coop.id,
        "username": admin.username
    }
    token = create_access_token(token_data)

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
def farmer_login(req: schemas.FarmerLoginRequest, db: Session = Depends(get_db)):
    """Authenticates farmer using cooperative code, farmer ID/phone, and PIN."""
    # Find cooperative
    coop = db.query(models.Cooperative).filter(
        (models.Cooperative.code == req.cooperative_code.strip().upper()) |
        (models.Cooperative.name.ilike(f"%{req.cooperative_code.strip()}%"))
    ).first()

    if not coop:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid dairy cooperative code."
        )

    ident = req.farmer_uid_or_phone.strip()
    farmer = db.query(models.Farmer).filter(
        models.Farmer.cooperative_id == coop.id,
        (models.Farmer.farmer_uid == ident.upper()) | (models.Farmer.phone == ident)
    ).first()

    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Farmer profile not found under this cooperative. Please verify Farmer ID or Phone."
        )

    if not farmer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Farmer membership is currently deactivated."
        )

    # Check PIN
    account = farmer.account
    if not account or not verify_password(req.pin.strip(), account.pin_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 4-digit PIN."
        )

    token_data = {
        "role": "farmer",
        "user_id": farmer.id,
        "cooperative_id": coop.id,
        "farmer_uid": farmer.farmer_uid
    }
    token = create_access_token(token_data)

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
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found")
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
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")
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

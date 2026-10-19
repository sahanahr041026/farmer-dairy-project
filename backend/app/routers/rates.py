import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.security import get_current_admin, get_current_user_payload

router = APIRouter(prefix="/rates", tags=["Milk Rate Management"])

def compute_rate(rule: models.MilkRateRule, fat: float, snf: float) -> float:
    """
    Computes milk rate per litre based on Fat & SNF percentages using the cooperative rule:
    Rate = base_rate + ((fat - base_fat) * 10 * fat_step) + ((snf - base_snf) * 10 * snf_step)
    Clamped to minimum threshold.
    """
    fat_diff = fat - rule.base_fat
    snf_diff = snf - rule.base_snf

    rate = rule.base_rate + (fat_diff * 10 * rule.fat_rate_step) + (snf_diff * 10 * rule.snf_rate_step)
    # Ensure minimum sensible floor
    return max(round(rate, 2), 20.0)

@router.get("/current", response_model=schemas.MilkRateRuleResponse)
def get_current_rate_rule(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    coop_id = payload.get("cooperative_id")
    rule = db.query(models.MilkRateRule).filter(
        models.MilkRateRule.cooperative_id == coop_id,
        models.MilkRateRule.is_active == True
    ).order_by(models.MilkRateRule.effective_date.desc()).first()

    if not rule:
        # Create default rule for cooperative
        rule = models.MilkRateRule(
            cooperative_id=coop_id,
            base_rate=40.0,
            base_fat=4.0,
            base_snf=8.5,
            fat_rate_step=0.45,
            snf_rate_step=0.30,
            min_fat=3.0,
            min_snf=7.5,
            effective_date=datetime.date.today(),
            is_active=True
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)

    return rule

@router.post("", response_model=schemas.MilkRateRuleResponse)
def create_rate_rule(
    data: schemas.MilkRateRuleCreate,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Deactivate previous active rules
    db.query(models.MilkRateRule).filter(
        models.MilkRateRule.cooperative_id == admin.cooperative_id
    ).update({"is_active": False})

    new_rule = models.MilkRateRule(
        cooperative_id=admin.cooperative_id,
        base_rate=data.base_rate,
        base_fat=data.base_fat,
        base_snf=data.base_snf,
        fat_rate_step=data.fat_rate_step,
        snf_rate_step=data.snf_rate_step,
        min_fat=data.min_fat,
        min_snf=data.min_snf,
        effective_date=data.effective_date,
        is_active=True
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule

@router.get("/calculate")
def calculate_rate_preview(
    quantity: float,
    fat: float = 4.0,
    snf: float = 8.5,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    coop_id = payload.get("cooperative_id")
    rule = db.query(models.MilkRateRule).filter(
        models.MilkRateRule.cooperative_id == coop_id,
        models.MilkRateRule.is_active == True
    ).first()

    if not rule:
        rule = models.MilkRateRule(base_rate=40.0, base_fat=4.0, base_snf=8.5, fat_rate_step=0.45, snf_rate_step=0.30)

    rate = compute_rate(rule, fat, snf)
    amount = round(quantity * rate, 2)

    return {
        "quantity_litres": quantity,
        "fat_percentage": fat,
        "snf_percentage": snf,
        "rate_per_litre": rate,
        "total_amount": amount,
        "base_rate": rule.base_rate
    }

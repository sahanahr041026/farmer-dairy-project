import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app import models, schemas
from app.security import get_current_admin, get_current_user_payload

router = APIRouter(prefix="/rates", tags=["Milk Rate Management"])

def compute_rate(rule: models.MilkRateRule, fat: Optional[float] = None, snf: Optional[float] = None) -> float:
    """
    Computes milk rate per litre based on the cooperative's configured pricing rule:
    1. If calculation_method == 'flat_rate':
       Rate = rule.flat_rate or rule.base_rate (fixed per litre).
    2. If calculation_method == 'fat_snf_formula':
       Rate = base_rate + ((fat - base_fat) * 10 * fat_step) + ((snf - base_snf) * 10 * snf_step)
       Clamped between rule.min_rate and rule.max_rate.
    """
    if not rule:
        return 40.0

    calc_method = getattr(rule, "calculation_method", "fat_snf_formula") or "fat_snf_formula"

    if calc_method == "flat_rate":
        flat = rule.flat_rate if rule.flat_rate is not None else rule.base_rate
        return round(float(flat), 2)

    # Quality formula calculation
    f = fat if fat is not None else rule.base_fat
    s = snf if snf is not None else rule.base_snf

    fat_diff = f - rule.base_fat
    snf_diff = s - rule.base_snf

    rate = rule.base_rate + (fat_diff * 10.0 * rule.fat_rate_step) + (snf_diff * 10.0 * rule.snf_rate_step)

    min_r = rule.min_rate if rule.min_rate is not None else 20.0
    max_r = rule.max_rate if rule.max_rate is not None else 80.0

    clamped_rate = max(min_r, min(rate, max_r))
    return round(clamped_rate, 2)


def resolve_rate_rule(db: Session, cooperative_id: int, target_date: datetime.date) -> models.MilkRateRule:
    """
    Resolves the authoritative MilkRateRule for a cooperative on a specific collection date
    using effective date windows (effective_date <= target_date <= effective_to).
    """
    # 1. Match effective date range
    rule = db.query(models.MilkRateRule).filter(
        models.MilkRateRule.cooperative_id == cooperative_id,
        models.MilkRateRule.effective_date <= target_date,
        or_(
            models.MilkRateRule.effective_to.is_(None),
            models.MilkRateRule.effective_to >= target_date
        )
    ).order_by(models.MilkRateRule.effective_date.desc(), models.MilkRateRule.id.desc()).first()

    if rule:
        return rule

    # 2. Fallback to active rule
    active_rule = db.query(models.MilkRateRule).filter(
        models.MilkRateRule.cooperative_id == cooperative_id,
        models.MilkRateRule.is_active == True
    ).order_by(models.MilkRateRule.effective_date.desc()).first()

    if active_rule:
        return active_rule

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No milk rate rule is configured for your cooperative. An admin must create one under Rates."
    )


@router.get("/current", response_model=schemas.MilkRateRuleResponse)
def get_current_rate_rule(
    date: Optional[datetime.date] = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """
    Retrieves the active rate rule for the caller's cooperative.
    If a collection date is provided, resolves the rule effective on that date.
    """
    coop_id = payload.get("cooperative_id")
    target_date = date or datetime.date.today()
    rule = resolve_rate_rule(db, coop_id, target_date)
    return rule


@router.get("", response_model=List[schemas.MilkRateRuleResponse])
def get_rate_rules(
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns all configured rate rules for the authenticated admin's cooperative.
    """
    rules = db.query(models.MilkRateRule).filter(
        models.MilkRateRule.cooperative_id == admin.cooperative_id
    ).order_by(models.MilkRateRule.effective_date.desc()).all()
    return rules


@router.post("", response_model=schemas.MilkRateRuleResponse, status_code=status.HTTP_201_CREATED)
def create_rate_rule(
    data: schemas.MilkRateRuleCreate,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Configures a new rate rule for the cooperative.
    Supports either flat rate or quality formula with custom steps and bounds.
    """
    # Close off any existing active rule that starts before this one
    if data.effective_to and data.effective_to < data.effective_date:
        raise HTTPException(status_code=422, detail="Effective-to date cannot be before the effective date.")
    if data.min_rate is not None and data.max_rate is not None and data.min_rate > data.max_rate:
        raise HTTPException(status_code=422, detail="Minimum rate cannot exceed maximum rate.")

    prev_rules = db.query(models.MilkRateRule).filter(
        models.MilkRateRule.cooperative_id == admin.cooperative_id,
        models.MilkRateRule.is_active == True,
        models.MilkRateRule.effective_date < data.effective_date
    ).all()

    day_before = data.effective_date - datetime.timedelta(days=1)
    for pr in prev_rules:
        if pr.effective_to is None or pr.effective_to >= data.effective_date:
            pr.effective_to = day_before
        pr.is_active = False

    new_rule = models.MilkRateRule(
        cooperative_id=admin.cooperative_id,
        rule_name=data.rule_name or "Cooperative Procurement Rule",
        version=data.version or "1.0",
        calculation_method=data.calculation_method or "fat_snf_formula",
        flat_rate=data.flat_rate if data.flat_rate is not None else 40.0,
        base_rate=data.base_rate,
        base_fat=data.base_fat,
        base_snf=data.base_snf,
        fat_rate_step=data.fat_rate_step,
        snf_rate_step=data.snf_rate_step,
        min_fat=data.min_fat,
        max_fat=data.max_fat,
        min_snf=data.min_snf,
        max_snf=data.max_snf,
        min_rate=data.min_rate,
        max_rate=data.max_rate,
        effective_date=data.effective_date,
        effective_to=data.effective_to,
        created_by_admin_id=admin.id,
        is_active=True
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule


@router.get("/calculate")
def calculate_rate_preview(
    quantity: float,
    fat: Optional[float] = 4.0,
    snf: Optional[float] = 8.5,
    collection_date: Optional[datetime.date] = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """
    Authoritative simulation / calculation endpoint.
    Calculates rate per litre and total amount based on the cooperative's rule
    effective for the given collection date.
    """
    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Milk quantity must be greater than zero."
        )

    coop_id = payload.get("cooperative_id")
    target_date = collection_date or datetime.date.today()
    rule = resolve_rate_rule(db, coop_id, target_date)

    rate = compute_rate(rule, fat, snf)
    amount = round(quantity * rate, 2)

    return {
        "quantity_litres": round(quantity, 2),
        "fat_percentage": fat,
        "snf_percentage": snf,
        "rate_per_litre": rate,
        "total_amount": amount,
        "calculation_method": rule.calculation_method,
        "base_rate": rule.base_rate,
        "flat_rate": rule.flat_rate,
        "rule_id": rule.id,
        "rule_name": rule.rule_name,
        "rule_version": rule.version
    }

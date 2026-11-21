import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import case, func, or_
from app.database import get_db
from app import models, schemas
from app.security import get_current_admin, get_current_user_payload
from app.routers.rates import compute_rate, resolve_rate_rule
from app.timeutil import utcnow

router = APIRouter(prefix="/milk", tags=["Milk Collection Management"])

@router.get("", response_model=List[schemas.MilkCollectionResponse])
def get_collections(
    farmer_id: Optional[int] = None,
    search: Optional[str] = None,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    session: Optional[str] = None,
    record_status: Optional[str] = None,
    payment_status: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """
    Retrieves authorized milk collections with multi-criteria filtering.
    Farmers are strictly restricted to their own authenticated farmer ID.
    Admins are strictly isolated to their authenticated cooperative.
    """
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    query = db.query(models.MilkCollection).join(models.Farmer).filter(
        models.MilkCollection.cooperative_id == coop_id
    )

    if role == "farmer":
        user_farmer_id = payload.get("user_id")
        query = query.filter(models.MilkCollection.farmer_id == user_farmer_id)
    elif farmer_id:
        # Validate that the requested farmer belongs to this admin's cooperative
        farmer_target = db.query(models.Farmer).filter(
            models.Farmer.id == farmer_id,
            models.Farmer.cooperative_id == coop_id
        ).first()
        if not farmer_target:
            raise HTTPException(status_code=404, detail="Farmer not found in your cooperative.")
        query = query.filter(models.MilkCollection.farmer_id == farmer_id)

    # Search filter (Name, UID, or Phone)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Farmer.full_name.ilike(search_term),
                models.Farmer.farmer_uid.ilike(search_term),
                models.Farmer.phone.ilike(search_term)
            )
        )

    if start_date:
        query = query.filter(models.MilkCollection.collection_date >= start_date)
    if end_date:
        query = query.filter(models.MilkCollection.collection_date <= end_date)
    if session:
        query = query.filter(models.MilkCollection.session == session.lower())
    if record_status:
        query = query.filter(models.MilkCollection.record_status == record_status)
    if payment_status:
        query = query.filter(models.MilkCollection.payment_status == payment_status)

    collections = query.order_by(
        models.MilkCollection.collection_date.desc(),
        models.MilkCollection.session.desc(),
        models.MilkCollection.id.desc()
    ).offset(offset).limit(limit).all()

    result = []
    for c in collections:
        resp = schemas.MilkCollectionResponse.model_validate(c)
        resp.farmer_name = c.farmer.full_name if c.farmer else None
        resp.farmer_uid = c.farmer.farmer_uid if c.farmer else None
        resp.audits = [schemas.MilkAuditResponse.model_validate(a) for a in c.audits]
        result.append(resp)

    return result


@router.get("/summary", response_model=schemas.MilkHistorySummaryResponse)
def get_collections_summary(
    farmer_id: Optional[int] = None,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    session: Optional[str] = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """
    Returns aggregated summary totals (total litres, total milk value, morning/evening split)
    directly computed from authorized database records.
    """
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    query = db.query(models.MilkCollection).filter(
        models.MilkCollection.cooperative_id == coop_id
    )

    if role == "farmer":
        user_farmer_id = payload.get("user_id")
        query = query.filter(models.MilkCollection.farmer_id == user_farmer_id)
    elif farmer_id:
        if not db.query(models.Farmer.id).filter(
            models.Farmer.id == farmer_id, models.Farmer.cooperative_id == coop_id
        ).first():
            raise HTTPException(status_code=404, detail="Farmer not found in your cooperative.")
        query = query.filter(models.MilkCollection.farmer_id == farmer_id)

    if start_date:
        query = query.filter(models.MilkCollection.collection_date >= start_date)
    if end_date:
        query = query.filter(models.MilkCollection.collection_date <= end_date)
    if session:
        query = query.filter(models.MilkCollection.session == session.lower())

    MC = models.MilkCollection
    agg = query.with_entities(
        func.coalesce(func.sum(MC.quantity_litres), 0.0),
        func.coalesce(func.sum(MC.total_amount), 0.0),
        func.count(MC.id),
        func.coalesce(func.sum(case((MC.session == "morning", MC.quantity_litres), else_=0.0)), 0.0),
        func.coalesce(func.sum(case((MC.session == "evening", MC.quantity_litres), else_=0.0)), 0.0),
    ).one()
    total_litres, total_amount, total_records, morning_litres, evening_litres = (
        float(agg[0]), float(agg[1]), int(agg[2]), float(agg[3]), float(agg[4])
    )

    return schemas.MilkHistorySummaryResponse(
        total_litres=round(total_litres, 1),
        total_amount=round(total_amount, 2),
        total_records=total_records,
        morning_litres=round(morning_litres, 1),
        evening_litres=round(evening_litres, 1)
    )


@router.get("/today")
def get_today_collection_summary(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Returns today's morning and evening collection summary for dashboard."""
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")
    today = datetime.date.today()

    query = db.query(models.MilkCollection).filter(
        models.MilkCollection.cooperative_id == coop_id,
        models.MilkCollection.collection_date == today
    )

    if role == "farmer":
        user_farmer_id = payload.get("user_id")
        query = query.filter(models.MilkCollection.farmer_id == user_farmer_id)

    MC = models.MilkCollection
    agg = query.with_entities(
        func.coalesce(func.sum(case((MC.session == "morning", MC.quantity_litres), else_=0.0)), 0.0),
        func.coalesce(func.sum(case((MC.session == "evening", MC.quantity_litres), else_=0.0)), 0.0),
        func.coalesce(func.sum(MC.total_amount), 0.0),
        func.count(MC.id),
    ).one()
    morning_litres, evening_litres, total_amount, total_entries = (
        float(agg[0]), float(agg[1]), float(agg[2]), int(agg[3])
    )
    total_litres = morning_litres + evening_litres

    return {
        "date": today.isoformat(),
        "total_litres": round(total_litres, 1),
        "morning_litres": round(morning_litres, 1),
        "evening_litres": round(evening_litres, 1),
        "total_amount": round(total_amount, 2),
        "total_entries": total_entries
    }

@router.get("/{collection_id}", response_model=schemas.MilkCollectionResponse)
def get_single_collection(
    collection_id: int,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """
    Retrieves a single milk collection record with strict access control.
    Farmers can only view their own records; admins can only view their cooperative's records.
    """
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    collection = db.query(models.MilkCollection).filter(
        models.MilkCollection.id == collection_id,
        models.MilkCollection.cooperative_id == coop_id
    ).first()

    if not collection:
        raise HTTPException(status_code=404, detail="Milk collection record not found.")

    if role == "farmer" and collection.farmer_id != payload.get("user_id"):
        raise HTTPException(status_code=403, detail="Access denied. You can only view your own records.")

    resp = schemas.MilkCollectionResponse.model_validate(collection)
    resp.farmer_name = collection.farmer.full_name if collection.farmer else None
    resp.farmer_uid = collection.farmer.farmer_uid if collection.farmer else None
    resp.audits = [schemas.MilkAuditResponse.model_validate(a) for a in collection.audits]
    return resp


@router.post("", response_model=schemas.MilkCollectionResponse, status_code=status.HTTP_201_CREATED)
def record_milk_collection(
    data: schemas.MilkCollectionCreate,
    allow_duplicate: bool = False,
    overwrite: bool = False,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Records a new milk collection for a farmer with authoritative backend rate calculation,
    strict input validation, duplicate prevention, and instant farmer portal synchronization.
    """
    # 1. Quantity validation
    if data.quantity_litres <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Milk quantity must be greater than zero."
        )
    if data.quantity_litres > 1000.0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Milk quantity exceeds maximum single entry threshold (1000L)."
        )

    # 2. Session validation
    norm_session = data.session.lower().strip()
    if norm_session not in ["morning", "evening"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Session must be either 'morning' or 'evening'."
        )

    # 3. Collection date validation (today or earlier)
    if data.collection_date > datetime.date.today():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Collection date cannot be in the future."
        )

    # 4. Fat & SNF physical bounds validation
    fat = data.fat_percentage
    snf = data.snf_percentage
    if fat is not None and (fat < 0.0 or fat > 20.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Fat percentage ({fat}%) is out of realistic physical bounds (0.0% - 20.0%)."
        )
    if snf is not None and (snf < 0.0 or snf > 20.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"SNF percentage ({snf}%) is out of realistic physical bounds (0.0% - 20.0%)."
        )

    # 5. Verify farmer belongs to admin's cooperative
    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == data.farmer_id,
        models.Farmer.cooperative_id == admin.cooperative_id
    ).first()

    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found in your cooperative."
        )
    if not farmer.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Farmer membership is inactive. Cannot record milk collection."
        )

    # 6. Duplicate check
    existing = db.query(models.MilkCollection).filter(
        models.MilkCollection.cooperative_id == admin.cooperative_id,
        models.MilkCollection.farmer_id == data.farmer_id,
        models.MilkCollection.collection_date == data.collection_date,
        models.MilkCollection.session == norm_session
    ).first()

    replace_existing = bool(existing and (allow_duplicate or overwrite))
    if existing and not replace_existing:
        session_label = "Morning" if norm_session == "morning" else "Evening"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Duplicate entry: A record already exists for {farmer.full_name} on {data.collection_date} ({session_label} session). Duplicate attempts are prevented to protect ledger integrity."
        )

    # Rate rule effective on the collection date (same resolver used by corrections)
    rule = resolve_rate_rule(db, admin.cooperative_id, data.collection_date)

    calc_fat = fat if fat is not None else rule.base_fat
    calc_snf = snf if snf is not None else rule.base_snf

    # Authoritative server-side calculation
    rate = compute_rate(rule, calc_fat, calc_snf)
    amount = round(data.quantity_litres * rate, 2)

    if replace_existing:
        if existing.payment_status in ("approved", "settled"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This record is part of an approved/settled payment and cannot be overwritten."
            )
        db.add(models.MilkRecordAudit(
            collection_id=existing.id,
            admin_id=admin.id,
            previous_quantity=existing.quantity_litres,
            new_quantity=data.quantity_litres,
            previous_fat=existing.fat_percentage,
            new_fat=fat,
            previous_snf=existing.snf_percentage,
            new_snf=snf,
            previous_rate=existing.rate_per_litre,
            new_rate=rate,
            previous_amount=existing.total_amount,
            new_amount=amount,
            reason="Confirmed overwrite of existing session record"
        ))
        existing.quantity_litres = data.quantity_litres
        existing.fat_percentage = fat
        existing.snf_percentage = snf
        existing.rate_per_litre = rate
        existing.total_amount = amount
        existing.rate_rule_id = rule.id
        existing.calculation_method = rule.calculation_method
        existing.record_status = "corrected"
        existing.payment_status = "pending"
        existing.correction_reason = "Admin overwrite of duplicate session"
        existing.recorded_by_admin_id = admin.id
        if data.notes:
            existing.notes = data.notes
        collection = existing
    else:
        collection = models.MilkCollection(
            cooperative_id=admin.cooperative_id,
            farmer_id=data.farmer_id,
            collection_date=data.collection_date,
            session=norm_session,
            quantity_litres=data.quantity_litres,
            fat_percentage=fat,
            snf_percentage=snf,
            rate_per_litre=rate,
            total_amount=amount,
            rate_rule_id=rule.id,
            calculation_method=rule.calculation_method,
            record_status="recorded",
            payment_status="pending",
            recorded_by_admin_id=admin.id,
            notes=data.notes
        )
        db.add(collection)

    db.flush()

    # 8. Automatic Farmer Notification for Synchronization
    session_kn = "ಬೆಳಿಗ್ಗೆ" if norm_session == "morning" else "ಸಂಜೆ"
    session_en = norm_session.capitalize()
    notif = models.Notification(
        cooperative_id=admin.cooperative_id,
        farmer_id=farmer.id,
        title="Milk Recorded" if not replace_existing else "Milk Record Updated",
        title_kn="ಹಾಲು ಸಂಗ್ರಹ ದಾಖಲಾಗಿದೆ" if not replace_existing else "ಹಾಲು ದಾಖಲೆ ನವೀಕರಿಸಲಾಗಿದೆ",
        message=f"{data.quantity_litres:.1f}L recorded for {data.collection_date} ({session_en}). Rate: ₹{rate:.2f}/L, Milk Value: ₹{amount:.2f}.",
        message_kn=f"{data.collection_date} ({session_kn}) ಕ್ಕೆ {data.quantity_litres:.1f} ಲೀಟರ್ ಹಾಲು ದಾಖಲಾಗಿದೆ. ದರ: ₹{rate:.2f}/ಲೀ, ಮೌಲ್ಯ: ₹{amount:.2f}.",
        category="milk"
    )
    db.add(notif)

    db.commit()
    db.refresh(collection)

    resp = schemas.MilkCollectionResponse.model_validate(collection)
    resp.farmer_name = farmer.full_name
    resp.farmer_uid = farmer.farmer_uid
    resp.audits = [schemas.MilkAuditResponse.model_validate(a) for a in collection.audits]
    return resp


@router.put("/{collection_id}", response_model=schemas.MilkCollectionResponse)
def correct_milk_collection(
    collection_id: int,
    data: schemas.MilkCollectionCorrection,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Corrects a saved milk collection record with a permanent audit trail.
    Recalculates amounts using the applicable rule for that date and immediately
    syncs with the farmer's portal.
    """
    if not data.reason or not data.reason.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A specific correction reason is mandatory for audit trail compliance."
        )

    if data.quantity_litres <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Corrected milk quantity must be greater than zero."
        )

    collection = db.query(models.MilkCollection).filter(
        models.MilkCollection.id == collection_id,
        models.MilkCollection.cooperative_id == admin.cooperative_id
    ).first()

    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milk collection record not found in your cooperative."
        )

    if collection.payment_status in ("approved", "settled"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This record is part of an approved/settled payment and can no longer be corrected."
        )

    # Resolve rule for collection date
    rule = resolve_rate_rule(db, admin.cooperative_id, collection.collection_date)

    fat = data.fat_percentage if data.fat_percentage is not None else (collection.fat_percentage or rule.base_fat)
    snf = data.snf_percentage if data.snf_percentage is not None else (collection.snf_percentage or rule.base_snf)

    if fat is not None and (fat < 0.0 or fat > 20.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Fat percentage ({fat}%) is out of realistic physical bounds."
        )
    if snf is not None and (snf < 0.0 or snf > 20.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"SNF percentage ({snf}%) is out of realistic physical bounds."
        )

    new_rate = compute_rate(rule, fat, snf)
    new_amount = round(data.quantity_litres * new_rate, 2)

    # Record Audit Log
    audit = models.MilkRecordAudit(
        collection_id=collection.id,
        admin_id=admin.id,
        previous_quantity=collection.quantity_litres,
        new_quantity=data.quantity_litres,
        previous_fat=collection.fat_percentage,
        new_fat=data.fat_percentage,
        previous_snf=collection.snf_percentage,
        new_snf=data.snf_percentage,
        previous_rate=collection.rate_per_litre,
        new_rate=new_rate,
        previous_amount=collection.total_amount,
        new_amount=new_amount,
        reason=data.reason.strip()
    )
    db.add(audit)

    # Apply changes
    collection.quantity_litres = data.quantity_litres
    collection.fat_percentage = data.fat_percentage
    collection.snf_percentage = data.snf_percentage
    collection.rate_per_litre = new_rate
    collection.total_amount = new_amount
    collection.rate_rule_id = rule.id
    collection.calculation_method = rule.calculation_method
    collection.record_status = "corrected"
    collection.correction_reason = data.reason.strip()
    if data.notes:
        collection.notes = data.notes
    collection.updated_at = utcnow()

    # Create farmer notification regarding correction
    farmer = collection.farmer
    if farmer:
        session_en = collection.session.capitalize()
        session_kn = "ಬೆಳಿಗ್ಗೆ" if collection.session == "morning" else "ಸಂಜೆ"
        notif = models.Notification(
            cooperative_id=admin.cooperative_id,
            farmer_id=farmer.id,
            title="Milk Record Corrected",
            title_kn="ಹಾಲು ದಾಖಲೆ ತಿದ್ದುಪಡಿಯಾಗಿದೆ",
            message=f"Collection for {collection.collection_date} ({session_en}) updated to {data.quantity_litres:.1f}L (₹{new_amount:.2f}). Reason: {data.reason}",
            message_kn=f"{collection.collection_date} ({session_kn}) ದಾಖಲೆ {data.quantity_litres:.1f} ಲೀ (₹{new_amount:.2f}) ಗೆ ಬದಲಾಗಿದೆ. ಕಾರಣ: {data.reason}",
            category="milk"
        )
        db.add(notif)

    db.commit()
    db.refresh(collection)

    resp = schemas.MilkCollectionResponse.model_validate(collection)
    resp.farmer_name = farmer.full_name if farmer else None
    resp.farmer_uid = farmer.farmer_uid if farmer else None
    resp.audits = [schemas.MilkAuditResponse.model_validate(a) for a in collection.audits]
    return resp

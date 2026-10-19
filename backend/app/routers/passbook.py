import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.security import get_current_user_payload
from app.pdf_service import generate_passbook_pdf

router = APIRouter(prefix="/passbook", tags=["Digital E-Passbook"])

@router.get("", response_model=schemas.PassbookSummaryResponse)
def get_passbook(
    farmer_id: Optional[int] = None,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    # Determine target farmer
    target_farmer_id = payload.get("user_id") if role == "farmer" else farmer_id
    if not target_farmer_id:
        raise HTTPException(status_code=400, detail="farmer_id is required for admin.")

    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == target_farmer_id,
        models.Farmer.cooperative_id == coop_id
    ).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found in your cooperative.")

    # Default to current month if dates not provided
    today = datetime.date.today()
    if not start_date:
        start_date = today.replace(day=1)
    if not end_date:
        end_date = today

    records_query = db.query(models.MilkCollection).filter(
        models.MilkCollection.farmer_id == farmer.id,
        models.MilkCollection.collection_date >= start_date,
        models.MilkCollection.collection_date <= end_date
    ).order_by(models.MilkCollection.collection_date.asc(), models.MilkCollection.session.asc())

    records = records_query.all()

    total_litres = sum(r.quantity_litres for r in records)
    total_amount = sum(r.total_amount for r in records)
    paid_amount = sum(r.total_amount for r in records if r.payment_status == "settled")
    pending_amount = total_amount - paid_amount

    valid_fats = [r.fat_percentage for r in records if r.fat_percentage is not None]
    avg_fat = sum(valid_fats) / len(valid_fats) if valid_fats else 0.0

    valid_snfs = [r.snf_percentage for r in records if r.snf_percentage is not None]
    avg_snf = sum(valid_snfs) / len(valid_snfs) if valid_snfs else 0.0

    coop = farmer.cooperative

    record_responses = []
    for r in records:
        resp = schemas.MilkCollectionResponse.from_orm(r)
        resp.farmer_name = farmer.full_name
        resp.farmer_uid = farmer.farmer_uid
        resp.audits = [schemas.MilkAuditResponse.from_orm(a) for a in r.audits]
        record_responses.append(resp)

    # Daily (today) metrics
    today_records = db.query(models.MilkCollection).filter(
        models.MilkCollection.farmer_id == farmer.id,
        models.MilkCollection.collection_date == today
    ).all()
    today_litres = sum(r.quantity_litres for r in today_records)
    today_earnings = sum(r.total_amount for r in today_records)

    # Monthly metrics (first of current month to today)
    month_start = today.replace(day=1)
    month_records = db.query(models.MilkCollection).filter(
        models.MilkCollection.farmer_id == farmer.id,
        models.MilkCollection.collection_date >= month_start,
        models.MilkCollection.collection_date <= today
    ).all()
    month_litres = sum(r.quantity_litres for r in month_records)
    month_earnings = sum(r.total_amount for r in month_records)

    return schemas.PassbookSummaryResponse(
        farmer_id=farmer.id,
        farmer_name=farmer.full_name,
        farmer_uid=farmer.farmer_uid,
        cooperative_name=coop.name if coop else "",
        cooperative_code=coop.code if coop else "",
        total_litres=round(total_litres, 1),
        avg_fat=round(avg_fat, 2),
        avg_snf=round(avg_snf, 2),
        total_earnings=round(total_amount, 2),
        paid_amount=round(paid_amount, 2),
        pending_amount=round(pending_amount, 2),
        today_litres=round(today_litres, 1),
        today_earnings=round(today_earnings, 2),
        month_litres=round(month_litres, 1),
        month_earnings=round(month_earnings, 2),
        records=record_responses
    )

@router.get("/pdf")
def download_passbook_pdf(
    farmer_id: Optional[int] = None,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """
    Generates and downloads a digital e-passbook PDF statement for the requested period.
    """
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    target_farmer_id = payload.get("user_id") if role == "farmer" else farmer_id
    if not target_farmer_id:
        raise HTTPException(status_code=400, detail="farmer_id is required.")

    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == target_farmer_id,
        models.Farmer.cooperative_id == coop_id
    ).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found.")

    today = datetime.date.today()
    if not start_date:
        start_date = today.replace(day=1)
    if not end_date:
        end_date = today

    records = db.query(models.MilkCollection).filter(
        models.MilkCollection.farmer_id == farmer.id,
        models.MilkCollection.collection_date >= start_date,
        models.MilkCollection.collection_date <= end_date
    ).order_by(models.MilkCollection.collection_date.asc(), models.MilkCollection.session.asc()).all()

    coop = farmer.cooperative

    records_data = []
    for r in records:
        records_data.append({
            "collection_date": r.collection_date.isoformat(),
            "session": r.session,
            "quantity_litres": r.quantity_litres,
            "fat_percentage": r.fat_percentage,
            "snf_percentage": r.snf_percentage,
            "rate_per_litre": r.rate_per_litre,
            "total_amount": r.total_amount,
            "payment_status": r.payment_status
        })

    pdf_bytes = generate_passbook_pdf(
        cooperative={
            "name": coop.name,
            "code": coop.code,
            "locality": coop.locality,
            "contact_phone": coop.contact_phone
        },
        farmer={
            "full_name": farmer.full_name,
            "farmer_uid": farmer.farmer_uid,
            "phone": farmer.phone,
            "village": farmer.village,
            "bank_account_no": farmer.bank_account_no,
            "ifsc_code": farmer.ifsc_code
        },
        records=records_data,
        period_start=start_date.isoformat(),
        period_end=end_date.isoformat()
    )

    filename = f"DairySathi_Passbook_{farmer.farmer_uid}_{start_date}_{end_date}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

import datetime
import csv
import io
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models
from app.security import get_current_admin

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/summary")
def get_admin_dashboard_summary(
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    coop_id = admin.cooperative_id
    today = datetime.date.today()
    start_of_month = today.replace(day=1)

    total_farmers = db.query(func.count(models.Farmer.id)).filter(
        models.Farmer.cooperative_id == coop_id,
        models.Farmer.is_active == True
    ).scalar() or 0

    MC = models.MilkCollection

    def _totals(*conditions):
        row = db.query(
            func.coalesce(func.sum(MC.quantity_litres), 0.0),
            func.coalesce(func.sum(MC.total_amount), 0.0),
            func.count(MC.id),
        ).filter(MC.cooperative_id == coop_id, *conditions).one()
        return float(row[0]), float(row[1]), int(row[2])

    today_litres, today_amount, today_count = _totals(MC.collection_date == today)
    today_morning = float(db.query(func.coalesce(func.sum(MC.quantity_litres), 0.0)).filter(
        MC.cooperative_id == coop_id, MC.collection_date == today, MC.session == "morning").scalar())
    today_evening = float(db.query(func.coalesce(func.sum(MC.quantity_litres), 0.0)).filter(
        MC.cooperative_id == coop_id, MC.collection_date == today, MC.session == "evening").scalar())
    monthly_litres, monthly_amount, _ = _totals(MC.collection_date >= start_of_month)

    # Pending & Completed settlements
    pending_payouts = db.query(func.sum(models.MilkCollection.total_amount)).filter(
        models.MilkCollection.cooperative_id == coop_id,
        models.MilkCollection.payment_status != "settled"
    ).scalar() or 0.0

    completed_settlements_amount = db.query(func.sum(models.PaymentSettlement.paid_amount)).filter(
        models.PaymentSettlement.cooperative_id == coop_id,
        models.PaymentSettlement.status == "completed"
    ).scalar() or 0.0

    # Upcoming vaccinations
    upcoming_reminders = db.query(func.count(models.CattleReminder.id)).filter(
        models.CattleReminder.cooperative_id == coop_id,
        models.CattleReminder.due_date >= today,
        models.CattleReminder.due_date <= today + datetime.timedelta(days=14),
        models.CattleReminder.status == "upcoming"
    ).scalar() or 0

    return {
        "total_farmers": total_farmers,
        "today_collection": {
            "total_litres": round(today_litres, 1),
            "morning_litres": round(today_morning, 1),
            "evening_litres": round(today_evening, 1),
            "amount": round(today_amount, 2),
            "entries_count": today_count
        },
        "monthly_collection": {
            "total_litres": round(monthly_litres, 1),
            "total_amount": round(monthly_amount, 2),
            "avg_daily_litres": round(monthly_litres / max(today.day, 1), 1)
        },
        "financials": {
            "pending_amount": round(pending_payouts, 2),
            "completed_settlements": round(completed_settlements_amount, 2)
        },
        "upcoming_vaccinations": upcoming_reminders
    }

@router.get("/trends")
def get_collection_trends(
    days: int = Query(14, ge=1, le=366),
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    coop_id = admin.cooperative_id
    today = datetime.date.today()
    start_date = today - datetime.timedelta(days=days - 1)

    records = db.query(models.MilkCollection).filter(
        models.MilkCollection.cooperative_id == coop_id,
        models.MilkCollection.collection_date >= start_date,
        models.MilkCollection.collection_date <= today
    ).all()

    daily_map = {}
    for i in range(days):
        d = start_date + datetime.timedelta(days=i)
        daily_map[d.isoformat()] = {
            "date": d.strftime("%d %b"),
            "full_date": d.isoformat(),
            "morning": 0.0,
            "evening": 0.0,
            "total": 0.0,
            "amount": 0.0
        }

    for r in records:
        d_str = r.collection_date.isoformat()
        if d_str in daily_map:
            if r.session == "morning":
                daily_map[d_str]["morning"] += r.quantity_litres
            else:
                daily_map[d_str]["evening"] += r.quantity_litres
            daily_map[d_str]["total"] += r.quantity_litres
            daily_map[d_str]["amount"] += r.total_amount

    # Round values
    trend_data = []
    for k in sorted(daily_map.keys()):
        item = daily_map[k]
        trend_data.append({
            "date": item["date"],
            "full_date": item["full_date"],
            "morning": round(item["morning"], 1),
            "evening": round(item["evening"], 1),
            "total": round(item["total"], 1),
            "amount": round(item["amount"], 2)
        })

    return trend_data

@router.get("/quality")
def get_quality_distribution(
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    coop_id = admin.cooperative_id
    today = datetime.date.today()
    start_date = today - datetime.timedelta(days=30)

    records = db.query(models.MilkCollection).filter(
        models.MilkCollection.cooperative_id == coop_id,
        models.MilkCollection.collection_date >= start_date,
        models.MilkCollection.fat_percentage != None
    ).all()

    # Fat Buckets: < 3.5%, 3.5% - 4.0%, 4.0% - 4.5%, > 4.5%
    fat_brackets = {"Below 3.5%": 0, "3.5% - 4.0%": 0, "4.0% - 4.5%": 0, "Above 4.5%": 0}
    for r in records:
        f = r.fat_percentage
        if f < 3.5:
            fat_brackets["Below 3.5%"] += 1
        elif f <= 4.0:
            fat_brackets["3.5% - 4.0%"] += 1
        elif f <= 4.5:
            fat_brackets["4.0% - 4.5%"] += 1
        else:
            fat_brackets["Above 4.5%"] += 1

    return {
        "fat_distribution": [{"label": k, "count": v} for k, v in fat_brackets.items()],
        "sample_size": len(records)
    }

@router.get("/export/collections-csv")
def export_collections_csv(
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    coop_id = admin.cooperative_id
    today = datetime.date.today()
    if not start_date:
        start_date = today.replace(day=1)
    if not end_date:
        end_date = today

    records = db.query(models.MilkCollection).filter(
        models.MilkCollection.cooperative_id == coop_id,
        models.MilkCollection.collection_date >= start_date,
        models.MilkCollection.collection_date <= end_date
    ).order_by(models.MilkCollection.collection_date.asc(), models.MilkCollection.session.asc()).all()

    if start_date > end_date:
        raise HTTPException(status_code=422, detail="Start date cannot be after end date.")

    def safe(v):
        # Prevent CSV/Excel formula injection from user-controlled text (names, villages).
        if isinstance(v, str) and v[:1] in ("=", "+", "-", "@", chr(9), chr(13)):
            return "'" + v
        return v

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Collection ID", "Date", "Session", "Farmer UID", "Farmer Name", "Village",
        "Quantity (L)", "Fat %", "SNF %", "Rate (INR/L)", "Total Amount (INR)", "Payment Status"
    ])

    for r in records:
        writer.writerow([
            r.id,
            r.collection_date.isoformat(),
            r.session,
            safe(r.farmer.farmer_uid) if r.farmer else "",
            safe(r.farmer.full_name) if r.farmer else "",
            safe(r.farmer.village) if r.farmer else "",
            r.quantity_litres,
            r.fat_percentage if r.fat_percentage is not None else "",
            r.snf_percentage if r.snf_percentage is not None else "",
            r.rate_per_litre,
            r.total_amount,
            r.payment_status
        ])

    csv_data = output.getvalue()
    filename = f"Milk_Collections_{admin.cooperative.code}_{start_date}_{end_date}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

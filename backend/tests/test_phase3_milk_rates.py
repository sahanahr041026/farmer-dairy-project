import sys
import os
import datetime
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app import models

client = TestClient(app)

def run_phase3_tests():
    print("=" * 65)
    print("DAIRYSATHI PHASE 3: MILK COLLECTION & RATE CALCULATION SUITE")
    print("=" * 65)

    # 1. Admin Authentication
    print("\n[STEP 1] Admin Authentication Setup...")
    admin_res = client.post("/api/auth/admin/login", json={
        "cooperative_code": "KMF-MLN-108",
        "username_or_email": "admin",
        "password": "admin123"
    })
    assert admin_res.status_code == 200
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    admin_coop_id = admin_res.json()["cooperative_id"]
    print("  -> PASSED: Admin authenticated for cooperative KMF-MLN-108.")

    # 2. Farmer Discovery
    farmers = client.get("/api/farmers", headers=admin_headers).json()
    assert len(farmers) >= 2
    farmer_1 = next(f for f in farmers if f["farmer_uid"] == "DS-FARM-101")
    farmer_2 = next(f for f in farmers if f["farmer_uid"] == "DS-FARM-102")
    print(f"  -> PASSED: Loaded farmers: {farmer_1['full_name']} ({farmer_1['farmer_uid']}) and {farmer_2['full_name']} ({farmer_2['farmer_uid']}).")

    # 3. Rate Rule Calculation Tests
    print("\n[STEP 2] Testing Rate Rules (Flat Rate & Quality-Based Formula)...")
    
    # 3A. Quality-based calculation preview
    preview_quality = client.get(
        "/api/rates/calculate?quantity=10.0&fat=4.5&snf=8.7",
        headers=admin_headers
    )
    assert preview_quality.status_code == 200
    data_q = preview_quality.json()
    # Base 41.0 + (0.5 * 10 * 0.45 = 2.25) + (0.2 * 10 * 0.30 = 0.60) = 43.85
    # Total for 10L = 438.50
    assert data_q["rate_per_litre"] == 43.85
    assert data_q["total_amount"] == 438.50
    print("  -> PASSED: Quality-based calculation accurate (10L @ 43.85 = 438.50).")

    # 3B. Create Flat Rate Rule and Test
    flat_rule_date = datetime.date.today() + datetime.timedelta(days=20)
    flat_rule_res = client.post("/api/rates", headers=admin_headers, json={
        "rule_name": "Monsoon Promotional Flat Procurement Rate",
        "version": "2.0-FLAT",
        "calculation_method": "flat_rate",
        "flat_rate": 45.0,
        "base_rate": 45.0,
        "effective_date": flat_rule_date.isoformat()
    })
    assert flat_rule_res.status_code == 201
    print("  -> PASSED: Created future flat rate rule (INR 45.00/L).")

    # 3C. Effective Date Handling: Past date gets original formula, future date gets flat rate
    current_preview = client.get(
        f"/api/rates/calculate?quantity=10.0&fat=4.0&snf=8.5&collection_date={datetime.date.today().isoformat()}",
        headers=admin_headers
    )
    assert current_preview.json()["calculation_method"] == "fat_snf_formula"

    flat_preview = client.get(
        f"/api/rates/calculate?quantity=10.0&fat=3.5&snf=8.0&collection_date={flat_rule_date.isoformat()}",
        headers=admin_headers
    )
    assert flat_preview.json()["calculation_method"] == "flat_rate"
    assert flat_preview.json()["rate_per_litre"] == 45.0
    assert flat_preview.json()["total_amount"] == 450.0
    print("  -> PASSED: Effective date resolution verified (historical/current uses formula, future uses flat rate).")

    # 4. Input Validation & Error Handling
    print("\n[STEP 3] Testing Strict Input Validations...")

    # Negative quantity
    neg_res = client.post("/api/milk", headers=admin_headers, json={
        "farmer_id": farmer_1["id"],
        "collection_date": datetime.date.today().isoformat(),
        "session": "morning",
        "quantity_litres": -5.0,
        "fat_percentage": 4.0,
        "snf_percentage": 8.5
    })
    assert neg_res.status_code == 422
    assert "greater than" in str(neg_res.json()["detail"])
    print("  -> PASSED: Negative quantity rejected with HTTP 422.")

    # Zero quantity
    zero_res = client.post("/api/milk", headers=admin_headers, json={
        "farmer_id": farmer_1["id"],
        "collection_date": datetime.date.today().isoformat(),
        "session": "morning",
        "quantity_litres": 0.0,
        "fat_percentage": 4.0,
        "snf_percentage": 8.5
    })
    assert zero_res.status_code == 422
    print("  -> PASSED: Zero quantity rejected with HTTP 422.")

    # Invalid session name
    session_res = client.post("/api/milk", headers=admin_headers, json={
        "farmer_id": farmer_1["id"],
        "collection_date": datetime.date.today().isoformat(),
        "session": "afternoon_invalid",
        "quantity_litres": 10.0
    })
    assert session_res.status_code == 422
    print("  -> PASSED: Invalid session rejected with HTTP 422.")

    # Invalid Fat percentage (negative or > 20%)
    fat_res = client.post("/api/milk", headers=admin_headers, json={
        "farmer_id": farmer_1["id"],
        "collection_date": datetime.date.today().isoformat(),
        "session": "morning",
        "quantity_litres": 10.0,
        "fat_percentage": 25.0
    })
    assert fat_res.status_code == 422
    print("  -> PASSED: Out-of-bounds fat percentage rejected with HTTP 422.")

    # Future date beyond tomorrow
    future_date = (datetime.date.today() + datetime.timedelta(days=10)).isoformat()
    future_res = client.post("/api/milk", headers=admin_headers, json={
        "farmer_id": farmer_1["id"],
        "collection_date": future_date,
        "session": "morning",
        "quantity_litres": 10.0
    })
    assert future_res.status_code == 422
    print("  -> PASSED: Distant future date rejected with HTTP 422.")

    # 5. Authorization & Multi-tenant Security
    print("\n[STEP 4] Testing Multi-Tenant & Role Authorization...")

    # Unauthenticated user cannot create record
    client.cookies.clear()  # drop the session cookie set by earlier logins
    unauth_res = client.post("/api/milk", json={
        "farmer_id": farmer_1["id"],
        "collection_date": datetime.date.today().isoformat(),
        "session": "morning",
        "quantity_litres": 10.0
    })
    assert unauth_res.status_code == 401
    print("  -> PASSED: Unauthenticated record creation blocked (HTTP 401).")

    # Farmer cannot create milk collection record
    farmer_login = client.post("/api/auth/farmer/login", json={
        "cooperative_code": "KMF-MLN-108",
        "farmer_uid_or_phone": "DS-FARM-101",
        "pin": "1234"
    })
    assert farmer_login.status_code == 200
    farmer_token = farmer_login.json()["access_token"]
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}

    farmer_create_res = client.post("/api/milk", headers=farmer_headers, json={
        "farmer_id": farmer_1["id"],
        "collection_date": datetime.date.today().isoformat(),
        "session": "morning",
        "quantity_litres": 10.0
    })
    assert farmer_create_res.status_code == 403
    print("  -> PASSED: Farmer role blocked from recording collection (HTTP 403).")

    # Farmer 101 cannot see Farmer 102 passbook records
    f101_passbook = client.get(f"/api/passbook?farmer_id={farmer_2['id']}", headers=farmer_headers).json()
    assert f101_passbook["farmer_id"] == farmer_1["id"]
    print("  -> PASSED: IDOR protection verified (server ignores client query param, returns authenticated farmer's records).")

    # Admin cannot create record for a farmer from a different cooperative
    db = SessionLocal()
    other_coop = db.query(models.Cooperative).filter(models.Cooperative.code != "KMF-MLN-108").first()
    if not other_coop:
        other_coop = models.Cooperative(
            name="Mysuru Milk Union Ltd.",
            code="KMF-MYS-999",
            locality="Mysuru",
            district="Mysuru",
            contact_phone="0821-249000"
        )
        db.add(other_coop)
        db.flush()
        other_farmer = models.Farmer(
            cooperative_id=other_coop.id,
            farmer_uid="DS-MYS-999",
            full_name="Mahadevappa",
            phone="9845099999",
            village="Varuna",
            is_active=True
        )
        db.add(other_farmer)
        db.commit()
    else:
        other_farmer = db.query(models.Farmer).filter(models.Farmer.cooperative_id == other_coop.id).first()
        if not other_farmer:
            other_farmer = models.Farmer(
                cooperative_id=other_coop.id,
                farmer_uid="DS-MYS-999",
                full_name="Mahadevappa",
                phone="9845099999",
                village="Varuna",
                is_active=True
            )
            db.add(other_farmer)
            db.commit()
    db.close()

    cross_coop_res = client.post("/api/milk", headers=admin_headers, json={
        "farmer_id": other_farmer.id,
        "collection_date": datetime.date.today().isoformat(),
        "session": "morning",
        "quantity_litres": 12.0
    })
    assert cross_coop_res.status_code == 404
    print("  -> PASSED: Admin blocked from recording milk for another cooperative's farmer (HTTP 404).")

    # 6. Complete End-to-End Workflow with Duplicate Prevention & Sync
    print("\n[STEP 5] Testing End-to-End Workflow & Synchronization...")

    # Unique test date to avoid conflicts with past test runs
    test_date = (datetime.date.today() - datetime.timedelta(days=2)).isoformat()
    test_session = "evening"

    # Clean up any leftover test record for this slot if needed
    db = SessionLocal()
    leftover = db.query(models.MilkCollection).filter(
        models.MilkCollection.farmer_id == farmer_1["id"],
        models.MilkCollection.collection_date == test_date,
        models.MilkCollection.session == test_session
    ).first()
    if leftover:
        db.delete(leftover)
        db.commit()
    db.close()

    # 6A. Save Collection
    create_res = client.post("/api/milk", headers=admin_headers, json={
        "farmer_id": farmer_1["id"],
        "collection_date": test_date,
        "session": test_session,
        "quantity_litres": 18.5,
        "fat_percentage": 4.2,
        "snf_percentage": 8.6,
        "notes": "Evening intake tanker batch"
    })
    assert create_res.status_code == 201
    created_rec = create_res.json()
    record_id = created_rec["id"]
    assert created_rec["record_status"] == "recorded"
    assert created_rec["quantity_litres"] == 18.5
    print(f"  -> PASSED: Admin recorded 18.5L milk entry #{record_id} (@ INR {created_rec['rate_per_litre']}/L = INR {created_rec['total_amount']}).")

    # 6B. Duplicate Prevention Check
    dup_res = client.post("/api/milk", headers=admin_headers, json={
        "farmer_id": farmer_1["id"],
        "collection_date": test_date,
        "session": test_session,
        "quantity_litres": 15.0
    })
    assert dup_res.status_code == 409
    assert "Duplicate entry" in dup_res.json()["detail"]
    print("  -> PASSED: Duplicate entry for same farmer/date/session strictly rejected with HTTP 409.")

    # 6C. Farmer Portal Synchronization
    passbook_res = client.get("/api/passbook", headers=farmer_headers)
    assert passbook_res.status_code == 200
    pb_data = passbook_res.json()
    synced_rec = next((r for r in pb_data["records"] if r["id"] == record_id), None)
    assert synced_rec is not None
    assert synced_rec["quantity_litres"] == 18.5
    assert synced_rec["total_amount"] == created_rec["total_amount"]
    print("  -> PASSED: Farmer passbook synchronized and retrieved newly recorded collection.")

    # 6D. Admin Record Correction with Mandatory Audit Trail
    print("\n[STEP 6] Testing Admin Record Correction & Audit Trail...")
    
    # Missing reason rejected
    no_reason_res = client.put(f"/api/milk/{record_id}", headers=admin_headers, json={
        "quantity_litres": 19.0,
        "reason": ""
    })
    assert no_reason_res.status_code == 422
    print("  -> PASSED: Correction without audit reason rejected with HTTP 422.")

    # Valid correction
    correct_res = client.put(f"/api/milk/{record_id}", headers=admin_headers, json={
        "quantity_litres": 19.5,
        "fat_percentage": 4.3,
        "snf_percentage": 8.7,
        "reason": "Recalibrated weighing bridge discrepancy adjusted"
    })
    assert correct_res.status_code == 200
    corrected_data = correct_res.json()
    assert corrected_data["record_status"] == "corrected"
    assert corrected_data["quantity_litres"] == 19.5
    assert len(corrected_data["audits"]) >= 1
    assert corrected_data["audits"][-1]["previous_quantity"] == 18.5
    assert corrected_data["audits"][-1]["new_quantity"] == 19.5
    print("  -> PASSED: Record corrected with permanent audit trail logged.")

    # Farmer sees correction immediately
    pb_after_correct = client.get("/api/passbook", headers=farmer_headers).json()
    f_rec = next((r for r in pb_after_correct["records"] if r["id"] == record_id), None)
    assert f_rec is not None
    assert f_rec["quantity_litres"] == 19.5
    assert f_rec["record_status"] == "corrected"
    assert len(f_rec["audits"]) >= 1
    print("  -> PASSED: Farmer passbook instantly shows corrected record and audit reason.")

    # 7. Persistence after fresh DB session
    print("\n[STEP 7] Verifying Database Persistence across Fresh Sessions...")
    db = SessionLocal()
    persisted = db.query(models.MilkCollection).filter(models.MilkCollection.id == record_id).first()
    assert persisted is not None
    assert persisted.quantity_litres == 19.5
    assert persisted.record_status == "corrected"
    assert persisted.audits[0].reason == "Recalibrated weighing bridge discrepancy adjusted"
    db.close()
    print("  -> PASSED: Record and audit permanently persisted in SQL database.")

    print("\n" + "=" * 65)
    print("ALL PHASE 3 COMPREHENSIVE TESTS PASSED SUCCESSFULLY!")
    print("=" * 65)

def test_phase3_milk_collection_and_rates():
    run_phase3_tests()

if __name__ == "__main__":
    run_phase3_tests()

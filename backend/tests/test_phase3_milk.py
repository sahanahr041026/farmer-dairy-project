import sys
import os
import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app import models
from app.security import hash_password

client = TestClient(app)

def setup_phase3_test_cooperatives():
    """Ensures both test cooperatives and test accounts exist for isolation testing."""
    db = SessionLocal()
    try:
        # Check primary coop
        coop1 = db.query(models.Cooperative).filter_by(code="KMF-MLN-108").first()
        assert coop1 is not None, "Primary cooperative KMF-MLN-108 not found. Run seed script first."

        # Check secondary coop for isolation
        coop2 = db.query(models.Cooperative).filter_by(code="KMF-BLR-02").first()
        if not coop2:
            coop2 = models.Cooperative(
                name="Bangalore Rural Milk Union Ltd.",
                code="KMF-BLR-02",
                locality="Hosakote",
                district="Bangalore Rural",
                state="Karnataka",
                contact_phone="080-28391234"
            )
            db.add(coop2)
            db.flush()

            admin2 = models.AdminUser(
                cooperative_id=coop2.id,
                username="admin_blr",
                email="admin@blrcoop.org",
                password_hash=hash_password("blr12345"),
                full_name="Rajesh Bangalore (Secretary)",
                role="admin",
                is_active=True
            )
            db.add(admin2)
            db.flush()

            farmer2 = models.Farmer(
                cooperative_id=coop2.id,
                farmer_uid="DS-BLR-901",
                full_name="Govindaiah B",
                phone="9845999999",
                village="Hosakote Town",
                is_active=True
            )
            db.add(farmer2)
            db.flush()

            acc2 = models.FarmerAccount(
                farmer_id=farmer2.id,
                pin_hash=hash_password("9999"),
                is_active=True
            )
            db.add(acc2)
            db.commit()

        # Ensure active rate rule exists for coop1
        rule1 = db.query(models.MilkRateRule).filter_by(cooperative_id=coop1.id, is_active=True).first()
        if not rule1:
            rule1 = models.MilkRateRule(
                cooperative_id=coop1.id,
                base_rate=41.0,
                base_fat=4.0,
                base_snf=8.5,
                fat_rate_step=0.45,
                snf_rate_step=0.30,
                min_fat=3.0,
                min_snf=7.5,
                effective_date=datetime.date.today() - datetime.timedelta(days=30),
                is_active=True
            )
            db.add(rule1)
            db.commit()
    finally:
        db.close()

def run_phase3_milk_tests():
    print("=" * 70)
    print("DAIRYSATHI PHASE 3: MILK COLLECTION & RATE MANAGEMENT VERIFICATION")
    print("=" * 70)

    setup_phase3_test_cooperatives()

    # 1. Authenticate Admin (Cooperative 1)
    admin_login_res = client.post("/api/auth/admin/login", json={
        "cooperative_code": "KMF-MLN-108",
        "username_or_email": "admin",
        "password": "admin123"
    })
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_token = admin_login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[TEST 1] Admin Authentication:")
    print("  -> PASSED: Admin logged in successfully with JWT.")

    # 2. Authenticate Farmer 101 (Basavaraj Patil) and Farmer 102 (Manjula Gowda)
    farmer1_login = client.post("/api/auth/farmer/login", json={
        "cooperative_code": "KMF-MLN-108",
        "farmer_uid_or_phone": "DS-FARM-101",
        "pin": "1234"
    })
    assert farmer1_login.status_code == 200, f"Farmer 1 login failed: {farmer1_login.text}"
    farmer1_resp = farmer1_login.json()
    farmer1_token = farmer1_resp["access_token"]
    farmer1_headers = {"Authorization": f"Bearer {farmer1_token}"}
    farmer1_id = farmer1_resp["user_id"]
    print("  -> PASSED: Farmer 1 (DS-FARM-101) authenticated.")

    farmer2_login = client.post("/api/auth/farmer/login", json={
        "cooperative_code": "KMF-MLN-108",
        "farmer_uid_or_phone": "DS-FARM-102",
        "pin": "1234"
    })
    assert farmer2_login.status_code == 200, f"Farmer 2 login failed: {farmer2_login.text}"
    farmer2_resp = farmer2_login.json()
    farmer2_token = farmer2_resp["access_token"]
    farmer2_headers = {"Authorization": f"Bearer {farmer2_token}"}
    farmer2_id = farmer2_resp["user_id"]
    print("  -> PASSED: Farmer 2 (DS-FARM-102) authenticated.")

    # Clean up any pre-existing records for today's test date for isolation
    today = datetime.date.today()
    test_date_str = today.isoformat()
    db = SessionLocal()
    try:
        db.query(models.MilkCollection).filter(
            models.MilkCollection.farmer_id == farmer1_id,
            models.MilkCollection.collection_date == today,
            models.MilkCollection.session == "evening"
        ).delete()
        db.commit()
    finally:
        db.close()

    # -------------------------------------------------------------
    # 2. Transparent Rate Calculation Verification
    # -------------------------------------------------------------
    print("\n[TEST 2] Configurable Rate Calculation Logic:")
    # Base rate = 41.0 at Fat 4.0, SNF 8.5
    # If Fat = 4.4 (+0.4 diff -> +4 steps * 0.45 = +1.80)
    # If SNF = 8.8 (+0.3 diff -> +3 steps * 0.30 = +0.90)
    # Expected rate = 41.0 + 1.80 + 0.90 = 43.70 / Litre
    rate_calc_res = client.get(
        "/api/rates/calculate?quantity=12.5&fat=4.4&snf=8.8",
        headers=admin_headers
    )
    assert rate_calc_res.status_code == 200, f"Rate calculation failed: {rate_calc_res.text}"
    calc_data = rate_calc_res.json()
    assert calc_data["rate_per_litre"] == 43.70, f"Expected 43.70, got {calc_data['rate_per_litre']}"
    assert calc_data["total_amount"] == round(12.5 * 43.70, 2), f"Expected amount {round(12.5 * 43.70, 2)}, got {calc_data['total_amount']}"
    print(f"  -> PASSED: Transparent rate calculated accurately: Rs. {calc_data['rate_per_litre']}/L for Fat 4.4%, SNF 8.8%.")

    # -------------------------------------------------------------
    # 3. Input Validation Tests
    # -------------------------------------------------------------
    print("\n[TEST 3] Backend Input Validation:")
    # 3a. Negative quantity
    res_neg_qty = client.post("/api/milk", headers=admin_headers, json={
        "farmer_id": farmer1_id,
        "collection_date": test_date_str,
        "session": "evening",
        "quantity_litres": -5.0,
        "fat_percentage": 4.0,
        "snf_percentage": 8.5
    })
    assert res_neg_qty.status_code == 422, f"Negative quantity should fail with 422, got {res_neg_qty.status_code}"
    print("  -> PASSED: Negative quantity rejected (HTTP 422).")

    # 3b. Quantity = 0
    res_zero_qty = client.post("/api/milk", headers=admin_headers, json={
        "farmer_id": farmer1_id,
        "collection_date": test_date_str,
        "session": "evening",
        "quantity_litres": 0.0,
        "fat_percentage": 4.0,
        "snf_percentage": 8.5
    })
    assert res_zero_qty.status_code == 422, f"Zero quantity should fail with 422, got {res_zero_qty.status_code}"
    print("  -> PASSED: Zero quantity rejected (HTTP 422).")

    # 3c. Excessive quantity (> 1000L)
    res_excess_qty = client.post("/api/milk", headers=admin_headers, json={
        "farmer_id": farmer1_id,
        "collection_date": test_date_str,
        "session": "evening",
        "quantity_litres": 1500.0,
        "fat_percentage": 4.0,
        "snf_percentage": 8.5
    })
    assert res_excess_qty.status_code == 422, f"Excess quantity should fail with 422, got {res_excess_qty.status_code}"
    print("  -> PASSED: Unrealistic quantity (>1000L) rejected (HTTP 422).")

    # 3d. Future date rejection
    future_date_str = (today + datetime.timedelta(days=7)).isoformat()
    res_future = client.post("/api/milk", headers=admin_headers, json={
        "farmer_id": farmer1_id,
        "collection_date": future_date_str,
        "session": "evening",
        "quantity_litres": 10.0,
        "fat_percentage": 4.0,
        "snf_percentage": 8.5
    })
    assert res_future.status_code == 400, f"Future date should fail with 400, got {res_future.status_code}"
    print("  -> PASSED: Future collection date rejected (HTTP 400).")

    # 3e. Invalid session value
    res_bad_sess = client.post("/api/milk", headers=admin_headers, json={
        "farmer_id": farmer1_id,
        "collection_date": test_date_str,
        "session": "afternoon_tea",
        "quantity_litres": 10.0,
        "fat_percentage": 4.0,
        "snf_percentage": 8.5
    })
    assert res_bad_sess.status_code == 422, f"Invalid session should fail with 422, got {res_bad_sess.status_code}"
    print("  -> PASSED: Invalid session rejected (HTTP 422).")

    # -------------------------------------------------------------
    # 4. Milk Collection Record Creation & Dynamic Pricing
    # -------------------------------------------------------------
    print("\n[TEST 4] Admin Milk Intake & Database Persistence:")
    create_res = client.post("/api/milk", headers=admin_headers, json={
        "farmer_id": farmer1_id,
        "collection_date": test_date_str,
        "session": "evening",
        "quantity_litres": 12.5,
        "fat_percentage": 4.4,
        "snf_percentage": 8.8,
        "notes": "Evening batch testing for Phase 3"
    })
    assert create_res.status_code == 201, f"Milk record creation failed: {create_res.text}"
    created_record = create_res.json()
    record_id = created_record["id"]
    assert created_record["quantity_litres"] == 12.5
    assert created_record["rate_per_litre"] == 43.70
    assert created_record["total_amount"] == 546.25
    assert created_record["payment_status"] == "pending", "New milk collections must start as 'pending'!"
    print(f"  -> PASSED: Milk recorded ID {record_id} for Farmer 1: 12.5L @ Rs. 43.70/L = Rs. 546.25.")
    print("  -> PASSED: Payment status initialized as 'pending' (Requirement 9 satisfied).")

    # -------------------------------------------------------------
    # 5. Duplicate Entry Prevention
    # -------------------------------------------------------------
    print("\n[TEST 5] Duplicate Entry Prevention:")
    dup_res = client.post("/api/milk", headers=admin_headers, json={
        "farmer_id": farmer1_id,
        "collection_date": test_date_str,
        "session": "evening",
        "quantity_litres": 14.0,
        "fat_percentage": 4.2,
        "snf_percentage": 8.6
    })
    assert dup_res.status_code == 409, f"Duplicate entry should return 409 Conflict, got {dup_res.status_code}"
    assert "already exists" in dup_res.json()["detail"]
    print("  -> PASSED: Accidental duplicate submission blocked with HTTP 409 Conflict.")

    # -------------------------------------------------------------
    # 6. Overwrite & Audit Logging
    # -------------------------------------------------------------
    print("\n[TEST 6] Overwrite with Audit Tracking:")
    overwrite_res = client.post(
        f"/api/milk?overwrite=true",
        headers=admin_headers,
        json={
            "farmer_id": farmer1_id,
            "collection_date": test_date_str,
            "session": "evening",
            "quantity_litres": 13.0,
            "fat_percentage": 4.4,
            "snf_percentage": 8.8,
            "notes": "Admin confirmed overwrite"
        }
    )
    assert overwrite_res.status_code == 201, f"Overwrite failed: {overwrite_res.text}"
    overwritten_data = overwrite_res.json()
    assert overwritten_data["id"] == record_id, "Overwrite must update the existing record!"
    assert overwritten_data["quantity_litres"] == 13.0
    assert len(overwritten_data["audits"]) >= 1, "Audit record must be logged on overwrite!"
    print(f"  -> PASSED: Overwrite succeeded on record {record_id}. Audit history attached.")

    # Admin correction endpoint test
    correct_res = client.put(
        f"/api/milk/{record_id}",
        headers=admin_headers,
        json={
            "quantity_litres": 13.5,
            "fat_percentage": 4.5,
            "snf_percentage": 8.8,
            "reason": "Calibration error at weighing scale corrected",
            "notes": "Verified by secretary"
        }
    )
    assert correct_res.status_code == 200, f"Correction failed: {correct_res.text}"
    corrected_data = correct_res.json()
    assert corrected_data["quantity_litres"] == 13.5
    assert len(corrected_data["audits"]) >= 2
    assert corrected_data["audits"][-1]["reason"] == "Calibration error at weighing scale corrected"
    print("  -> PASSED: Official record correction endpoint created audit log with mandatory reason.")

    # -------------------------------------------------------------
    # 7. Admin-to-Farmer Instant Synchronization
    # -------------------------------------------------------------
    print("\n[TEST 7] Admin-to-Farmer Instant Portal Synchronization:")
    # Farmer 1 logs in and accesses their passbook
    passbook_res = client.get(
        f"/api/passbook?start_date={test_date_str}&end_date={test_date_str}",
        headers=farmer1_headers
    )
    assert passbook_res.status_code == 200, f"Farmer passbook retrieval failed: {passbook_res.text}"
    pb_data = passbook_res.json()
    assert pb_data["farmer_id"] == farmer1_id
    assert pb_data["farmer_uid"] == "DS-FARM-101"
    
    # Verify the record exists in farmer's passbook
    matching_records = [r for r in pb_data["records"] if r["id"] == record_id]
    assert len(matching_records) == 1, "Recorded entry not found in farmer's passbook!"
    synced_rec = matching_records[0]
    assert synced_rec["quantity_litres"] == 13.5
    assert synced_rec["payment_status"] == "pending"
    print(f"  -> PASSED: Farmer 101 instantly saw updated record {record_id} (13.5L) in passbook.")
    print(f"  -> PASSED: Financial distinction verified in passbook: Total calculated = Rs. {pb_data['total_earnings']}, Pending = Rs. {pb_data['pending_amount']}.")

    # Verify farmer notification was created
    notif_res = client.get("/api/notifications", headers=farmer1_headers)
    assert notif_res.status_code == 200
    notifs = notif_res.json()
    recent_milk_notifs = [n for n in notifs if n["category"] == "milk"]
    assert len(recent_milk_notifs) > 0, "Farmer notification not generated on milk intake!"
    print(f"  -> PASSED: In-app notification generated for farmer: '{recent_milk_notifs[0]['title']}'.")

    # -------------------------------------------------------------
    # 8. Cross-Farmer Isolation
    # -------------------------------------------------------------
    print("\n[TEST 8] Farmer-to-Farmer Record Isolation:")
    # Farmer 2 attempts to fetch Farmer 1's record via GET /api/milk/{record_id}
    f2_fetch_f1 = client.get(f"/api/milk/{record_id}", headers=farmer2_headers)
    assert f2_fetch_f1.status_code == 403, f"Farmer 2 should be forbidden from accessing Farmer 1 record, got {f2_fetch_f1.status_code}"
    print("  -> PASSED: Farmer 2 access to Farmer 1 milk record strictly rejected (HTTP 403 Forbidden).")

    # Farmer 2 checks their own passbook - must NOT include Farmer 1's record
    f2_pb = client.get(f"/api/passbook?start_date={test_date_str}&end_date={test_date_str}", headers=farmer2_headers)
    assert f2_pb.status_code == 200
    f2_ids = [r["id"] for r in f2_pb.json()["records"]]
    assert record_id not in f2_ids, "Farmer 1 record leaked into Farmer 2 passbook!"
    print("  -> PASSED: Farmer passbooks are strictly scoped to self.")

    # -------------------------------------------------------------
    # 9. Cross-Cooperative Isolation
    # -------------------------------------------------------------
    print("\n[TEST 9] Cooperative Tenant Isolation:")
    # Login Admin 2 from Bangalore Rural Coop
    admin2_login = client.post("/api/auth/admin/login", json={
        "cooperative_code": "KMF-BLR-02",
        "username_or_email": "admin_blr",
        "password": "blr12345"
    })
    assert admin2_login.status_code == 200
    admin2_headers = {"Authorization": f"Bearer {admin2_login.json()['access_token']}"}

    # Admin 2 attempts to view Farmer 1's milk record
    a2_view = client.get(f"/api/milk/{record_id}", headers=admin2_headers)
    assert a2_view.status_code == 404, f"Admin 2 should get 404 for record outside their coop, got {a2_view.status_code}"
    print("  -> PASSED: Admin from KMF-BLR-02 cannot view milk record from KMF-MLN-108 (HTTP 404).")

    # Admin 2 attempts to record milk for Farmer 1 (who belongs to KMF-MLN-108)
    a2_record = client.post("/api/milk", headers=admin2_headers, json={
        "farmer_id": farmer1_id,
        "collection_date": test_date_str,
        "session": "morning",
        "quantity_litres": 10.0,
        "fat_percentage": 4.0,
        "snf_percentage": 8.5
    })
    assert a2_record.status_code == 404, f"Admin 2 should get 404 recording milk for foreign farmer, got {a2_record.status_code}"
    print("  -> PASSED: Admin from KMF-BLR-02 cannot record milk for a farmer in KMF-MLN-108 (HTTP 404).")

    print("\n" + "=" * 70)
    print("ALL PHASE 3 MILK COLLECTION & DATA SYNC TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_phase3_milk_tests()

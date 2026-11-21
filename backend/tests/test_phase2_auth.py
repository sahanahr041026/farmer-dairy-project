import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app import models
from app.security import hash_password

client = TestClient(app)

def setup_second_cooperative_for_isolation_test():
    """Seeds a second distinct cooperative to rigorously test cross-cooperative isolation."""
    db = SessionLocal()
    try:
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
            print("Second test cooperative KMF-BLR-02 initialized for isolation tests.")
    finally:
        db.close()

def run_phase2_tests():
    print("=" * 65)
    print("DAIRYSATHI PHASE 2: DATABASE & AUTHENTICATION VERIFICATION SUITE")
    print("=" * 65)

    setup_second_cooperative_for_isolation_test()

    # -------------------------------------------------------------
    # 1. Admin Login Tests
    # -------------------------------------------------------------
    print("\n[TEST 1] Admin Authentication:")
    # 1a. Invalid cooperative code
    res_bad_coop = client.post("/api/auth/admin/login", json={
        "cooperative_code": "NON-EXISTENT-COOP",
        "username_or_email": "admin",
        "password": "admin123"
    })
    assert res_bad_coop.status_code == 401
    assert "Invalid cooperative code" in res_bad_coop.json()["detail"]
    print("  -> PASSED: Invalid cooperative code rejected.")

    # 1b. Correct cooperative code, but invalid password
    res_bad_pw = client.post("/api/auth/admin/login", json={
        "cooperative_code": "KMF-MLN-108",
        "username_or_email": "admin",
        "password": "wrong_password_here"
    })
    assert res_bad_pw.status_code == 401
    assert "Invalid cooperative code, username/email or password" in res_bad_pw.json()["detail"]
    print("  -> PASSED: Incorrect password rejected.")

    # 1c. Valid admin login
    res_valid_admin = client.post("/api/auth/admin/login", json={
        "cooperative_code": "KMF-MLN-108",
        "username_or_email": "admin",
        "password": "admin123"
    })
    assert res_valid_admin.status_code == 200
    admin_auth_data = res_valid_admin.json()
    assert "access_token" in admin_auth_data
    assert admin_auth_data["role"] == "admin"
    assert admin_auth_data["cooperative_code"] == "KMF-MLN-108"
    admin_token_1 = admin_auth_data["access_token"]
    print(f"  -> PASSED: Valid admin login successful. User: {admin_auth_data['name']}")

    # -------------------------------------------------------------
    # 2. Cooperative Identity Enforcement in Admin Login
    # -------------------------------------------------------------
    print("\n[TEST 2] Cooperative Identity Binding:")
    # Admin from KMF-BLR-02 tries to log in under KMF-MLN-108
    cross_coop_admin = client.post("/api/auth/admin/login", json={
        "cooperative_code": "KMF-MLN-108", # Wrong coop
        "username_or_email": "admin_blr",   # Belongs to KMF-BLR-02
        "password": "blr12345"
    })
    assert cross_coop_admin.status_code == 401
    print("  -> PASSED: Cross-cooperative admin login strictly blocked.")

    # -------------------------------------------------------------
    # 3. Farmer Authentication Tests
    # -------------------------------------------------------------
    print("\n[TEST 3] Farmer Authentication:")
    # 3a. Invalid farmer UID
    res_bad_farmer = client.post("/api/auth/farmer/login", json={
        "cooperative_code": "KMF-MLN-108",
        "farmer_uid_or_phone": "INVALID-UID-999",
        "pin": "1234"
    })
    assert res_bad_farmer.status_code == 401
    assert "Invalid cooperative code, Farmer ID/Phone or PIN" in res_bad_farmer.json()["detail"]
    print("  -> PASSED: Invalid farmer UID rejected.")

    # 3b. Correct farmer UID, invalid PIN
    res_bad_pin = client.post("/api/auth/farmer/login", json={
        "cooperative_code": "KMF-MLN-108",
        "farmer_uid_or_phone": "DS-FARM-101",
        "pin": "0000"
    })
    assert res_bad_pin.status_code == 401
    assert "Invalid cooperative code, Farmer ID/Phone or PIN" in res_bad_pin.json()["detail"]
    print("  -> PASSED: Incorrect farmer PIN rejected.")

    # 3c. Valid farmer login via UID
    res_valid_farmer1 = client.post("/api/auth/farmer/login", json={
        "cooperative_code": "KMF-MLN-108",
        "farmer_uid_or_phone": "DS-FARM-101",
        "pin": "1234"
    })
    assert res_valid_farmer1.status_code == 200
    farmer_auth_1 = res_valid_farmer1.json()
    assert farmer_auth_1["role"] == "farmer"
    assert farmer_auth_1["farmer_uid"] == "DS-FARM-101"
    farmer_token_1 = farmer_auth_1["access_token"]
    print(f"  -> PASSED: Farmer 101 login successful. Name: {farmer_auth_1['name']}")

    # 3d. Valid farmer login via Phone Number
    res_valid_phone = client.post("/api/auth/farmer/login", json={
        "cooperative_code": "KMF-MLN-108",
        "farmer_uid_or_phone": "9845012345", # Phone of DS-FARM-101
        "pin": "1234"
    })
    assert res_valid_phone.status_code == 200
    assert res_valid_phone.json()["farmer_uid"] == "DS-FARM-101"
    print("  -> PASSED: Farmer phone number login verified.")

    # -------------------------------------------------------------
    # 4. Protected Routes & Server-Side Role-Based Authorization
    # -------------------------------------------------------------
    print("\n[TEST 4] Protected Routes & Role Authorization:")
    # 4a. No token
    client.cookies.clear()  # drop the session cookie set by earlier logins
    res_no_token = client.get("/api/auth/me")
    assert res_no_token.status_code == 401
    print("  -> PASSED: Unauthenticated access blocked on /api/auth/me.")

    # 4b. Farmer token attempting to access Admin endpoint (/api/farmers create)
    res_forbidden_admin_route = client.post("/api/farmers", headers={"Authorization": f"Bearer {farmer_token_1}"}, json={
        "farmer_uid": "TEST-HACK", "full_name": "Hacker", "phone": "1234567890", "village": "None"
    })
    assert res_forbidden_admin_route.status_code == 403
    assert "Admin authorization required" in res_forbidden_admin_route.json()["detail"]
    print("  -> PASSED: Farmer blocked with 403 Forbidden on Admin endpoints.")

    # 4c. Admin token on /api/auth/me
    res_admin_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token_1}"})
    assert res_admin_me.status_code == 200
    assert res_admin_me.json()["role"] == "admin"
    print("  -> PASSED: Admin verified on /api/auth/me.")

    # 4d. Farmer token on /api/auth/me
    res_farmer_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {farmer_token_1}"})
    assert res_farmer_me.status_code == 200
    assert res_farmer_me.json()["role"] == "farmer"
    print("  -> PASSED: Farmer verified on /api/auth/me.")

    # -------------------------------------------------------------
    # 5. Cooperative-Level Data Isolation (Multi-Tenancy)
    # -------------------------------------------------------------
    print("\n[TEST 5] Cooperative-Level Data Isolation:")
    # Login as Admin 2 (from KMF-BLR-02)
    res_admin2 = client.post("/api/auth/admin/login", json={
        "cooperative_code": "KMF-BLR-02",
        "username_or_email": "admin_blr",
        "password": "blr12345"
    })
    assert res_admin2.status_code == 200
    admin_token_2 = res_admin2.json()["access_token"]

    # Admin 1 (KMF-MLN-108) lists farmers
    farmers_coop1 = client.get("/api/farmers", headers={"Authorization": f"Bearer {admin_token_1}"}).json()
    uids_coop1 = [f["farmer_uid"] for f in farmers_coop1]
    assert "DS-FARM-101" in uids_coop1
    assert "DS-BLR-901" not in uids_coop1

    # Admin 2 (KMF-BLR-02) lists farmers
    farmers_coop2 = client.get("/api/farmers", headers={"Authorization": f"Bearer {admin_token_2}"}).json()
    uids_coop2 = [f["farmer_uid"] for f in farmers_coop2]
    assert "DS-BLR-901" in uids_coop2
    assert "DS-FARM-101" not in uids_coop2
    print("  -> PASSED: Admins strictly isolated to their own cooperative's farmers!")

    # -------------------------------------------------------------
    # 6. Farmer-Level Data Isolation
    # -------------------------------------------------------------
    print("\n[TEST 6] Farmer-to-Farmer Isolation:")
    # Farmer 1 (DS-FARM-101) queries passbook requesting Farmer 2 (id=2)
    farmer_cross_attempt = client.get("/api/passbook?farmer_id=2", headers={"Authorization": f"Bearer {farmer_token_1}"})
    assert farmer_cross_attempt.status_code == 200
    # The server strictly overrides farmer_id with the authenticated farmer's id (id=1)
    assert farmer_cross_attempt.json()["farmer_uid"] == "DS-FARM-101"
    print("  -> PASSED: Server overrides query params; farmers can only view their own data.")

    print("\n" + "=" * 65)
    print("ALL PHASE 2 DATABASE & AUTHENTICATION TESTS PASSED!")
    print("=" * 65 + "\n")

def test_phase2_auth_and_isolation():
    run_phase2_tests()

if __name__ == "__main__":
    run_phase2_tests()

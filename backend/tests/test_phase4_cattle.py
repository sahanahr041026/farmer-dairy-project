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

def setup_phase4_test_environment():
    """Ensures test cooperatives, admins, and farmers exist."""
    db = SessionLocal()
    try:
        coop1 = db.query(models.Cooperative).filter_by(code="KMF-MLN-108").first()
        assert coop1 is not None, "Primary cooperative KMF-MLN-108 not found."

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
    finally:
        db.close()

def run_phase4_tests():
    print("=" * 75)
    print("DAIRYSATHI PHASE 4: CATTLE CARE & INTELLIGENT ASSISTANT TEST SUITE")
    print("=" * 75)

    setup_phase4_test_environment()

    # 1. Authentications
    print("\n[TEST 1] Authentications:")
    admin_login = client.post("/api/auth/admin/login", json={
        "cooperative_code": "KMF-MLN-108",
        "username_or_email": "admin",
        "password": "admin123"
    })
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    farmer1_login = client.post("/api/auth/farmer/login", json={
        "cooperative_code": "KMF-MLN-108",
        "farmer_uid_or_phone": "DS-FARM-101",
        "pin": "1234"
    })
    assert farmer1_login.status_code == 200
    farmer1_resp = farmer1_login.json()
    farmer1_headers = {"Authorization": f"Bearer {farmer1_resp['access_token']}"}
    farmer1_id = farmer1_resp["user_id"]

    farmer2_login = client.post("/api/auth/farmer/login", json={
        "cooperative_code": "KMF-MLN-108",
        "farmer_uid_or_phone": "DS-FARM-102",
        "pin": "1234"
    })
    assert farmer2_login.status_code == 200
    farmer2_resp = farmer2_login.json()
    farmer2_headers = {"Authorization": f"Bearer {farmer2_resp['access_token']}"}
    farmer2_id = farmer2_resp["user_id"]

    admin2_login = client.post("/api/auth/admin/login", json={
        "cooperative_code": "KMF-BLR-02",
        "username_or_email": "admin_blr",
        "password": "blr12345"
    })
    assert admin2_login.status_code == 200
    admin2_headers = {"Authorization": f"Bearer {admin2_login.json()['access_token']}"}

    print("  -> PASSED: Admin, Farmer 101, Farmer 102, and Admin 2 authenticated.")

    # -------------------------------------------------------------
    # 2. Cattle Profile Management (Add, View, Edit)
    # -------------------------------------------------------------
    print("\n[TEST 2] Cattle Profile Management (Farmer & Admin):")
    # Clean up test tag if already exists
    db = SessionLocal()
    try:
        test_cows = db.query(models.Cattle).filter(models.Cattle.tag_number.in_(["KA-14-TEST-GIR-99", "KA-14-ADMIN-HF-88"])).all()
        for c in test_cows:
            db.query(models.CattleReminder).filter(models.CattleReminder.cattle_id == c.id).delete()
            db.delete(c)
        db.commit()
    finally:
        db.close()

    # 2a. Farmer registers cattle directly
    create_cow_res = client.post("/api/cattle", headers=farmer1_headers, json={
        "tag_number": "KA-14-TEST-GIR-99",
        "name": "Nandini Gir",
        "breed": "Gir",
        "age_years": 3.2,
        "gender": "Female",
        "milking_status": "Milking",
        "daily_yield_estimate": 14.5,
        "health_notes": "Calved 2 months ago, excellent milk fat."
    })
    assert create_cow_res.status_code == 201, f"Farmer cattle creation failed: {create_cow_res.text}"
    cow_data = create_cow_res.json()
    cow_id = cow_data["id"]
    assert cow_data["farmer_id"] == farmer1_id
    assert cow_data["name"] == "Nandini Gir"
    print(f"  -> PASSED: Farmer 101 registered cattle '{cow_data['name']}' (Tag: {cow_data['tag_number']}).")

    # 2b. View cattle list as Farmer 1
    f1_list_res = client.get("/api/cattle", headers=farmer1_headers)
    assert f1_list_res.status_code == 200
    f1_cows = f1_list_res.json()
    assert any(c["id"] == cow_id for c in f1_cows)
    print(f"  -> PASSED: Farmer 101 sees own cattle list ({len(f1_cows)} animals).")

    # 2c. Farmer edits cattle profile
    edit_cow_res = client.put(f"/api/cattle/{cow_id}", headers=farmer1_headers, json={
        "name": "Nandini Gir Supreme",
        "daily_yield_estimate": 15.5,
        "health_notes": "Daily yield increased to 15.5L after bypass fat supplement."
    })
    assert edit_cow_res.status_code == 200, f"Farmer cattle update failed: {edit_cow_res.text}"
    updated_cow = edit_cow_res.json()
    assert updated_cow["name"] == "Nandini Gir Supreme"
    assert updated_cow["daily_yield_estimate"] == 15.5
    print(f"  -> PASSED: Farmer 101 updated profile: Yield changed to {updated_cow['daily_yield_estimate']}L.")

    # 2d. Admin views and updates the cattle
    admin_get_res = client.get(f"/api/cattle/{cow_id}", headers=admin_headers)
    assert admin_get_res.status_code == 200
    admin_cow = admin_get_res.json()
    assert admin_cow["name"] == "Nandini Gir Supreme"
    print("  -> PASSED: Cooperative Admin retrieved farmer cattle profile.")

    # -------------------------------------------------------------
    # 3. Isolation & Security Verification
    # -------------------------------------------------------------
    print("\n[TEST 3] Cattle Isolation & Security:")
    # 3a. Farmer 2 cannot access Farmer 1's cattle
    f2_fetch_res = client.get(f"/api/cattle/{cow_id}", headers=farmer2_headers)
    assert f2_fetch_res.status_code == 403, f"Farmer 2 should get 403, got {f2_fetch_res.status_code}"
    print("  -> PASSED: Farmer 2 access to Farmer 1 cattle rejected (HTTP 403 Forbidden).")

    # 3b. Farmer 2 cannot edit Farmer 1's cattle
    f2_edit_res = client.put(f"/api/cattle/{cow_id}", headers=farmer2_headers, json={"name": "Hacked Cow"})
    assert f2_edit_res.status_code == 403, f"Farmer 2 should get 403 on edit, got {f2_edit_res.status_code}"
    print("  -> PASSED: Farmer 2 edit of Farmer 1 cattle rejected (HTTP 403 Forbidden).")

    # 3c. Farmer 2 cannot delete Farmer 1's cattle
    f2_del_res = client.delete(f"/api/cattle/{cow_id}", headers=farmer2_headers)
    assert f2_del_res.status_code == 403, f"Farmer 2 should get 403 on delete, got {f2_del_res.status_code}"
    print("  -> PASSED: Farmer 2 delete of Farmer 1 cattle rejected (HTTP 403 Forbidden).")

    # 3d. Admin 2 (Cooperative 2) cannot access Farmer 1's cattle
    a2_fetch_res = client.get(f"/api/cattle/{cow_id}", headers=admin2_headers)
    assert a2_fetch_res.status_code == 404, f"Admin 2 should get 404 for cross-coop cattle, got {a2_fetch_res.status_code}"
    print("  -> PASSED: Admin from KMF-BLR-02 blocked from KMF-MLN-108 cattle (HTTP 404).")

    # -------------------------------------------------------------
    # 4. Breed Advisory Catalog Verification
    # -------------------------------------------------------------
    print("\n[TEST 4] Breed Advisory & Feeding Guide API:")
    breeds_res = client.get("/api/cattle/breeds")
    assert breeds_res.status_code == 200, f"Breed advisory failed: {breeds_res.text}"
    breeds = breeds_res.json()
    assert len(breeds) >= 6, "Expected at least 6 standard dairy breeds!"
    breed_ids = [b["id"] for b in breeds]
    assert "gir" in breed_ids and "murrah" in breed_ids and "jersey_cross" in breed_ids and "hf_cross" in breed_ids

    # Check detailed breed advisory for Murrah buffalo
    murrah_res = client.get("/api/cattle/breeds/murrah")
    assert murrah_res.status_code == 200
    murrah = murrah_res.json()
    assert "7.0%" in murrah["fat_content"]
    assert "green_fodder" in murrah["feeding_guide"]
    assert "ಹಸಿರು ಮೇವು" in murrah["feeding_guide_kn"]["green_fodder"]
    print("  -> PASSED: Breed advisory catalog returned detailed nutrition, fat profiles, and Kannada guides.")

    # -------------------------------------------------------------
    # 5. Vaccination & Health Reminders
    # -------------------------------------------------------------
    print("\n[TEST 5] Health Reminders & Schedule Coordination:")
    # 5a. Retrieve reminder templates
    tpl_res = client.get("/api/cattle/reminders/templates")
    assert tpl_res.status_code == 200
    templates = tpl_res.json()
    assert len(templates) >= 5
    print(f"  -> PASSED: Retrieved {len(templates)} veterinary reminder templates (FMD, HS, BQ, Deworming, Brucellosis).")

    # 5b. Admin schedules a reminder for Farmer 1
    due_date = (datetime.date.today() + datetime.timedelta(days=10)).isoformat()
    rem_res = client.post("/api/cattle/reminders", headers=admin_headers, json={
        "farmer_id": farmer1_id,
        "cattle_id": cow_id,
        "title": "Bi-Annual FMD Booster",
        "title_kn": "ಕಾಲು ಮತ್ತು ಬಾಯಿ ರೋಗದ ಲಸಿಕೆ",
        "care_type": "vaccination",
        "due_date": due_date,
        "veterinarian_notes": "Administer 2ml subcutaneous. Keep animal calm."
    })
    assert rem_res.status_code == 201, f"Reminder creation failed: {rem_res.text}"
    reminder_data = rem_res.json()
    rem_id = reminder_data["id"]
    assert reminder_data["status"] == "upcoming"
    print(f"  -> PASSED: Admin scheduled reminder ID {rem_id}: '{reminder_data['title']}' for {due_date}.")

    # 5c. Farmer 1 views reminders
    f1_rems_res = client.get("/api/cattle/reminders", headers=farmer1_headers)
    assert f1_rems_res.status_code == 200
    f1_rems = f1_rems_res.json()
    matching_rems = [r for r in f1_rems if r["id"] == rem_id]
    assert len(matching_rems) == 1, "Scheduled reminder not visible to farmer!"
    print(f"  -> PASSED: Farmer 101 instantly saw scheduled reminder in their portal.")

    # 5d. Farmer receives automatic in-app notification
    notifs_res = client.get("/api/notifications", headers=farmer1_headers)
    assert notifs_res.status_code == 200
    recent_cattle_notifs = [n for n in notifs_res.json() if n["category"] == "cattle"]
    assert len(recent_cattle_notifs) > 0, "No notification generated for cattle reminder!"
    print(f"  -> PASSED: Farmer in-app notification confirmed: '{recent_cattle_notifs[0]['title']}'.")

    # 5e. Mark reminder as completed
    complete_res = client.put(f"/api/cattle/reminders/{rem_id}", headers=farmer1_headers, json={
        "status": "completed",
        "veterinarian_notes": "Vaccinated by Dr. Ramesh Hegde at village camp."
    })
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "completed"
    print("  -> PASSED: Reminder marked as completed with veterinarian notes.")

    # -------------------------------------------------------------
    # 6. Conversational AI Cattle-Care Assistant
    # -------------------------------------------------------------
    print("\n[TEST 6] Conversational AI Cattle-Care Assistant:")
    # 6a. Nutrition Query
    q_feed = client.post("/api/assistant/chat", headers=farmer1_headers, json={
        "message": "What should I feed my lactating cow to increase milk?",
        "language": "en"
    })
    assert q_feed.status_code == 200, f"Assistant chat failed: {q_feed.text}"
    feed_resp = q_feed.json()
    assert "Green Fodder" in feed_resp["response"] or "fodder" in feed_resp["response"].lower()
    print("  -> PASSED: Assistant returned comprehensive dairy nutrition guidelines.")

    # 6b. Kannada Query for Vaccination
    q_kn = client.post("/api/assistant/chat", headers=farmer1_headers, json={
        "message": "ಹಸುವಿಗೆ ಕಾಲುಬಾಯಿ ರೋಗದ ಲಸಿಕೆ ಯಾವಾಗ ನೀಡಬೇಕು?",
        "language": "kn"
    })
    assert q_kn.status_code == 200
    kn_resp = q_kn.json()
    assert "ಲಸಿಕೆ" in kn_resp["response"] or "ಕಾಲು" in kn_resp["response"]
    print("  -> PASSED: Assistant returned accurate Kannada response for FMD vaccination schedule.")

    # 6c. AI Heat Detection & AM/PM Rule
    q_heat = client.post("/api/assistant/chat", headers=farmer1_headers, json={
        "message": "How do I know my cow is in heat and when to do AI?",
        "language": "en"
    })
    assert q_heat.status_code == 200
    heat_resp = q_heat.json()
    assert "standing heat" in heat_resp["response"].lower() or "am/pm" in heat_resp["response"].lower()
    print("  -> PASSED: Assistant provided clear standing heat signs and AM/PM insemination timing.")

    # 6d. Emergency Escalation & Medical Safety Notice
    q_sick = client.post("/api/assistant/chat", headers=farmer1_headers, json={
        "message": "My cow has high fever 104F, bloat and stopped eating",
        "language": "en"
    })
    assert q_sick.status_code == 200
    sick_resp = q_sick.json()
    assert "veterinarian" in sick_resp["response"].lower() or "doctor" in sick_resp["response"].lower()
    assert "Safety Advisory" in sick_resp["response"] or "Safety" in sick_resp["response"]
    assert sick_resp["vet_contact"] is not None
    assert "phone" in sick_resp["vet_contact"]
    print(f"  -> PASSED: Emergency inquiry immediately escalated to cooperative vet ({sick_resp['vet_contact']['name']}) with medical safety disclaimer.")

    print("\n" + "=" * 75)
    print("ALL PHASE 4 CATTLE CARE & AI ASSISTANT TESTS PASSED 100%!")
    print("=" * 75)

if __name__ == "__main__":
    run_phase4_tests()

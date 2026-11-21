import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_dairysathi_workflow():
    print("\n--- TEST 1: Cooperative Public Discovery ---")
    res = client.get("/api/auth/cooperatives")
    assert res.status_code == 200
    coops = res.json()
    assert len(coops) >= 1
    coop_code = coops[0]["code"]
    print(f"Verified cooperative: {coops[0]['name']} ({coop_code})")

    print("\n--- TEST 2: Admin Login with Cooperative Validation ---")
    # Invalid coop code
    bad_login = client.post("/api/auth/admin/login", json={
        "cooperative_code": "INVALID-CODE",
        "username_or_email": "admin",
        "password": "wrongpassword"
    })
    assert bad_login.status_code == 401
    print("Verified invalid cooperative code rejected.")

    # Valid admin login
    admin_login = client.post("/api/auth/admin/login", json={
        "cooperative_code": "KMF-MLN-108",
        "username_or_email": "admin",
        "password": "admin123"
    })
    assert admin_login.status_code == 200, f"Login failed: {admin_login.text}"
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("Admin login successful. JWT token received.")

    print("\n--- TEST 3: Admin Views Farmers & Summary ---")
    farmers_res = client.get("/api/farmers", headers=admin_headers)
    assert farmers_res.status_code == 200
    farmers = farmers_res.json()
    assert len(farmers) >= 5
    target_farmer = farmers[0]
    farmer_id = target_farmer["id"]
    farmer_uid = target_farmer["farmer_uid"]
    print(f"Found {len(farmers)} farmers. Target: {target_farmer['full_name']} ({farmer_uid})")

    summary_res = client.get("/api/reports/summary", headers=admin_headers)
    assert summary_res.status_code == 200
    print(f"Summary metrics: Total farmers={summary_res.json()['total_farmers']}, Monthly Litres={summary_res.json()['monthly_collection']['total_litres']}")

    print("\n--- TEST 4: Admin Records New Milk Collection ---")
    import datetime
    today = datetime.date.today().isoformat()
    # Record for tomorrow or distinct session to avoid collision with seed
    new_milk = client.post("/api/milk?allow_duplicate=true", headers=admin_headers, json={
        "farmer_id": farmer_id,
        "collection_date": today,
        "session": "evening",
        "quantity_litres": 15.0,
        "fat_percentage": 4.5,
        "snf_percentage": 8.7,
        "notes": "Evening batch testing"
    })
    assert new_milk.status_code == 201
    milk_record = new_milk.json()
    record_id = milk_record["id"]
    calc_amount = milk_record["total_amount"]
    rate = milk_record["rate_per_litre"]
    print(f"Recorded 15.0L @ INR {rate}/L = INR {calc_amount}. Record ID: {record_id}")

    print("\n--- TEST 5: Farmer Login & Automatic Synchronization Verification ---")
    farmer_login = client.post("/api/auth/farmer/login", json={
        "cooperative_code": "KMF-MLN-108",
        "farmer_uid_or_phone": farmer_uid,
        "pin": "1234"
    })
    assert farmer_login.status_code == 200
    farmer_token = farmer_login.json()["access_token"]
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
    print(f"Farmer '{target_farmer['full_name']}' logged in successfully.")

    # Farmer checks passbook
    passbook_res = client.get("/api/passbook", headers=farmer_headers)
    assert passbook_res.status_code == 200
    passbook_data = passbook_res.json()
    rec_ids = [r["id"] for r in passbook_data["records"]]
    assert record_id in rec_ids, "Newly added milk record was not automatically synchronized to farmer portal!"
    print("Automatic Synchronization VERIFIED: Farmer passbook contains latest milk record!")

    print("\n--- TEST 6: Digital E-Passbook PDF Generation ---")
    pdf_res = client.get(f"/api/passbook/pdf?farmer_id={farmer_id}", headers=farmer_headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert pdf_res.content.startswith(b"%PDF-1.4")
    print(f"Passbook PDF generated successfully ({len(pdf_res.content)} bytes).")

    print("\n--- TEST 7: Admin Corrects Milk Record & Farmer Sees Correction ---")
    correct_res = client.put(f"/api/milk/{record_id}", headers=admin_headers, json={
        "quantity_litres": 16.0,
        "fat_percentage": 4.6,
        "snf_percentage": 8.8,
        "reason": "Calibration correction on digital weighing scale"
    })
    assert correct_res.status_code == 200
    corrected = correct_res.json()
    assert corrected["quantity_litres"] == 16.0
    assert len(corrected["audits"]) >= 1
    assert corrected["audits"][-1]["reason"] == "Calibration correction on digital weighing scale"
    print(f"Admin corrected record to 16.0L (New Amount: INR {corrected['total_amount']}). Audit logged.")

    # Farmer views passbook again
    passbook_after = client.get("/api/passbook", headers=farmer_headers).json()
    matching_rec = [r for r in passbook_after["records"] if r["id"] == record_id][0]
    assert matching_rec["quantity_litres"] == 16.0
    assert len(matching_rec["audits"]) >= 1
    print("Correction Synchronization VERIFIED: Farmer portal reflects updated 16.0L with audit note!")

    print("\n--- TEST 8: Cattle Reminders Visible in Farmer Portal ---")
    reminders_res = client.get("/api/cattle/reminders", headers=farmer_headers)
    assert reminders_res.status_code == 200
    reminders = reminders_res.json()
    assert len(reminders) >= 1
    print(f"Farmer cattle reminders verified: {len(reminders)} reminders retrieved.")

    print("\n--- TEST 9: Cattle Care AI Assistant with Fallback & Vet Escalation ---")
    chat_res = client.post("/api/assistant/chat", headers=farmer_headers, json={
        "message": "My cow has swollen hot udder and clotted milk, what to do?",
        "language": "en"
    })
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert chat_data["source"] in ["curated_expert_faq", "live_llm"]
    assert "vet_contact" in chat_data
    assert chat_data["vet_contact"]["name"] != ""
    print(f"Assistant responded (Source: {chat_data['source']}). Vet contact: {chat_data['vet_contact']['name']} ({chat_data['vet_contact']['phone']})")

    print("\n--- TEST 10: SMS Notifications Module (Last Feature Module) ---")
    # Preview
    preview_res = client.post("/api/sms/preview", headers=admin_headers, json={
        "title": "National Deworming Drive",
        "message": "KMF reminder: National deworming camp at village centre tomorrow at 8 AM. Please bring all cattle.",
        "target_audience": "all"
    })
    assert preview_res.status_code == 200
    prev_data = preview_res.json()
    assert prev_data["recipient_count"] >= 5
    assert prev_data["is_mock_gateway"] is True # Without external API key
    assert "SIMULATED" in prev_data["mock_banner"]
    print(f"SMS preview verified: {prev_data['recipient_count']} recipients, Mock Banner: {prev_data['mock_banner'][:60]}...")

    # Send
    send_res = client.post("/api/sms/send", headers=admin_headers, json={
        "title": "National Deworming Drive",
        "message": "KMF reminder: National deworming camp at village centre tomorrow at 8 AM. Please bring all cattle.",
        "target_audience": "all"
    })
    assert send_res.status_code == 201
    send_data = send_res.json()
    assert send_data["is_mock_delivery"] is True
    print("SMS campaign recorded in database with explicit mock delivery status.")

    print("\n==========================================")
    print("ALL 10 BACKEND END-TO-END TESTS PASSED!")
    print("==========================================\n")

if __name__ == "__main__":
    test_full_dairysathi_workflow()

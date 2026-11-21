"""Regression tests for the issues found in the project review (requires seeded DB)."""
import datetime
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
COOP = "KMF-MLN-108"


def _admin_headers():
    r = client.post("/api/auth/admin/login", json={
        "cooperative_code": COOP, "username_or_email": "admin", "password": "admin123"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _farmer_headers(uid="DS-FARM-101"):
    r = client.post("/api/auth/farmer/login", json={
        "cooperative_code": COOP, "farmer_uid_or_phone": uid, "pin": "1234"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_login_is_throttled_and_generic():
    body = {"cooperative_code": COOP, "farmer_uid_or_phone": "DS-NOBODY-THROTTLE", "pin": "0000"}
    codes = [client.post("/api/auth/farmer/login", json=body).status_code for _ in range(7)]
    assert codes[:5] == [401] * 5
    assert 429 in codes[5:]


def test_partial_cooperative_name_does_not_match():
    r = client.post("/api/auth/admin/login", json={
        "cooperative_code": "KMF", "username_or_email": "admin", "password": "admin123"})
    assert r.status_code == 401


def test_farmer_requires_four_digit_pin():
    h = _admin_headers()
    r = client.post("/api/farmers", headers=h, json={
        "farmer_uid": "TMP-PIN-1", "full_name": "T", "phone": "9000000001",
        "village": "V", "initial_pin": "12"})
    assert r.status_code == 422


def test_settlement_flow_only_settles_linked_records_and_blocks_edits():
    h = _admin_headers()
    farmers = client.get("/api/farmers", headers=h).json()
    fid = farmers[1]["id"]
    d_old = (datetime.date.today() - datetime.timedelta(days=700)).isoformat()
    d_new = (datetime.date.today() - datetime.timedelta(days=699)).isoformat()

    rec = client.post("/api/milk?allow_duplicate=true", headers=h, json={
        "farmer_id": fid, "collection_date": d_old, "session": "morning",
        "quantity_litres": 10, "fat_percentage": 4.0, "snf_percentage": 8.5})
    assert rec.status_code == 201, rec.text

    st = client.post("/api/payments/settle", headers=h, json={
        "farmer_id": fid, "period_start": d_old, "period_end": d_new})
    assert st.status_code == 201, st.text
    sid = st.json()["id"]

    # Record added AFTER the settlement was generated, inside the same date range.
    late = client.post("/api/milk?allow_duplicate=true", headers=h, json={
        "farmer_id": fid, "collection_date": d_new, "session": "evening",
        "quantity_litres": 5, "fat_percentage": 4.0, "snf_percentage": 8.5})
    assert late.status_code == 201, late.text

    done = client.put(f"/api/payments/{sid}", headers=h, json={"status": "completed"})
    assert done.status_code == 200, done.text
    # Completing twice must be rejected (no duplicate notification / state change).
    assert client.put(f"/api/payments/{sid}", headers=h, json={"status": "completed"}).status_code == 409
    # Overpaying is rejected on a fresh settlement attempt path; unknown status is rejected by schema.
    assert client.put(f"/api/payments/{sid}", headers=h, json={"status": "bogus"}).status_code == 422

    rows = client.get(f"/api/milk?farmer_id={fid}&start_date={d_old}&end_date={d_new}", headers=h).json()
    by_session = {r["session"]: r for r in rows}
    assert by_session["morning"]["payment_status"] == "settled"
    assert by_session["evening"]["payment_status"] == "pending"  # not linked -> untouched

    # Settled record cannot be corrected or overwritten.
    mid = by_session["morning"]["id"]
    fix = client.put(f"/api/milk/{mid}", headers=h, json={"quantity_litres": 11, "reason": "wrong reading"})
    assert fix.status_code == 409
    ow = client.post("/api/milk?overwrite=true", headers=h, json={
        "farmer_id": fid, "collection_date": d_old, "session": "morning", "quantity_litres": 12})
    assert ow.status_code == 409


def test_farmer_cannot_mark_other_farmers_notification_read():
    admin = _admin_headers()
    f1 = _farmer_headers("DS-FARM-101")
    f2 = _farmer_headers("DS-FARM-102")
    f2_notifs = client.get("/api/notifications", headers=f2).json()
    own = [n for n in f2_notifs if n.get("farmer_id") not in (None,)]
    assert own, "seed should contain a notification for farmer 102"
    r = client.put(f"/api/notifications/{own[0]['id']}/read", headers=f1)
    assert r.status_code == 404
    assert client.put(f"/api/notifications/{own[0]['id']}/read", headers=f2).status_code == 200
    assert admin  # admin login still fine


def test_csv_export_requires_auth_header():
    assert client.get("/api/reports/export/collections-csv").status_code == 401
    r = client.get("/api/reports/export/collections-csv", headers=_admin_headers())
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/csv")

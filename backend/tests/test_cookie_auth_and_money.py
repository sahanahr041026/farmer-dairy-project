"""Cookie-session auth, CSRF guard, and exact-money arithmetic (requires seeded DB)."""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.money import calc_amount, q2, money_sum
from app.routers.rates import compute_rate
from app import models

COOP = "KMF-MLN-108"
CSRF = {"X-Requested-With": settings.CSRF_HEADER_VALUE}


def _login(client):
    return client.post("/api/auth/admin/login", json={
        "cooperative_code": COOP, "username_or_email": "admin", "password": "admin123"})


def test_login_sets_httponly_cookie_and_cookie_authenticates_gets():
    c = TestClient(app)
    r = _login(c)
    assert r.status_code == 200
    set_cookie = r.headers.get("set-cookie", "")
    assert settings.COOKIE_NAME in set_cookie
    assert "httponly" in set_cookie.lower()
    assert "samesite=lax" in set_cookie.lower()
    assert c.get("/api/auth/me").status_code == 200  # cookie only, no Authorization header


def test_cookie_requests_that_change_state_require_csrf_header():
    c = TestClient(app)
    _login(c)
    body = {"farmer_uid": "CSRF-1", "full_name": "T", "phone": "9000000099", "village": "V", "initial_pin": "4321"}
    assert c.post("/api/farmers", json=body).status_code == 403
    ok = c.post("/api/farmers", json=body, headers=CSRF)
    assert ok.status_code == 201, ok.text


def test_bearer_tokens_still_work_without_csrf_header():
    c = TestClient(app)
    token = _login(c).json()["access_token"]
    fresh = TestClient(app)  # no cookie jar
    body = {"farmer_uid": "BEARER-1", "full_name": "T", "phone": "9000000098", "village": "V", "initial_pin": "4321"}
    r = fresh.post("/api/farmers", json=body, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201, r.text


def test_logout_clears_session():
    c = TestClient(app)
    _login(c)
    assert c.post("/api/auth/logout").status_code == 200
    assert c.get("/api/auth/me").status_code == 401


def test_unauthenticated_requests_are_rejected():
    assert TestClient(app).get("/api/reports/summary").status_code == 401


def test_half_up_rounding_matches_money_expectations():
    assert q2(2.675) == 2.68          # builtin round(2.675, 2) == 2.67
    assert q2(1.005) == 1.01          # builtin round(1.005, 2) == 1.0
    assert calc_amount(10.5, 43.85) == 460.43  # 460.425 -> half-up
    assert money_sum([0.1, 0.2, 0.3]) == 0.6   # float sum is 0.6000000000000001


def test_compute_rate_uses_exact_decimals_and_clamps():
    rule = models.MilkRateRule(
        calculation_method="fat_snf_formula", base_rate=41.0, base_fat=4.0, base_snf=8.5,
        fat_rate_step=0.45, snf_rate_step=0.30, min_rate=20.0, max_rate=80.0, flat_rate=40.0)
    assert compute_rate(rule, 4.4, 8.7) == 41.0 + 0.4 * 10 * 0.45 + 0.2 * 10 * 0.30  # 43.4
    assert compute_rate(rule, 20.0, 20.0) == 80.0   # clamped to max
    assert compute_rate(rule, 0.0, 0.0) == 20.0     # clamped to min
    rule.calculation_method = "flat_rate"
    assert compute_rate(rule, 9, 9) == 40.0

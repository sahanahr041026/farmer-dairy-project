import pytest


@pytest.fixture(autouse=True)
def _reset_login_throttle():
    from app import security
    security._failed_logins.clear()
    yield
    security._failed_logins.clear()

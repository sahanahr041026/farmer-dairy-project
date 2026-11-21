import hmac
import hashlib
import json
import base64
import os
import datetime
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app import models

security_scheme = HTTPBearer(auto_error=False)

def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def b64url_decode(data: str) -> bytes:
    padding = '=' * (-len(data) % 4)
    return base64.urlsafe_b64decode((data + padding).encode('utf-8'))

PBKDF2_ITERATIONS = 600_000
LEGACY_ITERATIONS = 100_000


def hash_password(password: str) -> str:
    """Format: pbkdf2_sha256$<iterations>$<salt hex>$<hash hex>."""
    salt = os.urandom(16)
    kdf = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${kdf.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies new-format hashes and legacy 'salt$hash' (100k iterations) hashes."""
    try:
        parts = hashed_password.split('$')
        if len(parts) == 4 and parts[0] == "pbkdf2_sha256":
            iterations, salt, expected = int(parts[1]), bytes.fromhex(parts[2]), bytes.fromhex(parts[3])
        elif len(parts) == 2:
            iterations, salt, expected = LEGACY_ITERATIONS, bytes.fromhex(parts[0]), bytes.fromhex(parts[1])
        else:
            return False
        actual = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, iterations)
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def password_needs_rehash(hashed_password: str) -> bool:
    return not hashed_password.startswith(f"pbkdf2_sha256${PBKDF2_ITERATIONS}$")


# ---- Login throttling (in-memory, per process; use Redis for multi-worker deployments) ----
_failed_logins: Dict[str, list] = {}


def _throttle_key(*parts: str) -> str:
    return "|".join(p.strip().lower() for p in parts)


def check_login_allowed(*parts: str, limit: Optional[int] = None) -> None:
    key = _throttle_key(*parts)
    window = datetime.timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
    now = datetime.datetime.now(datetime.timezone.utc)
    attempts = [t for t in _failed_logins.get(key, []) if now - t < window]
    _failed_logins[key] = attempts
    if len(attempts) >= (limit or settings.LOGIN_MAX_ATTEMPTS):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Try again in {settings.LOGIN_LOCKOUT_MINUTES} minutes."
        )


def record_login_failure(*parts: str) -> None:
    _failed_logins.setdefault(_throttle_key(*parts), []).append(datetime.datetime.now(datetime.timezone.utc))


def clear_login_failures(*parts: str) -> None:
    _failed_logins.pop(_throttle_key(*parts), None)


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": int(expire.timestamp())})

    header = {"alg": "HS256", "typ": "JWT"}
    header_json = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_json = json.dumps(to_encode, separators=(',', ':')).encode('utf-8')

    header_b64 = b64url_encode(header_json)
    payload_b64 = b64url_encode(payload_json)

    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(settings.SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    signature_b64 = b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"

def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        parts = token.split('.')
        if len(parts) != 3:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token structure")

        header_b64, payload_b64, signature_b64 = parts
        if json.loads(b64url_decode(header_b64)).get("alg") != "HS256":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unsupported token algorithm")
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(settings.SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
        actual_sig = b64url_decode(signature_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token signature")

        payload_bytes = b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))

        exp = payload.get("exp")
        if exp and datetime.datetime.now(datetime.timezone.utc).timestamp() > exp:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")

        return payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or malformed token")

CSRF_HEADER = "X-Requested-With"
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.COOKIE_SAMESITE.lower(),
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        path="/",
        secure=settings.cookie_secure,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE.lower(),
    )


# Dependency for current authenticated user.
# Accepts an Authorization: Bearer token (API clients) or the httpOnly session cookie (web app).
def get_current_user_payload(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Dict[str, Any]:
    if credentials and credentials.credentials:
        return decode_access_token(credentials.credentials)

    cookie_token = request.cookies.get(settings.COOKIE_NAME)
    if not cookie_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication credentials missing")

    # Cookie auth is ambient, so state-changing requests need CSRF protection: a custom header
    # cannot be sent cross-origin without a CORS preflight, which only allowed origins pass.
    if request.method not in SAFE_METHODS and request.headers.get(CSRF_HEADER) != settings.CSRF_HEADER_VALUE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing CSRF header")
    return decode_access_token(cookie_token)

def get_current_admin(
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
) -> models.AdminUser:
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin authorization required")
    
    admin_id = payload.get("user_id")
    coop_id = payload.get("cooperative_id")
    
    admin = db.query(models.AdminUser).filter(
        models.AdminUser.id == admin_id,
        models.AdminUser.cooperative_id == coop_id,
        models.AdminUser.is_active == True
    ).first()
    
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin account not found or inactive")
    return admin

def get_current_farmer(
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
) -> models.Farmer:
    if payload.get("role") != "farmer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Farmer authorization required")
    
    farmer_id = payload.get("user_id")
    coop_id = payload.get("cooperative_id")
    
    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == farmer_id,
        models.Farmer.cooperative_id == coop_id,
        models.Farmer.is_active == True
    ).first()
    
    if not farmer:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Farmer account not found or inactive")
    return farmer

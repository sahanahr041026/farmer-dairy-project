import os
import secrets
import warnings
from typing import List
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(os.path.join(_BACKEND_DIR, ".env"), ".env"),
        extra="ignore",
    )

    PROJECT_NAME: str = "DairySathi API"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"  # set to "production" to enforce strict checks

    # Database (no credentials baked in; set DATABASE_URL in .env)
    DATABASE_URL: str = "sqlite:///./dairysathi.db"

    # Security
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours

    # Comma-separated list of allowed browser origins
    CORS_ORIGINS: str = "http://localhost:5174,http://127.0.0.1:5174,http://localhost:5173"

    # Session cookie (httpOnly) used by the web app. Bearer tokens still work for API clients.
    COOKIE_NAME: str = "dairysathi_session"
    COOKIE_SECURE: bool | None = None      # default: True only when ENVIRONMENT=production
    COOKIE_SAMESITE: str = "lax"           # use "none" (requires Secure) if API and web are on different sites
    CSRF_HEADER_VALUE: str = "dairysathi-web"

    # Login throttling
    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15

    # External integrations (optional)
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    SMS_GATEWAY_API_KEY: str = ""
    SMS_SENDER_ID: str = "DAIRYSTH"

    # Optional regex of extra allowed origins. In development it defaults to localhost plus
    # private-network addresses (10.x, 192.168.x, 172.16-31.x) so the app works when opened via a
    # LAN IP; in production there is no default, so only CORS_ORIGINS is allowed.
    CORS_ORIGIN_REGEX: str | None = None

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def cors_origin_regex(self) -> str | None:
        if self.CORS_ORIGIN_REGEX:
            return self.CORS_ORIGIN_REGEX
        if self.ENVIRONMENT.lower() == "production":
            return None
        return (
            r"^https?://(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}"
            r"|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$"
        )

    @property
    def cookie_secure(self) -> bool:
        if self.COOKIE_SECURE is not None:
            return self.COOKIE_SECURE
        return self.ENVIRONMENT.lower() == "production"

    @model_validator(mode="after")
    def _check_secret(self):
        weak = (not self.SECRET_KEY) or self.SECRET_KEY.startswith("change-this") or len(self.SECRET_KEY) < 32
        if weak:
            if self.ENVIRONMENT.lower() == "production":
                raise ValueError("SECRET_KEY must be set to a random string of 32+ characters in production.")
            warnings.warn(
                "SECRET_KEY is missing/weak; using a random per-process key. "
                "Tokens will be invalidated on restart. Set SECRET_KEY in backend/.env."
            )
            self.SECRET_KEY = secrets.token_urlsafe(48)
        return self


settings = Settings()

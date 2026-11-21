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

    # Login throttling
    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15

    # External integrations (optional)
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    SMS_GATEWAY_API_KEY: str = ""
    SMS_SENDER_ID: str = "DAIRYSTH"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

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

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DairySathi API"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+psycopg://postgres:1234@localhost:5432/dairysathi_db"
    )
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dairysathi-super-secure-jwt-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # External integrations (optional)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    SMS_GATEWAY_API_KEY: str = os.getenv("SMS_GATEWAY_API_KEY", "")
    SMS_SENDER_ID: str = os.getenv("SMS_SENDER_ID", "DAIRYSTH")
    
    class Config:
        env_file = (
            os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
            ".env"
        )
        extra = "allow"

settings = Settings()

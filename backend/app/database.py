import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Engine configuration
connect_args = {}
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    if db_url.startswith("sqlite:///."):
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        rel_path = db_url.split("sqlite:///", 1)[1]
        abs_path = os.path.normpath(os.path.join(backend_dir, rel_path))
        # Ensure forward slashes for SQLite URI
        db_url = f"sqlite:///{abs_path.replace(os.sep, '/')}"

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

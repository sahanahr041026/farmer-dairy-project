import os
import glob
from sqlalchemy import text
from app.database import engine, Base
from app import models

def run_migrations():
    """
    Applies versioned SQL migrations and creates SQLAlchemy entity tables.
    """
    print("Running database migrations on PostgreSQL...")

    # First, ensure SQLAlchemy models are synced
    Base.metadata.create_all(bind=engine)
    print("SQLAlchemy Base models verified/created.")

    # Read and apply raw SQL migrations
    migrations_dir = os.path.join(os.path.dirname(__file__), "..", "migrations")
    if os.path.exists(migrations_dir):
        sql_files = sorted(glob.glob(os.path.join(migrations_dir, "*.sql")))
        with engine.begin() as conn:
            for sql_file in sql_files:
                filename = os.path.basename(sql_file)
                print(f"Applying migration: {filename}...")
                with open(sql_file, "r", encoding="utf-8") as f:
                    statements = f.read()
                    # Execute script
                    for stmt in statements.split(";"):
                        clean_stmt = stmt.strip()
                        if clean_stmt:
                            conn.execute(text(clean_stmt))
                print(f"Migration {filename} successfully applied.")

    print("All migrations completed successfully!")

if __name__ == "__main__":
    run_migrations()

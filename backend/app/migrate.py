import os
import glob
from sqlalchemy import text, inspect
from app.database import engine, Base
from app import models

def sync_sqlite_columns():
    """
    For SQLite engines, checks existing tables and dynamically adds any missing
    columns introduced in new model definitions.
    """
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    # Mapping of tables to new columns: (column_name, sql_type, default_val)
    new_columns = {
        "milk_rate_rules": [
            ("rule_name", "VARCHAR(100)", "'Standard Quality Matrix (Demo)'"),
            ("version", "VARCHAR(20)", "'1.0'"),
            ("calculation_method", "VARCHAR(50)", "'fat_snf_formula'"),
            ("flat_rate", "FLOAT", "40.0"),
            ("min_rate", "FLOAT", "20.0"),
            ("max_rate", "FLOAT", "80.0"),
            ("max_fat", "FLOAT", "12.0"),
            ("max_snf", "FLOAT", "12.0"),
            ("effective_to", "DATE", "NULL"),
            ("created_by_admin_id", "INTEGER", "NULL"),
            ("updated_at", "DATETIME", "NULL"),
        ],
        "milk_collections": [
            ("rate_rule_id", "INTEGER", "NULL"),
            ("calculation_method", "VARCHAR(50)", "'fat_snf_formula'"),
            ("record_status", "VARCHAR(30)", "'recorded'"),
            ("correction_reason", "TEXT", "NULL"),
        ],
        "milk_record_audits": [
            ("previous_rate", "FLOAT", "NULL"),
            ("new_rate", "FLOAT", "NULL"),
        ]
    }

    with engine.begin() as conn:
        for table, cols in new_columns.items():
            if table in existing_tables:
                existing_col_names = [c["name"] for c in inspector.get_columns(table)]
                for col_name, col_type, default_val in cols:
                    if col_name not in existing_col_names:
                        print(f"Adding column {col_name} ({col_type}) to SQLite table {table}...")
                        stmt = f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type} DEFAULT {default_val}"
                        conn.execute(text(stmt))

def run_migrations():
    """
    Applies versioned migrations and creates/verifies SQLAlchemy entity tables.
    """
    dialect = engine.dialect.name
    print(f"Running database migrations on {dialect.upper()}...")

    # First, ensure SQLAlchemy models are synced
    Base.metadata.create_all(bind=engine)
    print("SQLAlchemy Base models verified/created.")

    if dialect == "sqlite":
        sync_sqlite_columns()
        print("SQLite column sync completed successfully.")
        return

    # Read and apply raw SQL migrations on PostgreSQL
    migrations_dir = os.path.join(os.path.dirname(__file__), "..", "migrations")
    if os.path.exists(migrations_dir):
        sql_files = sorted(glob.glob(os.path.join(migrations_dir, "*.sql")))
        with engine.begin() as conn:
            for sql_file in sql_files:
                filename = os.path.basename(sql_file)
                print(f"Applying migration: {filename}...")
                with open(sql_file, "r", encoding="utf-8") as f:
                    statements = f.read()
                    for stmt in statements.split(";"):
                        clean_stmt = stmt.strip()
                        if clean_stmt:
                            conn.execute(text(clean_stmt))
                print(f"Migration {filename} successfully applied.")

    print("All migrations completed successfully!")

if __name__ == "__main__":
    run_migrations()

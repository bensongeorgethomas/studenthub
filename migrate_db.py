import os
import sys

# Ensure models are loaded
import models
from database import engine

def column_exists(conn, table_name: str, column_name: str) -> bool:
    from sqlalchemy import text

    if engine.dialect.name == "sqlite":
        result = conn.execute(text(f"PRAGMA table_info({table_name});")).fetchall()
        return any(row[1] == column_name for row in result)

    check_sql = text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name=:table_name AND column_name=:column_name;
    """)
    return conn.execute(check_sql, {"table_name": table_name, "column_name": column_name}).fetchone() is not None


def ensure_column(conn, table_name: str, column_name: str, column_type: str, default_value: str):
    from sqlalchemy import text

    if column_exists(conn, table_name, column_name):
        print(f"Column {column_name} already exists in {table_name}. No migration needed.")
        return

    print(f"Adding {column_name} column to {table_name} table...")
    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type} DEFAULT {default_value};"))
    conn.commit()
    print(f"Migration successful: added {column_name} column.")


def migrate():
    print("Starting migration...")
    try:
        with engine.connect() as conn:
            ensure_column(conn, "users", "is_admin", "BOOLEAN", "FALSE")
            ensure_column(conn, "users", "is_teacher", "BOOLEAN", "FALSE")
            ensure_column(conn, "users", "mobile", "VARCHAR", "NULL")
            ensure_column(conn, "users", "parents_details", "VARCHAR", "NULL")
            ensure_column(conn, "documents", "uploaded_at", "VARCHAR", "'Unknown'")
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()

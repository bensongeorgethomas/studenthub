"""
Script to create all tables in Supabase and (re)create default users.
Run: python setup_supabase.py
"""
import sys
import os
from dotenv import load_dotenv

load_dotenv()

print("=== Step 1: Connecting to Supabase ===")
db_url = os.getenv('SQLALCHEMY_DATABASE_URL', 'NOT SET')
print(f"URL: {db_url[:60]}...")

try:
    from database import engine, Base, SessionLocal
    import models
    print("OK: database.py loaded")
except Exception as e:
    print(f"FAIL: Could not import database: {e}")
    sys.exit(1)

print("\n=== Step 2: Creating all tables ===")
try:
    Base.metadata.create_all(bind=engine)
    print("OK: All tables created (or already exist)")
except Exception as e:
    print(f"FAIL: Table creation error: {e}")
    sys.exit(1)

print("\n=== Step 3: Running column migrations ===")
try:
    import migrate_db
    migrate_db.migrate()
    print("OK: Migrations done")
except Exception as e:
    print(f"FAIL: Migration error: {e}")

print("\n=== Step 4: Creating default users ===")
try:
    from security import get_password_hash
    db = SessionLocal()

    users_to_create = [
        {
            "email": "admin@studyhub.com",
            "password": "admin123",
            "is_admin": True,
            "is_teacher": False,
            "is_approved": True,
            "department": "Admin",
        },
        {
            "email": "teacher@studyhub.com",
            "password": "teacher123",
            "is_admin": False,
            "is_teacher": True,
            "is_approved": True,
            "department": "Computer Science",
        },
    ]

    for u in users_to_create:
        existing = db.query(models.User).filter(models.User.email == u["email"]).first()
        if existing:
            print(f"  SKIP: User {u['email']} already exists")
        else:
            new_user = models.User(
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                is_admin=u["is_admin"],
                is_teacher=u["is_teacher"],
                is_approved=u["is_approved"],
                department=u["department"],
            )
            db.add(new_user)
            db.commit()
            print(f"  CREATED: {u['email']} (password: {u['password']})")

    db.close()
except Exception as e:
    print(f"FAIL: User creation error: {e}")

print("\n=== Done! ===")

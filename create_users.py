import sys
import os

# Ensure the current directory is in the path so we can import models and database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal
import models
import security

def seed_users():
    db = SessionLocal()
    try:
        users_to_create = [
            {"email": "admin@studyhub.ai", "password": "admin", "is_admin": True},
            {"email": "teacher@studyhub.ai", "password": "teacher", "is_admin": False, "is_teacher": True},
            {"email": "alice@studyhub.ai", "password": "password", "is_admin": False},
            {"email": "bob@studyhub.ai", "password": "password", "is_admin": False},
            {"email": "charlie@studyhub.ai", "password": "password", "is_admin": False},
            # New students with details
            {"email": "johndoe@studyhub.ai", "password": "password123", "is_admin": False, "is_teacher": False, "mobile": "1234567890", "parents_details": "Father: Mike Doe, Contact: 0987654321"},
            {"email": "janedoe@studyhub.ai", "password": "password123", "is_admin": False, "is_teacher": False, "mobile": "9876543210", "parents_details": "Mother: Sarah Doe, Contact: 1122334455"},
            {"email": "michaelb@studyhub.ai", "password": "password456", "is_admin": False, "is_teacher": False, "mobile": "1029384756", "parents_details": "Father: Robert B, Contact: 5647382910"},
            {"email": "sarahj@studyhub.ai", "password": "password456", "is_admin": False, "is_teacher": False, "mobile": "5647382910", "parents_details": "Mother: Jessica J, Contact: 1029384756"},
            {"email": "davidw@studyhub.ai", "password": "password789", "is_admin": False, "is_teacher": False, "mobile": "9988776655", "parents_details": "Father: William W, Contact: 5566778899"},
            # New teacher with details
            {"email": "mrsmith@studyhub.ai", "password": "teacherpass", "is_admin": False, "is_teacher": True, "mobile": "5555555555", "parents_details": None}
        ]

        for u in users_to_create:
            # Check if user already exists
            existing_user = db.query(models.User).filter(models.User.email == u["email"]).first()
            if not existing_user:
                hashed_password = security.get_password_hash(u["password"])
                db_user = models.User(
                    email=u["email"], 
                    hashed_password=hashed_password, 
                    is_admin=u["is_admin"],
                    is_teacher=u.get("is_teacher", False),
                    mobile=u.get("mobile"),
                    parents_details=u.get("parents_details")
                )
                db.add(db_user)
                print(f"Created user: {u['email']} (Admin: {u['is_admin']})")
            else:
                print(f"User already exists: {u['email']}")

        db.commit()
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()

from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text('SELECT id, email, is_admin, is_teacher FROM users LIMIT 10'))
    rows = [dict(row._mapping) for row in result]
    if rows:
        for row in rows:
            print(row)
    else:
        print("NO USERS FOUND IN DATABASE!")

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL found!")
    exit(1)

db_url = db_url.replace("postgres://", "postgresql://")

tables = [
    "user_achievements",
    "user_streaks"
]

sql_commands = []
for table in tables:
    sql_commands.append(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")

try:
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()
    for cmd in sql_commands:
        print(f"Executing: {cmd}")
        cursor.execute(cmd)
    
    cursor.close()
    conn.close()
    print("Success! RLS enabled on remaining tables.")
except Exception as e:
    print(f"Error: {e}")

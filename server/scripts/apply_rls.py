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
    "users",
    "game_sessions",
    "performance_metrics",
    "cognitive_profiles",
    "iso_evaluations",
    "cognitive_assessments",
    "archetype_history",
    "training_goals",
    "user_profiles",
    "user_inventory",
    "daily_tasks"
]

sql_commands = []
for table in tables:
    sql_commands.append(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")

sql_commands.append("DROP POLICY IF EXISTS \"Allow public read-only access to user_profiles\" ON user_profiles;")
sql_commands.append("CREATE POLICY \"Allow public read-only access to user_profiles\" ON user_profiles FOR SELECT USING (true);")

try:
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()
    for cmd in sql_commands:
        print(f"Executing: {cmd}")
        cursor.execute(cmd)
    
    cursor.close()
    conn.close()
    print("Success! RLS enabled on all tables and Leaderboard read-policy applied.")
except Exception as e:
    print(f"Error: {e}")

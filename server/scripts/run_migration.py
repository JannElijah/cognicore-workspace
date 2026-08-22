import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    print("No DATABASE_URL found in .env")
    exit(1)

MIGRATION_FILE = os.path.join(os.path.dirname(__file__), "supabase_migration.sql")

def run_migration():
    print(f"Connecting to {DB_URL.split('@')[1]}...")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    with open(MIGRATION_FILE, "r") as f:
        sql = f.read()
        
    print("Executing migration...")
    cursor.execute(sql)
    print("Migration successful!")
    
    conn.close()

if __name__ == "__main__":
    run_migration()

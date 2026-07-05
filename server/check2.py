from dotenv import load_dotenv
load_dotenv()
from database import get_db_connection

conn = get_db_connection()
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='daily_tasks'")
print([r['column_name'] for r in cur.fetchall()])
conn.close()

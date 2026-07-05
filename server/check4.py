from dotenv import load_dotenv
load_dotenv()
from database import get_db_connection

conn = get_db_connection()
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='daily_tasks'")
print("daily_tasks:", cur.fetchall())
conn.close()

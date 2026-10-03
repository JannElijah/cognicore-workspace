from database import get_db_connection
conn = get_db_connection()
cursor = conn.cursor()
try:
    cursor.execute("SELECT COUNT(*) FROM user_streaks WHERE last_login_date >= CURRENT_DATE - INTERVAL '7 days'")
    print(cursor.fetchone()[0])
except Exception as e:
    print('Error:', e)

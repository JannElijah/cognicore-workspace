import os
import re

filepath = r'd:\cognicore-workspace\server\database.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'pool = psycopg2.pool.ThreadedConnectionPool(1, 20, db_url)',
    '''min_c = int(os.environ.get("DB_MIN_CONN", 1))
        max_c = int(os.environ.get("DB_MAX_CONN", 20))
        pool = psycopg2.pool.ThreadedConnectionPool(min_c, max_c, db_url)'''
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)


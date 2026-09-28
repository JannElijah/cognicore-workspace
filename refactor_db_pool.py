import os
import re

files = [
    r'd:\cognicore-workspace\server\routes\analytics.py',
    r'd:\cognicore-workspace\server\routes\ml.py',
    r'd:\cognicore-workspace\server\routes\research.py'
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove local get_db_connection definition
    pattern = r'def get_db_connection\(\):\s+import psycopg2\s+from psycopg2\.extras import RealDictCursor\s+import os\s+DATABASE_URL = os\.environ\.get\("DATABASE_URL"\)\s+return psycopg2\.connect\(DATABASE_URL, cursor_factory=RealDictCursor\)'
    
    content = re.sub(pattern, '', content)
    
    # Ensure get_db_connection is imported from database
    if 'get_db_connection' not in content[:500]: # check imports
        if 'from database import db' in content:
            content = content.replace('from database import db', 'from database import db, get_db_connection')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)


import os
import glob

directory = r'd:\cognicore-workspace\client\components'
files = glob.glob(os.path.join(directory, '*.jsx'))

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'Connecting to SQLite secure database...' in content:
        content = content.replace(
            'Connecting to SQLite secure database...',
            'Connecting to Supabase PostgreSQL database...'
        )
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            

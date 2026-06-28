import sqlite3
conn = sqlite3.connect('server/cognicore.db')
print('=== DB SCHEMA ===')
for row in conn.execute("SELECT sql FROM sqlite_master WHERE type='table'").fetchall():
    if row[0]: print(row[0])

import ast
print('\n=== APP.PY FUNCTIONS ===')
with open('server/app.py', 'r', encoding='utf-8') as f:
    source = f.read()
tree = ast.parse(source)
targets = ['start_session', 'submit_metrics', 'adjust_difficulty', 'evaluate_thesis']
for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef) and node.name in targets:
        print(f'\n--- {node.name} ---')
        print(ast.get_source_segment(source, node))

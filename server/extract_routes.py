import ast
import inspect

def extract_functions(source_file, target_file, function_names, bp_name, imports):
    with open(source_file, 'r') as f:
        source = f.read()

    tree = ast.parse(source)
    functions_code = []

    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name in function_names:
            # We want the exact source lines
            lines = source.splitlines()
            func_lines = lines[node.lineno - 1 : node.end_lineno]
            
            # Now we need to prepend any decorators if they are not included? 
            # ast.FunctionDef's lineno includes the first decorator in Python 3.8+!
            code = "\n".join(func_lines)
            
            # Replace @app.route with @{bp_name}.route
            code = code.replace('@app.route', f'@{bp_name}.route')
            
            functions_code.append(code)
            
    with open(target_file, 'w') as f:
        f.write(imports + "\n\n")
        f.write(f"{bp_name} = Blueprint('{bp_name}', __name__)\n\n")
        f.write("\n\n".join(functions_code))

analytics_funcs = [
    "get_user_analytics",
    "get_cohort_analytics",
    "get_user_session_history",
    "get_session_metrics",
    "get_cohort_comparison",
    "get_archetype_progression",
    "get_training_goals",
    "add_training_goal",
    "delete_training_goal"
]

analytics_imports = """
from flask import Blueprint, jsonify, request
from auth import token_required
from database import db
import logging
from sqlalchemy import text
from game_utils import safe_float, safe_int

logger = logging.getLogger(__name__)

def get_db_connection():
    import psycopg2
    from psycopg2.extras import RealDictCursor
    import os
    DATABASE_URL = os.environ.get("DATABASE_URL")
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
"""

extract_functions("app.py", "routes/analytics.py", analytics_funcs, "analytics_bp", analytics_imports.strip())

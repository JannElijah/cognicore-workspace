import ast
import inspect

def extract_functions(source_file, target_file, function_names, bp_name, imports):
    with open(source_file, 'r') as f:
        source = f.read()

    tree = ast.parse(source)
    functions_code = []

    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name in function_names:
            lines = source.splitlines()
            func_lines = lines[node.lineno - 1 : node.end_lineno]
            code = "\n".join(func_lines)
            code = code.replace('@app.route', f'@{bp_name}.route')
            functions_code.append(code)
            
    with open(target_file, 'w') as f:
        f.write(imports + "\n\n")
        f.write(f"{bp_name} = Blueprint('{bp_name}', __name__)\n\n")
        f.write("\n\n".join(functions_code))

research_funcs = [
    "run_evaluation",
    "get_iso_evaluations",
    "get_iso_summary",
    "get_cohort_db_scores",
    "export_csv",
    "get_research_correlations",
    "get_learning_curves"
]

research_imports = """
from flask import Blueprint, jsonify, request, make_response
from auth import token_required
from database import db
import logging
from sqlalchemy import text
from game_utils import safe_float, safe_int
import datetime
import io

logger = logging.getLogger(__name__)

def get_db_connection():
    import psycopg2
    from psycopg2.extras import RealDictCursor
    import os
    DATABASE_URL = os.environ.get("DATABASE_URL")
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
"""

ml_funcs = [
    "model_status",
    "retrain_model",
    "get_model_clusters",
    "admin_retrain"
]

ml_imports = """
from flask import Blueprint, jsonify, request
from auth import token_required
from database import db
import logging
import threading
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

extract_functions("app.py", "routes/research.py", research_funcs, "research_bp", research_imports.strip())
extract_functions("app.py", "routes/ml.py", ml_funcs, "ml_bp", ml_imports.strip())

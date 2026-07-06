code = """
def safe_float(val, default=None):
    try:
        return float(val) if val is not None else default
    except (ValueError, TypeError):
        return default

def safe_int(val, default=None):
    try:
        return int(val) if val is not None else default
    except (ValueError, TypeError):
        return default
"""
with open('game_utils.py', 'a') as f:
    f.write(code)

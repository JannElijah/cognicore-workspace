import re

state_code = """
# Global model training state tracking
model_training_state = {
    "status": "idle", # "idle", "training", "error"
    "error_message": None,
    "last_trained_at": None,
    "last_retrain_metrics": None
}
"""

with open('routes/ml.py', 'r') as f:
    content = f.read()

# Insert the state code right after the logger definition
content = content.replace("logger = logging.getLogger(__name__)", "logger = logging.getLogger(__name__)\n" + state_code)

with open('routes/ml.py', 'w') as f:
    f.write(content)

# We also need to fix import in research.py for calculate_pearson_r
with open('routes/research.py', 'r') as f:
    r_content = f.read()
r_content = r_content.replace("from game_utils import safe_float, safe_int", "from game_utils import safe_float, safe_int, calculate_pearson_r")
with open('routes/research.py', 'w') as f:
    f.write(r_content)

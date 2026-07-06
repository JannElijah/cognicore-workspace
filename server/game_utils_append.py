
append_content = """
from ml.models import CognitiveArchetypeClassifier

# Initialize ML Model
archetype_classifier = CognitiveArchetypeClassifier()
try:
    archetype_classifier.load_models()
except Exception as e:
    print(f"Warning: ML models could not be loaded: {e}")

ml_history_cache = {}
"""

with open('game_utils.py', 'a') as f:
    f.write(append_content)

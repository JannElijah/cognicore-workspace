import os
import re

# Update model.py
filepath_m = r'd:\cognicore-workspace\server\model.py'
with open(filepath_m, 'r', encoding='utf-8') as f:
    content_m = f.read()

import_threading = '''import numpy as np
import os
import pickle
import threading'''
content_m = content_m.replace('import numpy as np\nimport os\nimport pickle', import_threading)

init_lock = '''    def __init__(self):
        self.model = None
        self.fatigue_model = None
        self.clustering_model = None
        self.scaler = None
        self.is_loaded_from_disk = False
        self.lock = threading.Lock()'''
content_m = content_m.replace('''    def __init__(self):
        self.model = None
        self.fatigue_model = None
        self.clustering_model = None
        self.scaler = None
        self.is_loaded_from_disk = False''', init_lock)

reload_method = '''    def reload_models(self):
        \"\"\"Thread-safe shadow loading of models.\"\"\"
        if not SKLEARN_AVAILABLE:
            return False
        try:
            dir_path = os.path.dirname(__file__) if '__file__' in globals() else ''
            model_path = os.path.join(dir_path, 'cognitive_model.pkl')
            cluster_path = os.path.join(dir_path, 'clustering_model.pkl')
            scaler_path = os.path.join(dir_path, 'scaler.pkl')
            
            with open(model_path, 'rb') as f:
                new_model = pickle.load(f)
            with open(cluster_path, 'rb') as f:
                new_clustering = pickle.load(f)
            with open(scaler_path, 'rb') as f:
                new_scaler = pickle.load(f)
                
            with self.lock:
                self.model = new_model
                self.clustering_model = new_clustering
                self.scaler = new_scaler
                self.is_loaded_from_disk = True
            print("[ML Model Service] Models shadow-reloaded successfully.")
            return True
        except Exception as e:
            print(f"[ML Model Service] Failed to reload models: {e}")
            return False

    def predict(self,'''
content_m = content_m.replace('    def predict(self,', reload_method)

# Add lock to predict
content_m = content_m.replace(
    '''        if SKLEARN_AVAILABLE and self.model is not None:
            try:
                features = [[avg_accuracy, avg_rt_ms, acc_slope, rt_slope, avg_hesitation, avg_spam, avg_path_eff]]''',
    '''        if SKLEARN_AVAILABLE and self.model is not None:
            try:
                with self.lock:
                    features = [[avg_accuracy, avg_rt_ms, acc_slope, rt_slope, avg_hesitation, avg_spam, avg_path_eff]]
                    prediction = self.model.predict(features)[0]
                    probabilities = self.model.predict_proba(features)[0]'''
)
content_m = content_m.replace(
    '''                prediction = self.model.predict(features)[0]
                probabilities = self.model.predict_proba(features)[0]''',
    ''
)

with open(filepath_m, 'w', encoding='utf-8') as f:
    f.write(content_m)

# Update ml.py
filepath_ml = r'd:\cognicore-workspace\server\routes\ml.py'
with open(filepath_ml, 'r', encoding='utf-8') as f:
    content_ml = f.read()

content_ml = content_ml.replace('archetype_classifier.__init__()', 'archetype_classifier.reload_models()')

with open(filepath_ml, 'w', encoding='utf-8') as f:
    f.write(content_ml)

import requests as _requests

class RequestsWrapper:
    def __init__(self):
        self.token = None
    
    def post(self, url, *args, **kwargs):
        if '/api/start-session' in url:
            # intercept and login
            username = kwargs.get('json', {}).get('username', 'test_user')
            _login_res = _requests.post("http://127.0.0.1:5000/api/login", json={"username": username})
            if _login_res.status_code == 200:
                self.token = _login_res.json().get('token')
                
        if '/api/login' not in url and self.token:
            kwargs.setdefault('headers', {})['Authorization'] = f'Bearer {self.token}'
        return _requests.post(url, *args, **kwargs)
        
    def get(self, url, *args, **kwargs):
        if self.token:
            kwargs.setdefault('headers', {})['Authorization'] = f'Bearer {self.token}'
        return _requests.get(url, *args, **kwargs)

requests = RequestsWrapper()

import json
import sys
import uuid

API_URL = "http://127.0.0.1:5000"

def run_logic_link_tests():
    print("=== Step 1: Starting Logic Link Session Handshake ===")
    
    unique_user = f"logic_test_user_{uuid.uuid4().hex[:8]}"
    payload_start = {
        "username": unique_user,
        "game_type": "LogicLink"
    }
    

    # Auto-login to get JWT token
    try:
        _login_res = requests.post(f"{API_URL}/api/login", json={"username": payload_start.get('username', 'test_user')})
        if _login_res.status_code == 200:
            requests.token = _login_res.json().get('token')
    except Exception:
        pass
        
    try:
        start_res = requests.post(f"{API_URL}/api/start-session", json=payload_start)
    except Exception as e:
        print(f"Could not connect to Flask server at {API_URL}: {e}")
        sys.exit(1)
        
    if start_res.status_code != 201:
        print(f"FAILED: /api/start-session returned status {start_res.status_code}")
        print(start_res.text)
        sys.exit(1)
        
    start_data = start_res.json()
    print("Session started successfully.")
    print(json.dumps(start_data, indent=2))
    
    session_id = start_data["session_id"]
    initial_params = start_data["dda_parameters"]
    
    # Assert initial parameters match Level 1 LogicLink rules
    assert initial_params["difficulty_level"] == 1
    assert initial_params["grid_size"] == 3
    assert initial_params["sequence_length"] == 3
    assert initial_params["distractors"] == 0
    print("Initial parameters assertion PASSED.")

    print("\n=== Step 2: Submitting 3 High-Performance Metrics (100% Accuracy) ===")
    for i in range(3):
        payload_metric = {
            "session_id": session_id,
            "reaction_time": 1000.0,  # 1.0 second solve time
            "accuracy": 1.0,          # correct path completed
            "difficulty": 1
        }
        metric_res = requests.post(f"{API_URL}/api/submit-metrics", json=payload_metric)
        assert metric_res.status_code == 201
        print(f"  Metric {i+1} submitted successfully.")

    print("\n=== Step 3: Triggering DDA Adaptation (Expect Upgrade to Level 2) ===")
    dda_res = requests.post(f"{API_URL}/api/dda", json={"session_id": session_id})
    if dda_res.status_code != 200:
        print(f"FAILED: /api/dda returned status {dda_res.status_code}")
        print(dda_res.text)
        sys.exit(1)
        
    dda_data = dda_res.json()
    print("DDA Response:")
    print(json.dumps(dda_data, indent=2))
    
    adapted_params = dda_data["dda_parameters"]
    # Expect difficulty level 2
    assert adapted_params["difficulty_level"] == 2
    assert adapted_params["grid_size"] == 3
    assert adapted_params["sequence_length"] == 4
    assert adapted_params["distractors"] == 1
    print("Upward difficulty adaptation assertion PASSED.")

    print("\n=== Step 4: Submitting 3 Low-Performance Metrics (0% Accuracy) ===")
    for i in range(3):
        payload_metric = {
            "session_id": session_id,
            "reaction_time": 4000.0,  # 4 seconds solve time
            "accuracy": 0.0,          # link broken error
            "difficulty": 2
        }
        metric_res = requests.post(f"{API_URL}/api/submit-metrics", json=payload_metric)
        assert metric_res.status_code == 201
        print(f"  Metric {i+1} submitted successfully.")

    print("\n=== Step 5: Triggering DDA Adaptation (Expect Downgrade to Level 1) ===")
    dda_res2 = requests.post(f"{API_URL}/api/dda", json={"session_id": session_id})
    if dda_res2.status_code != 200:
        print(f"FAILED: /api/dda returned status {dda_res2.status_code}")
        print(dda_res2.text)
        sys.exit(1)
        
    dda_data2 = dda_res2.json()
    print("DDA Response:")
    print(json.dumps(dda_data2, indent=2))
    
    adapted_params2 = dda_data2["dda_parameters"]
    # Expect difficulty level 1
    assert adapted_params2["difficulty_level"] == 1
    assert adapted_params2["grid_size"] == 3
    assert adapted_params2["sequence_length"] == 3
    assert adapted_params2["distractors"] == 0
    print("Downward difficulty adaptation assertion PASSED.")
    
    print("\n=== SUCCESS: All automated Logic Link backend tests passed! ===")

if __name__ == "__main__":
    run_logic_link_tests()

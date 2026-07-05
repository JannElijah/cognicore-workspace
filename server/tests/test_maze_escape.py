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

def run_maze_escape_tests():
    print("=== Step 1: Starting Maze Escape Session Handshake ===")
    
    unique_user = f"maze_test_user_{uuid.uuid4().hex[:8]}"
    payload_start = {
        "username": unique_user,
        "game_type": "MazeEscape"
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
    
    # Assert initial parameters match Level 1 MazeEscape rules
    assert initial_params["difficulty_level"] == 1
    assert initial_params["grid_size"] == 6
    assert initial_params["max_moves"] == 20
    assert abs(initial_params["blocked_ratio"] - 0.1) < 0.001
    print("Initial parameters assertion PASSED.")

    print("\n=== Step 2: Submitting 3 High-Performance Metrics (100% Accuracy) ===")
    for i in range(3):
        payload_metric = {
            "session_id": session_id,
            "reaction_time": 1500.0,  # 1.5 seconds solve time
            "accuracy": 1.0,          # escaped successfully
            "difficulty": 1
        }
        if i == 0:
            payload_metric["path_efficiency"] = 0.85
            
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
    assert adapted_params["grid_size"] == 7
    assert adapted_params["max_moves"] == 25
    assert abs(adapted_params["blocked_ratio"] - 0.15) < 0.001
    print("Upward difficulty adaptation assertion PASSED.")

    print("\n=== Step 4: Submitting 3 Low-Performance Metrics (0% Accuracy) ===")
    for i in range(3):
        payload_metric = {
            "session_id": session_id,
            "reaction_time": 5000.0,  # 5 seconds solve time
            "accuracy": 0.0,          # energy drained failure
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
    assert adapted_params2["grid_size"] == 6
    assert adapted_params2["max_moves"] == 20
    assert abs(adapted_params2["blocked_ratio"] - 0.1) < 0.001
    print("Downward difficulty adaptation assertion PASSED.")
    
    print("\n=== Step 6: Verifying path_efficiency is recorded correctly ===")
    metrics_res = requests.get(f"{API_URL}/api/session-metrics/{session_id}")
    assert metrics_res.status_code == 200
    metrics_data = metrics_res.json()["metrics"]
    
    # The first submitted metric should have path_efficiency = 0.85
    first_metric = metrics_data[0]
    assert first_metric["path_efficiency"] == 0.85
    print(f"Asserted path_efficiency is returned correctly: {first_metric['path_efficiency']}")
    
    print("\n=== SUCCESS: All automated Maze Escape backend tests passed! ===")

if __name__ == "__main__":
    run_maze_escape_tests()

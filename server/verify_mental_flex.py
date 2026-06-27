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

def run_mental_flex_tests():
    print("=== Step 1: Starting Mental Flex Session Handshake ===")
    
    unique_user = f"mental_flex_test_user_{uuid.uuid4().hex[:8]}"
    payload_start = {
        "username": unique_user,
        "game_type": "MentalFlex"
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
    
    # Assert initial parameters match Level 1 MentalFlex rules
    assert initial_params["difficulty_level"] == 1
    assert initial_params["rule_shift_frequency"] == 5
    assert initial_params["choices_count"] == 2
    assert initial_params["time_limit"] == 4000
    assert initial_params["rules_pool"] == ["color", "shape"]
    print("Initial Level 1 parameters assertion PASSED.")

    print("\n=== Step 2: Submitting 5 High-Performance Metrics (100% Accuracy) ===")
    for i in range(5):
        payload_metric = {
            "session_id": session_id,
            "cognitive_domain": "executive_strategy",
            "game_type": "mental_flex",
            "reaction_time": 800.0,
            "accuracy_rate": 1.0,
            "difficulty": 1,
            "error_count": 0,
            "hesitation_ms": 150.0,
            "spam_click_count": 0
        }
        if i == 0:
            payload_metric["rule_shift_latency_ms"] = 950.0
            
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
    assert adapted_params["rule_shift_frequency"] == 4
    assert adapted_params["choices_count"] == 3
    assert adapted_params["time_limit"] == 3200
    assert adapted_params["rules_pool"] == ["color", "shape"]
    print("Upward difficulty adaptation assertion PASSED.")

    print("\n=== Step 4: Submitting 5 Low-Performance Metrics (0% Accuracy) ===")
    for i in range(5):
        payload_metric = {
            "session_id": session_id,
            "cognitive_domain": "executive_strategy",
            "game_type": "mental_flex",
            "reaction_time": 4000.0,
            "accuracy_rate": 0.0,
            "difficulty": 2,
            "error_count": 1,
            "hesitation_ms": 1200.0,
            "spam_click_count": 4
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
    assert adapted_params2["rule_shift_frequency"] == 5
    assert adapted_params2["choices_count"] == 2
    assert adapted_params2["time_limit"] == 4000
    assert adapted_params2["rules_pool"] == ["color", "shape"]
    print("Downward difficulty adaptation assertion PASSED.")
    
    print("\n=== Step 6: Verifying rule_shift_latency_ms is recorded correctly ===")
    metrics_res = requests.get(f"{API_URL}/api/session-metrics/{session_id}")
    assert metrics_res.status_code == 200
    metrics_data = metrics_res.json()["metrics"]
    
    # The first submitted metric should have rule_shift_latency_ms = 950.0
    first_metric = metrics_data[0]
    assert first_metric["rule_shift_latency_ms"] == 950.0
    print(f"Asserted rule_shift_latency_ms is returned correctly: {first_metric['rule_shift_latency_ms']}")
    
    print("\n=== SUCCESS: All automated Mental Flex backend tests passed! ===")

if __name__ == "__main__":
    run_mental_flex_tests()

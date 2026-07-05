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

def test_mental_flex_inheritance():
    print("=== Step 1: Starting MazeEscape Session (Domain: executive_strategy) ===")
    unique_user = f"executive_test_user_{uuid.uuid4().hex[:8]}"
    payload_start1 = {
        "username": unique_user,
        "game_type": "MazeEscape"
    }
    
    res1 = requests.post(f"{API_URL}/api/start-session", json=payload_start1)
    if res1.status_code != 201:
        print(f"FAILED: Initial handshake returned status {res1.status_code}")
        sys.exit(1)
        
    data1 = res1.json()
    session_id1 = data1["session_id"]
    initial_params1 = data1["dda_parameters"]
    
    print(f"MazeEscape started. Session ID: {session_id1}, Initial Difficulty: {initial_params1['difficulty_level']}")
    assert initial_params1["difficulty_level"] == 1, "Expected initial difficulty level 1 for new user"
    
    print("\n=== Step 2: Submitting High-Performance Metrics in MazeEscape ===")
    for i in range(5):
        payload_metric = {
            "session_id": session_id1,
            "cognitive_domain": "executive_strategy",
            "game_type": "maze_escape",
            "reaction_time": 1000.0,
            "accuracy_rate": 1.0,
            "difficulty": 1,
            "error_count": 0,
            "hesitation_ms": 100.0,
            "spam_click_count": 0
        }
        res_m = requests.post(f"{API_URL}/api/submit-metrics", json=payload_metric)
        assert res_m.status_code == 201
        
    print("\n=== Step 3: Running DDA to Scale Up MazeEscape Difficulty ===")
    res_dda = requests.post(f"{API_URL}/api/dda", json={"session_id": session_id1})
    dda_data = res_dda.json()
    new_difficulty = dda_data["dda_parameters"]["difficulty_level"]
    print(f"New Difficulty: {new_difficulty}")
    assert new_difficulty > 1, f"Expected difficulty to scale up, got {new_difficulty}"
    
    # Submit a metric at the new difficulty level to represent playing at the new difficulty
    payload_metric = {
        "session_id": session_id1,
        "cognitive_domain": "executive_strategy",
        "game_type": "maze_escape",
        "reaction_time": 1000.0,
        "accuracy_rate": 1.0,
        "difficulty": new_difficulty,
        "error_count": 0,
        "hesitation_ms": 100.0,
        "spam_click_count": 0
    }
    res_m2 = requests.post(f"{API_URL}/api/submit-metrics", json=payload_metric)
    assert res_m2.status_code == 201
    
    print("\n=== Step 4: Starting MentalFlex Session (Same Domain: executive_strategy) ===")
    payload_start2 = {
        "username": unique_user,
        "game_type": "MentalFlex"
    }
    
    res2 = requests.post(f"{API_URL}/api/start-session", json=payload_start2)
    if res2.status_code != 201:
        print(f"FAILED: Second handshake returned status {res2.status_code}")
        sys.exit(1)
        
    data2 = res2.json()
    session_id2 = data2["session_id"]
    initial_params2 = data2["dda_parameters"]
    
    print(f"MentalFlex started. Session ID: {session_id2}, Inherited Difficulty: {initial_params2['difficulty_level']}")
    assert initial_params2["difficulty_level"] == new_difficulty, f"Expected inherited difficulty level {new_difficulty}, got {initial_params2['difficulty_level']}"
    
    print("\n=== Step 5: Submitting High-Performance Metrics in MentalFlex ===")
    for i in range(5):
        payload_metric = {
            "session_id": session_id2,
            "cognitive_domain": "executive_strategy",
            "game_type": "mental_flex",
            "reaction_time": 600.0,
            "accuracy_rate": 1.0,
            "difficulty": new_difficulty,
            "error_count": 0,
            "hesitation_ms": 50.0,
            "spam_click_count": 0
        }
        res_m3 = requests.post(f"{API_URL}/api/submit-metrics", json=payload_metric)
        assert res_m3.status_code == 201

    print("\n=== Step 6: Running DDA to Scale Up MentalFlex Difficulty ===")
    res_dda2 = requests.post(f"{API_URL}/api/dda", json={"session_id": session_id2})
    dda_data2 = res_dda2.json()
    new_difficulty2 = dda_data2["dda_parameters"]["difficulty_level"]
    print(f"New Difficulty: {new_difficulty2}")
    assert new_difficulty2 > new_difficulty, f"Expected difficulty to scale up, got {new_difficulty2}"

    # Submit a metric at the new difficulty level to represent playing at the new difficulty
    payload_metric = {
        "session_id": session_id2,
        "cognitive_domain": "executive_strategy",
        "game_type": "mental_flex",
        "reaction_time": 600.0,
        "accuracy_rate": 1.0,
        "difficulty": new_difficulty2,
        "error_count": 0,
        "hesitation_ms": 50.0,
        "spam_click_count": 0
    }
    res_m4 = requests.post(f"{API_URL}/api/submit-metrics", json=payload_metric)
    assert res_m4.status_code == 201

    print("\n=== Step 7: Starting another MazeEscape Session (Should Inherit Difficulty from MentalFlex) ===")
    payload_start3 = {
        "username": unique_user,
        "game_type": "MazeEscape"
    }
    res3 = requests.post(f"{API_URL}/api/start-session", json=payload_start3)
    if res3.status_code != 201:
        print(f"FAILED: Third handshake returned status {res3.status_code}")
        sys.exit(1)

    data3 = res3.json()
    session_id3 = data3["session_id"]
    initial_params3 = data3["dda_parameters"]

    print(f"Second MazeEscape started. Session ID: {session_id3}, Inherited Difficulty: {initial_params3['difficulty_level']}")
    assert initial_params3["difficulty_level"] == new_difficulty2, f"Expected inherited difficulty level {new_difficulty2}, got {initial_params3['difficulty_level']}"

    print("\n=== SUCCESS: Domain-based DDA inheritance between MazeEscape and MentalFlex works perfectly! ===")

if __name__ == "__main__":
    test_mental_flex_inheritance()

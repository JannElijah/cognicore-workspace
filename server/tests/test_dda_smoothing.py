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

def test_dda_smoothing():
    print("=== Start DDA Volatility Smoothing Verification Tests ===")

    # Test Case 1: MazeEscape with Alpha = 1.0 (No Damping - Expect Fast Scale Up)
    # Start MazeEscape session
    user_fast = f"smooth_fast_{uuid.uuid4().hex[:8]}"
    start_fast = requests.post(f"{API_URL}/api/start-session", json={"username": user_fast, "game_type": "MazeEscape"})
    assert start_fast.status_code == 201
    sid_fast = start_fast.json()["session_id"]
    
    # Submit 3 successful metrics
    for i in range(3):
        res = requests.post(f"{API_URL}/api/submit-metrics", json={
            "session_id": sid_fast,
            "cognitive_domain": "executive_strategy",
            "game_type": "MazeEscape",
            "reaction_time": 1000.0,
            "accuracy_rate": 1.0,
            "difficulty": i + 1
        })
        assert res.status_code == 201

    # DDA adaptation with alpha = 1.0 (Direct step upgrade)
    dda_fast = requests.post(f"{API_URL}/api/dda", json={"session_id": sid_fast, "smoothing_alpha": 1.0})
    assert dda_fast.status_code == 200
    res_fast = dda_fast.json()["dda_parameters"]
    print(f"Unsmoothed (alpha=1.0) adjusted difficulty: Level {res_fast['difficulty_level']} (Expected: 4)")
    assert res_fast["difficulty_level"] == 4, f"Expected Level 4, got {res_fast['difficulty_level']}"

    # Test Case 2: MazeEscape with Alpha = 0.4 (High Damping - Expect Slow/Damped Scale Up)
    # Start MazeEscape session
    user_slow = f"smooth_slow_{uuid.uuid4().hex[:8]}"
    start_slow = requests.post(f"{API_URL}/api/start-session", json={"username": user_slow, "game_type": "MazeEscape"})
    assert start_slow.status_code == 201
    sid_slow = start_slow.json()["session_id"]
    
    # Submit 3 successful metrics
    for i in range(3):
        res = requests.post(f"{API_URL}/api/submit-metrics", json={
            "session_id": sid_slow,
            "cognitive_domain": "executive_strategy",
            "game_type": "MazeEscape",
            "reaction_time": 1000.0,
            "accuracy_rate": 1.0,
            "difficulty": i + 1
        })
        assert res.status_code == 201

    # DDA adaptation with alpha = 0.4 (Damped transitions)
    # Math progression for alpha = 0.4:
    # Initial smooth_diff = 1.0
    # Step 1: avg = 1.0 -> raw = 2.0 -> smooth_diff = 0.4*2.0 + 0.6*1.0 = 1.4
    # Step 2: avg = 1.0 -> raw = 2.4 -> smooth_diff = 0.4*2.4 + 0.6*1.4 = 1.8
    # Step 3: avg = 1.0 -> raw = 2.8 -> smooth_diff = 0.4*2.8 + 0.6*1.8 = 2.2
    # Output: round(2.2) = 2.
    dda_slow = requests.post(f"{API_URL}/api/dda", json={"session_id": sid_slow, "smoothing_alpha": 0.4})
    assert dda_slow.status_code == 200
    res_slow = dda_slow.json()["dda_parameters"]
    print(f"Smoothed (alpha=0.4) adjusted difficulty: Level {res_slow['difficulty_level']} (Expected: 2)")
    assert res_slow["difficulty_level"] == 2, f"Expected Level 2, got {res_slow['difficulty_level']}"

    print("\n=== SUCCESS: DDA Volatility Smoothing Verification Tests PASSED! ===")

if __name__ == "__main__":
    try:
        test_dda_smoothing()
        sys.exit(0)
    except AssertionError as e:
        print(f"Assertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error occurred: {e}")
        sys.exit(1)

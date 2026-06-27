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

API_URL = "http://127.0.0.1:5000"

def test_charts_endpoints():
    print("=== Step 1: Testing GET /api/user-session-history/player_one ===")
    try:
        res = requests.get(f"{API_URL}/api/user-session-history/player_one")
    except Exception as e:
        print(f"Could not connect to Flask server at {API_URL}: {e}")
        sys.exit(1)
        
    if res.status_code != 200:
        print(f"FAILED: GET /api/user-session-history/player_one returned status {res.status_code}")
        print(res.text)
        sys.exit(1)
        
    data = res.json()
    print("Response:")
    print(json.dumps(data, indent=2))
    assert data["status"] == "success"
    assert "sessions" in data
    print("User session history API test PASSED.")

    print("\n=== Step 2: Testing GET /api/cohort-comparison/player_one ===")
    res2 = requests.get(f"{API_URL}/api/cohort-comparison/player_one")
    if res2.status_code != 200:
        print(f"FAILED: GET /api/cohort-comparison/player_one returned status {res2.status_code}")
        print(res2.text)
        sys.exit(1)
        
    data2 = res2.json()
    print("Response:")
    print(json.dumps(data2, indent=2))
    assert data2["status"] == "success"
    assert "user_averages" in data2
    assert "cohort_averages" in data2
    assert "reaction_time_ms" in data2["cohort_averages"]
    assert "accuracy_rate" in data2["cohort_averages"]
    print("Cohort comparison API test PASSED.")

    print("\n=== Step 3: Testing GET /api/session-metrics/<session_id> ===")
    # Find a valid session ID from user history or use a fallback
    session_id = None
    if len(data["sessions"]) > 0:
        session_id = data["sessions"][0]["session_id"]
    else:
        # Fallback to checking any session in database, or start a new one
        print("No sessions found for player_one. Starting a session first...")
        start_res = requests.post(f"{API_URL}/api/start-session", json={
            "username": "player_one",
            "game_type": "MentalFlex"
        })
        assert start_res.status_code == 201
        session_id = start_res.json()["session_id"]
        
    res3 = requests.get(f"{API_URL}/api/session-metrics/{session_id}")
    if res3.status_code != 200:
        print(f"FAILED: GET /api/session-metrics/{session_id} returned status {res3.status_code}")
        print(res3.text)
        sys.exit(1)
        
    data3 = res3.json()
    print("Response:")
    print(json.dumps(data3, indent=2))
    assert data3["status"] == "success"
    assert "metrics" in data3
    print("Session metrics API test PASSED.")

    print("\n=== SUCCESS: All automated charts endpoint tests passed! ===")

if __name__ == "__main__":
    test_charts_endpoints()

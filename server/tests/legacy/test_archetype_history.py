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

def test_archetype_progression_endpoint():
    print("=== Step 1: Testing GET /api/archetype-progression/clinical_subject_05 ===")
    try:
        res = requests.get(f"{API_URL}/api/archetype-progression/clinical_subject_05")
    except Exception as e:
        print(f"Could not connect to Flask server at {API_URL}: {e}")
        sys.exit(1)
        
    if res.status_code != 200:
        print(f"FAILED: GET /api/archetype-progression/clinical_subject_05 returned status {res.status_code}")
        print(res.text)
        sys.exit(1)
        
    data = res.json()
    print("Response:")
    print(json.dumps(data, indent=2))
    assert data["status"] == "success"
    assert "history" in data
    
    history = data["history"]
    # Expect 8 sessions
    assert len(history) == 8, f"Expected 8 sessions of progression history, got {len(history)}"
    
    # Assert data formats and schema values
    for item in history:
        assert "id" in item
        assert "session_id" in item
        assert "game_type" in item
        assert "archetype_name" in item
        assert "confidence_score" in item
        assert "timestamp" in item
        assert item["archetype_name"] in ["Beginner", "Standard", "Intermediate", "Advanced", "Fast Learner", "Steady Improver", "High Fatigue"]
        assert 0.0 <= item["confidence_score"] <= 1.0

    # Assert logical progression: first session must be Beginner
    assert history[0]["archetype_name"] == "Beginner", f"Expected early archetype to be Beginner, got {history[0]['archetype_name']}"
    # Last session should be Intermediate or Advanced (late phase progression)
    assert history[-1]["archetype_name"] in ["Intermediate", "Advanced"], f"Expected late archetype to be Advanced/Intermediate, got {history[-1]['archetype_name']}"
    
    print("\n=== SUCCESS: All archetype history progression endpoint tests passed! ===")

if __name__ == "__main__":
    test_archetype_progression_endpoint()

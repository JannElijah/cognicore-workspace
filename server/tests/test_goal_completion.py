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
import uuid

API_URL = "http://127.0.0.1:5000"

def test_goal_achievement_flow():
    username = f"user_{uuid.uuid4().hex[:10]}"
    print(f"=== Running Goal Achievement Flow for User: {username} ===")

    # 1. Clean existing goals for this user
    print("1. Cleaning up existing goals...")
    res = requests.get(f"{API_URL}/api/training-goals/{username}")
    assert res.status_code == 200
    for goal in res.json().get("goals", []):
        requests.delete(f"{API_URL}/api/training-goals/{goal['id']}")

    # 2. Create goal: Reflexes & Focus, Accuracy, target 85%
    print("2. Establishing training goal: Reflexes & Focus -> Accuracy Target 85.0%")
    payload_goal = {
        "username": username,
        "domain": "reflexes_and_focus",
        "metric_type": "accuracy",
        "target_value": 85.0
    }
    res_goal = requests.post(f"{API_URL}/api/training-goals", json=payload_goal)
    assert res_goal.status_code == 201

    # Verify goal is active but not completed
    res_check = requests.get(f"{API_URL}/api/training-goals/{username}")
    assert len(res_check.json()["goals"]) == 1
    goal = res_check.json()["goals"][0]
    assert goal["is_completed"] == 0
    print(f"Goal active. Current Completion State: {goal['is_completed']}")

    # 3. Start a new game session (SpeedTap)
    print("3. Starting a new SpeedTap game session...")
    payload_session = {
        "username": username,
        "game_type": "SpeedTap"
    }
    res_session = requests.post(f"{API_URL}/api/start-session", json=payload_session)
    print(f"Start Session Status: {res_session.status_code}")
    assert res_session.status_code == 201
    session_data = res_session.json()
    session_id = session_data["session_id"]
    print(f"Session started successfully. ID: {session_id}")

    # 4. Submit game session telemetry (90% accuracy, exceeding target)
    print("4. Submitting round telemetry (90% accuracy, 450ms latency)...")
    payload_metrics = {
        "session_id": session_id,
        "accuracy_rate": 0.90,
        "reaction_time": 450.0,
        "difficulty_level": 2,
        "game_type": "SpeedTap",
        "cognitive_domain": "reflexes_and_focus"
    }
    res_metrics = requests.post(f"{API_URL}/api/submit-metrics", json=payload_metrics)
    assert res_metrics.status_code == 201
    print("Telemetry recorded.")

    # 5. Fetch goals again and verify auto-completion
    print("5. Querying training goals to check auto-completion...")
    res_verify = requests.get(f"{API_URL}/api/training-goals/{username}")
    assert res_verify.status_code == 200
    goals_data = res_verify.json()["goals"]
    assert len(goals_data) == 1
    completed_goal = goals_data[0]
    
    print(f"Goal Status: Domain={completed_goal['domain']}, Target={completed_goal['target_value']}, Current={completed_goal['current_value']}, Completed={completed_goal['is_completed']}, JustCompleted={completed_goal.get('just_completed')}")
    
    # Assertions
    assert completed_goal["is_completed"] == 1
    assert completed_goal["current_value"] == 90.0
    assert completed_goal["just_completed"] is True
    
    # Clean up
    requests.delete(f"{API_URL}/api/training-goals/{completed_goal['id']}")
    print("\n=== Integration Test Passed: Goals Auto-Complete Dynamically on Telemetry Submission! ===")

if __name__ == "__main__":
    test_goal_achievement_flow()

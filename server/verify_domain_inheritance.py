import requests
import json
import sys
import uuid

API_URL = "http://127.0.0.1:5000"

def test_domain_inheritance():
    print("=== Step 1: Starting SpeedTap Session (Domain: reflexes_and_focus) ===")
    unique_user = f"domain_test_user_{uuid.uuid4().hex[:8]}"
    payload_start1 = {
        "username": unique_user,
        "game_type": "SpeedTap"
    }
    
    res1 = requests.post(f"{API_URL}/api/start-session", json=payload_start1)
    if res1.status_code != 201:
        print(f"FAILED: Initial handshake returned status {res1.status_code}")
        sys.exit(1)
        
    data1 = res1.json()
    session_id1 = data1["session_id"]
    initial_params1 = data1["dda_parameters"]
    
    print(f"SpeedTap started. Session ID: {session_id1}, Initial Difficulty: {initial_params1['difficulty_level']}")
    assert initial_params1["difficulty_level"] == 1, "Expected initial difficulty level 1 for new user"
    
    print("\n=== Step 2: Submitting High-Performance Metrics in SpeedTap ===")
    for i in range(5):
        payload_metric = {
            "session_id": session_id1,
            "reaction_time": 250.0,
            "accuracy_rate": 1.0,
            "difficulty": 1
        }
        res_m = requests.post(f"{API_URL}/api/submit-metrics", json=payload_metric)
        assert res_m.status_code == 201
        
    print("\n=== Step 3: Running DDA to Scale Up SpeedTap Difficulty ===")
    res_dda = requests.post(f"{API_URL}/api/dda", json={"session_id": session_id1})
    dda_data = res_dda.json()
    new_difficulty = dda_data["dda_parameters"]["difficulty_level"]
    print(f"New Difficulty: {new_difficulty}")
    assert new_difficulty > 1, f"Expected difficulty to scale up, got {new_difficulty}"
    
    # Submit a metric at the new difficulty level to represent playing at the new difficulty
    payload_metric = {
        "session_id": session_id1,
        "reaction_time": 240.0,
        "accuracy_rate": 1.0,
        "difficulty": new_difficulty
    }
    res_m2 = requests.post(f"{API_URL}/api/submit-metrics", json=payload_metric)
    assert res_m2.status_code == 201
    
    print("\n=== Step 4: Starting FocusFinder Session (Same Domain: reflexes_and_focus) ===")
    payload_start2 = {
        "username": unique_user,
        "game_type": "FocusFinder"
    }
    
    res2 = requests.post(f"{API_URL}/api/start-session", json=payload_start2)
    if res2.status_code != 201:
        print(f"FAILED: Second handshake returned status {res2.status_code}")
        sys.exit(1)
        
    data2 = res2.json()
    session_id2 = data2["session_id"]
    initial_params2 = data2["dda_parameters"]
    
    print(f"FocusFinder started. Session ID: {session_id2}, Inherited Difficulty: {initial_params2['difficulty_level']}")
    assert initial_params2["difficulty_level"] == new_difficulty, f"Expected inherited difficulty level {new_difficulty}, got {initial_params2['difficulty_level']}"
    
    print("\n=== SUCCESS: Domain-based DDA inheritance works perfectly! ===")

if __name__ == "__main__":
    test_domain_inheritance()

import requests
import json
import sys
import uuid

API_URL = "http://127.0.0.1:5000"

def run_stroop_shift_tests():
    print("=== Step 1: Starting Stroop Shift Session Handshake ===")
    
    unique_user = f"stroop_test_user_{uuid.uuid4().hex[:8]}"
    payload_start = {
        "username": unique_user,
        "game_type": "StroopShift"
    }
    
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
    
    # Assert initial parameters match Level 1 StroopShift rules
    assert initial_params["difficulty_level"] == 1
    assert initial_params["spawn_delay"] == 2500
    assert initial_params["conflict_probability"] == 0.0
    assert initial_params["static_text_rotation"] is False
    assert initial_params["dynamic_text_spin"] is False
    assert initial_params["distractor_flashes"] is False
    print("Initial Level 1 parameters assertion PASSED.")

    print("\n=== Step 2: Submitting 5 High-Performance Metrics (100% Accuracy) ===")
    for i in range(5):
        payload_metric = {
            "session_id": session_id,
            "cognitive_domain": "reflexes_and_focus",
            "game_type": "stroop_shift",
            "reaction_time": 450.0,
            "accuracy_rate": 1.0,
            "difficulty": 1,
            "error_count": 0,
            "hesitation_ms": 120.0,
            "spam_click_count": 0
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
    assert adapted_params["spawn_delay"] == 2000
    assert adapted_params["conflict_probability"] == 0.5
    assert adapted_params["static_text_rotation"] is False
    print("Upward difficulty adaptation assertion PASSED.")

    print("\n=== Step 4: Submitting 5 Low-Performance Metrics (0% Accuracy) ===")
    for i in range(5):
        payload_metric = {
            "session_id": session_id,
            "cognitive_domain": "reflexes_and_focus",
            "game_type": "stroop_shift",
            "reaction_time": 2000.0,
            "accuracy_rate": 0.0,
            "difficulty": 2,
            "error_count": 1,
            "hesitation_ms": 800.0,
            "spam_click_count": 5
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
    assert adapted_params2["spawn_delay"] == 2500
    assert adapted_params2["conflict_probability"] == 0.0
    print("Downward difficulty adaptation assertion PASSED.")
    
    print("\n=== SUCCESS: All automated Stroop Shift backend tests passed! ===")

if __name__ == "__main__":
    run_stroop_shift_tests()

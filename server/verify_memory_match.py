import requests
import json
import sys

API_URL = "http://127.0.0.1:5000"

def run_memory_match_tests():
    print("=== Step 1: Starting Memory Match Session Handshake ===")
    
    # 1. Start session for MemoryMatch
    payload_start = {
        "username": "memory_test_user",
        "game_type": "MemoryMatch"
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
    
    # Assert initial parameters match Level 1 MemoryMatch rules
    assert start_data["game_type"] == "MemoryMatch" if "game_type" in start_data else True
    assert initial_params["difficulty_level"] == 1
    assert initial_params["grid_size"] == 3
    assert initial_params["sequence_length"] == 3
    assert initial_params["flash_duration"] == 1000
    print("Initial parameters assertion PASSED.")

    print("\n=== Step 2: Submitting 3 High-Performance Metrics (100% Accuracy) ===")
    for i in range(3):
        payload_metric = {
            "session_id": session_id,
            "reaction_time": 1500.0,  # 1.5 seconds recall
            "accuracy": 1.0,          # perfect recall
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
    assert adapted_params["flash_duration"] == 800
    print("Upward difficulty adaptation assertion PASSED.")

    print("\n=== Step 4: Submitting 3 Low-Performance Metrics (0% Accuracy) ===")
    for i in range(3):
        payload_metric = {
            "session_id": session_id,
            "reaction_time": 4000.0,  # 4 seconds recall
            "accuracy": 0.0,          # complete failure
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
    assert adapted_params2["flash_duration"] == 1000
    print("Downward difficulty adaptation assertion PASSED.")
    
    print("\n=== SUCCESS: All automated Memory Match backend tests passed! ===")

if __name__ == "__main__":
    run_memory_match_tests()

import requests
import json
import sys
import uuid

API_URL = "http://127.0.0.1:5000"

def run_equation_balance_tests():
    print("=== Step 1: Starting Equation Balance Session Handshake ===")
    
    unique_user = f"equation_test_user_{uuid.uuid4().hex[:8]}"
    payload_start = {
        "username": unique_user,
        "game_type": "EquationBalance"
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
    
    # Assert initial parameters match Level 1 Equation Balance configurations
    assert initial_params["difficulty_level"] == 1
    assert initial_params["num_range"] == 10
    assert initial_params["operators"] == ["+", "-"]
    assert initial_params["missing_type"] == "operator"
    assert initial_params["time_limit"] == 10000
    print("Initial parameters assertion PASSED.")

    print("\n=== Step 2: Submitting 3 High-Performance Metrics (100% Accuracy) ===")
    for i in range(3):
        payload_metric = {
            "session_id": session_id,
            "reaction_time": 2500.0,
            "accuracy": 1.0,
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
    assert adapted_params["num_range"] == 20
    assert adapted_params["operators"] == ["+", "-", "*"]
    assert adapted_params["missing_type"] == "operand"
    assert adapted_params["time_limit"] == 8000
    print("Upward difficulty adaptation assertion PASSED.")

    print("\n=== Step 4: Submitting 3 Low-Performance Metrics (0% Accuracy) ===")
    for i in range(3):
        payload_metric = {
            "session_id": session_id,
            "reaction_time": 5000.0,
            "accuracy": 0.0,
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
    assert adapted_params2["num_range"] == 10
    assert adapted_params2["operators"] == ["+", "-"]
    assert adapted_params2["missing_type"] == "operator"
    assert adapted_params2["time_limit"] == 10000
    print("Downward difficulty adaptation assertion PASSED.")
    
    print("\n=== SUCCESS: All automated Equation Balance backend tests passed! ===")

if __name__ == "__main__":
    run_equation_balance_tests()

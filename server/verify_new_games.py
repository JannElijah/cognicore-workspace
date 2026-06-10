import requests
import json
import sys
import uuid

API_URL = "http://127.0.0.1:5000"

def test_neural_n_back():
    print("\n==============================================")
    print("=== Testing Neural N-Back Backend Pipeline ===")
    print("==============================================")
    
    unique_user = f"nback_test_user_{uuid.uuid4().hex[:8]}"
    payload_start = {
        "username": unique_user,
        "game_type": "NeuralNBack"
    }
    
    res = requests.post(f"{API_URL}/api/start-session", json=payload_start)
    assert res.status_code == 201, f"Failed start-session: {res.text}"
    start_data = res.json()
    print("Session started:")
    print(json.dumps(start_data, indent=2))
    
    session_id = start_data["session_id"]
    initial_params = start_data["dda_parameters"]
    assert initial_params["difficulty_level"] == 1
    assert initial_params["n_value"] == 1
    assert initial_params["step_delay"] == 2500
    print("Initial parameters check PASSED.")
    
    # Submit 3 successful rounds
    for i in range(3):
        payload_metric = {
            "session_id": session_id,
            "reaction_time": 800.0,
            "accuracy": 1.0,
            "difficulty": 1
        }
        res_m = requests.post(f"{API_URL}/api/submit-metrics", json=payload_metric)
        assert res_m.status_code == 201
    print("3 perfect metrics submitted.")
    
    # Trigger DDA update
    res_dda = requests.post(f"{API_URL}/api/dda", json={"session_id": session_id})
    assert res_dda.status_code == 200
    dda_data = res_dda.json()
    print("DDA Response:")
    print(json.dumps(dda_data, indent=2))
    
    adapted_params = dda_data["dda_parameters"]
    assert adapted_params["difficulty_level"] == 2
    assert adapted_params["n_value"] == 1
    assert adapted_params["step_delay"] == 2000
    print("Upward difficulty adaptation check PASSED.")

def test_synapse_spin():
    print("\n==============================================")
    print("=== Testing Synapse Spin Backend Pipeline  ===")
    print("==============================================")
    
    unique_user = f"spin_test_user_{uuid.uuid4().hex[:8]}"
    payload_start = {
        "username": unique_user,
        "game_type": "SynapseSpin"
    }
    
    res = requests.post(f"{API_URL}/api/start-session", json=payload_start)
    assert res.status_code == 201, f"Failed start-session: {res.text}"
    start_data = res.json()
    print("Session started:")
    print(json.dumps(start_data, indent=2))
    
    session_id = start_data["session_id"]
    initial_params = start_data["dda_parameters"]
    assert initial_params["difficulty_level"] == 1
    assert initial_params["vertices"] == 4
    assert initial_params["rotation_step"] == 90
    print("Initial parameters check PASSED.")
    
    # Submit 3 successful rounds
    for i in range(3):
        payload_metric = {
            "session_id": session_id,
            "reaction_time": 1200.0,
            "accuracy": 1.0,
            "difficulty": 1
        }
        res_m = requests.post(f"{API_URL}/api/submit-metrics", json=payload_metric)
        assert res_m.status_code == 201
    print("3 perfect metrics submitted.")
    
    # Trigger DDA update
    res_dda = requests.post(f"{API_URL}/api/dda", json={"session_id": session_id})
    assert res_dda.status_code == 200
    dda_data = res_dda.json()
    print("DDA Response:")
    print(json.dumps(dda_data, indent=2))
    
    adapted_params = dda_data["dda_parameters"]
    assert adapted_params["difficulty_level"] == 2
    assert adapted_params["vertices"] == 5
    assert adapted_params["rotation_step"] == 45
    print("Upward difficulty adaptation check PASSED.")

def test_nexus_mapper():
    print("\n==============================================")
    print("=== Testing Nexus Mapper Backend Pipeline  ===")
    print("==============================================")
    
    unique_user = f"mapper_test_user_{uuid.uuid4().hex[:8]}"
    payload_start = {
        "username": unique_user,
        "game_type": "NexusMapper"
    }
    
    res = requests.post(f"{API_URL}/api/start-session", json=payload_start)
    assert res.status_code == 201, f"Failed start-session: {res.text}"
    start_data = res.json()
    print("Session started:")
    print(json.dumps(start_data, indent=2))
    
    session_id = start_data["session_id"]
    initial_params = start_data["dda_parameters"]
    assert initial_params["difficulty_level"] == 1
    assert initial_params["grid_size"] == 3
    assert initial_params["target_count"] == 2
    assert initial_params["flash_duration"] == 2000
    print("Initial parameters check PASSED.")
    
    # Submit 3 successful rounds
    for i in range(3):
        payload_metric = {
            "session_id": session_id,
            "reaction_time": 1000.0,
            "accuracy": 1.0,
            "difficulty": 1
        }
        res_m = requests.post(f"{API_URL}/api/submit-metrics", json=payload_metric)
        assert res_m.status_code == 201
    print("3 perfect metrics submitted.")
    
    # Trigger DDA update
    res_dda = requests.post(f"{API_URL}/api/dda", json={"session_id": session_id})
    assert res_dda.status_code == 200
    dda_data = res_dda.json()
    print("DDA Response:")
    print(json.dumps(dda_data, indent=2))
    
    adapted_params = dda_data["dda_parameters"]
    assert adapted_params["difficulty_level"] == 2
    assert adapted_params["grid_size"] == 3
    assert adapted_params["target_count"] == 3
    assert adapted_params["flash_duration"] == 1800
    print("Upward difficulty adaptation check PASSED.")

if __name__ == "__main__":
    try:
        test_neural_n_back()
        test_synapse_spin()
        test_nexus_mapper()
        print("\n==============================================")
        print("=== SUCCESS: All 3 serious games passed tests! ===")
        print("==============================================")
    except AssertionError as e:
        print(f"\nAssertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nTest encountered error: {e}")
        sys.exit(1)

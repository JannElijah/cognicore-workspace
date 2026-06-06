import requests
import json
import sys
import uuid

API_URL = "http://127.0.0.1:5000"

def run_volatility_tests():
    print("=== Start Volatility-Based DDA verification tests (Option C) ===")

    # Test Case 1: MazeEscape (Strategic, k=3)
    # Submission: 7 metrics with 0.0 accuracy, followed by 3 metrics with 1.0 accuracy.
    # Total metrics = 10.
    # Expected: limit = 3, so average accuracy over last 3 = 100% -> Should scale UP to Level 2.
    print("\n--- Test Case 1: MazeEscape (k=3) ---")
    user_maze = f"vol_maze_{uuid.uuid4().hex[:8]}"
    start_maze = requests.post(f"{API_URL}/api/start-session", json={"username": user_maze, "game_type": "MazeEscape"})
    assert start_maze.status_code == 201
    sid_maze = start_maze.json()["session_id"]
    
    print("Submitting 7 failing metrics (0.0 accuracy)...")
    for i in range(7):
        res = requests.post(f"{API_URL}/api/submit-metrics", json={
            "session_id": sid_maze,
            "cognitive_domain": "executive_strategy",
            "game_type": "MazeEscape",
            "reaction_time": 5000.0,
            "accuracy_rate": 0.0,
            "difficulty": 1,
            "path_efficiency": 0.0
        })
        assert res.status_code == 201

    print("Submitting 3 successful metrics (1.0 accuracy)...")
    for i in range(3):
        res = requests.post(f"{API_URL}/api/submit-metrics", json={
            "session_id": sid_maze,
            "cognitive_domain": "executive_strategy",
            "game_type": "MazeEscape",
            "reaction_time": 2000.0,
            "accuracy_rate": 1.0,
            "difficulty": 1,
            "path_efficiency": 1.0
        })
        assert res.status_code == 201

    print("Triggering DDA Adaptation...")
    dda_maze = requests.post(f"{API_URL}/api/dda", json={"session_id": sid_maze})
    assert dda_maze.status_code == 200
    res_maze = dda_maze.json()["dda_parameters"]
    print(f"MazeEscape adjusted difficulty level: {res_maze['difficulty_level']} (Expected: 2)")
    assert res_maze["difficulty_level"] == 2
    print("SUCCESS: MazeEscape (k=3) scaled up correctly.")

    # Test Case 2: StroopShift (Attentional, k=10)
    # Submission: 7 metrics with 0.0 accuracy, followed by 3 metrics with 1.0 accuracy.
    # Expected: limit = 10, so average accuracy over last 10 = 30% -> Should NOT scale up. Difficulty remains 1.
    print("\n--- Test Case 2: StroopShift (k=10) ---")
    user_stroop = f"vol_stroop_{uuid.uuid4().hex[:8]}"
    start_stroop = requests.post(f"{API_URL}/api/start-session", json={"username": user_stroop, "game_type": "StroopShift"})
    assert start_stroop.status_code == 201
    sid_stroop = start_stroop.json()["session_id"]
    
    print("Submitting 7 failing metrics (0.0 accuracy)...")
    for i in range(7):
        res = requests.post(f"{API_URL}/api/submit-metrics", json={
            "session_id": sid_stroop,
            "cognitive_domain": "reflexes_and_focus",
            "game_type": "StroopShift",
            "reaction_time": 2500.0,
            "accuracy_rate": 0.0,
            "difficulty": 1
        })
        assert res.status_code == 201

    print("Submitting 3 successful metrics (1.0 accuracy)...")
    for i in range(3):
        res = requests.post(f"{API_URL}/api/submit-metrics", json={
            "session_id": sid_stroop,
            "cognitive_domain": "reflexes_and_focus",
            "game_type": "StroopShift",
            "reaction_time": 450.0,
            "accuracy_rate": 1.0,
            "difficulty": 1
        })
        assert res.status_code == 201

    print("Triggering DDA Adaptation...")
    dda_stroop = requests.post(f"{API_URL}/api/dda", json={"session_id": sid_stroop})
    assert dda_stroop.status_code == 200
    res_stroop = dda_stroop.json()["dda_parameters"]
    print(f"StroopShift adjusted difficulty level: {res_stroop['difficulty_level']} (Expected: 1)")
    assert res_stroop["difficulty_level"] == 1
    print("SUCCESS: StroopShift (k=10) did not scale up because of low window average.")

    # Test Case 3: MemoryMatch (Standard, k=5)
    # Submission: 7 metrics with 0.0 accuracy, followed by 3 metrics with 1.0 accuracy.
    # Expected: limit = 5, so average accuracy over last 5 = 60% -> Should NOT scale up. Difficulty remains 1.
    print("\n--- Test Case 3: MemoryMatch (k=5) ---")
    user_mem = f"vol_mem_{uuid.uuid4().hex[:8]}"
    start_mem = requests.post(f"{API_URL}/api/start-session", json={"username": user_mem, "game_type": "MemoryMatch"})
    assert start_mem.status_code == 201
    sid_mem = start_mem.json()["session_id"]
    
    print("Submitting 7 failing metrics (0.0 accuracy)...")
    for i in range(7):
        res = requests.post(f"{API_URL}/api/submit-metrics", json={
            "session_id": sid_mem,
            "cognitive_domain": "spatial_visual_memory",
            "game_type": "MemoryMatch",
            "reaction_time": 3000.0,
            "accuracy_rate": 0.0,
            "difficulty": 1
        })
        assert res.status_code == 201

    print("Submitting 3 successful metrics (1.0 accuracy)...")
    for i in range(3):
        res = requests.post(f"{API_URL}/api/submit-metrics", json={
            "session_id": sid_mem,
            "cognitive_domain": "spatial_visual_memory",
            "game_type": "MemoryMatch",
            "reaction_time": 800.0,
            "accuracy_rate": 1.0,
            "difficulty": 1
        })
        assert res.status_code == 201

    print("Triggering DDA Adaptation...")
    dda_mem = requests.post(f"{API_URL}/api/dda", json={"session_id": sid_mem})
    assert dda_mem.status_code == 200
    res_mem = dda_mem.json()["dda_parameters"]
    print(f"MemoryMatch adjusted difficulty level: {res_mem['difficulty_level']} (Expected: 1)")
    assert res_mem["difficulty_level"] == 1
    print("SUCCESS: MemoryMatch (k=5) did not scale up.")

    print("\n=== ALL VOLATILITY-BASED DDA TESTS PASSED SUCCESSFULLY! ===")
    return True

if __name__ == "__main__":
    success = run_volatility_tests()
    if not success:
        sys.exit(1)
    sys.exit(0)

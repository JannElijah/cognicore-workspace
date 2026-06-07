import requests
import json

API_URL = "http://127.0.0.1:5000"

def test_training_goals():
    username = "goal_test_user"
    
    print("=== Step 1: Getting initial goals (should be empty list) ===")
    res1 = requests.get(f"{API_URL}/api/training-goals/{username}")
    print(f"Status: {res1.status_code}")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "success"
    assert "goals" in data1
    print(f"Initial goals count: {len(data1['goals'])}")

    print("\n=== Step 2: Creating a new training goal ===")
    payload = {
        "username": username,
        "domain": "reflexes_and_focus",
        "metric_type": "accuracy",
        "target_value": 85.0
    }
    res2 = requests.post(f"{API_URL}/api/training-goals", json=payload)
    print(f"Status: {res2.status_code}")
    assert res2.status_code == 201
    data2 = res2.json()
    assert data2["status"] == "success"
    print("Goal created successfully.")

    print("\n=== Step 3: Getting goals list with new goal ===")
    res3 = requests.get(f"{API_URL}/api/training-goals/{username}")
    print(f"Status: {res3.status_code}")
    assert res3.status_code == 200
    data3 = res3.json()
    assert len(data3["goals"]) == 1
    goal = data3["goals"][0]
    goal_id = goal["id"]
    print(f"Fetched Goal: ID={goal_id}, Domain={goal['domain']}, Metric={goal['metric_type']}, Target={goal['target_value']}, Completed={goal['is_completed']}")
    
    print("\n=== Step 4: Deleting the training goal ===")
    res4 = requests.delete(f"{API_URL}/api/training-goals/{goal_id}")
    print(f"Status: {res4.status_code}")
    assert res4.status_code == 200
    data4 = res4.json()
    assert data4["status"] == "success"
    print("Goal deleted successfully.")

    print("\n=== Step 5: Verifying deletion ===")
    res5 = requests.get(f"{API_URL}/api/training-goals/{username}")
    assert len(res5.json()["goals"]) == 0
    print("Deletion verified successfully.")

    print("\n=== All Training Goals Endpoint Tests Passed! ===")

if __name__ == "__main__":
    test_training_goals()

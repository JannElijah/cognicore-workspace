import requests
import json
import sqlite3
import os

API_URL = "http://127.0.0.1:5000"
DB_PATH = "cognicore.db"

def run_tests():
    print("=== Step 1: Checking if SQLite table 'iso_evaluations' exists ===")
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database file not found at {DB_PATH}")
        return False
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='iso_evaluations'")
    table = cursor.fetchone()
    conn.close()
    
    if not table:
        print("ERROR: Table 'iso_evaluations' was not created in the database.")
        return False
    print("SUCCESS: 'iso_evaluations' table is verified in the SQLite database.")

    print("\n=== Step 2: Testing POST /api/iso-evaluations with valid data ===")
    valid_payload = {
        "functionality_score": 4,
        "usability_score": 5,
        "reliability_score": 3,
        "efficiency_score": 4,
        "ux_score": 5
    }
    res = requests.post(f"{API_URL}/api/iso-evaluations", json=valid_payload)
    print(f"Status Code: {res.status_code}")
    print(f"Response: {res.json()}")
    if res.status_code != 201:
        print("FAILED: Expected HTTP status 201")
        return False
        
    print("\n=== Step 3: Testing POST /api/iso-evaluations with invalid out-of-bounds data ===")
    invalid_payload = {
        "functionality_score": 6, # Invalid: must be 1-5
        "usability_score": 5,
        "reliability_score": 3,
        "efficiency_score": 4,
        "ux_score": 5
    }
    res_inv = requests.post(f"{API_URL}/api/iso-evaluations", json=invalid_payload)
    print(f"Status Code: {res_inv.status_code}")
    print(f"Response: {res_inv.json()}")
    if res_inv.status_code != 400:
        print("FAILED: Expected HTTP status 400 for out-of-bounds score")
        return False

    print("\n=== Step 4: Testing POST /api/iso-evaluations with missing fields ===")
    missing_payload = {
        "functionality_score": 4,
        "usability_score": 5
    }
    res_miss = requests.post(f"{API_URL}/api/iso-evaluations", json=missing_payload)
    print(f"Status Code: {res_miss.status_code}")
    print(f"Response: {res_miss.json()}")
    if res_miss.status_code != 400:
        print("FAILED: Expected HTTP status 400 for missing fields")
        return False

    print("\n=== Step 5: Testing GET /api/iso-evaluations ===")
    res_get = requests.get(f"{API_URL}/api/iso-evaluations")
    print(f"Status Code: {res_get.status_code}")
    data = res_get.json()
    print(f"Number of evaluations fetched: {len(data.get('evaluations', []))}")
    if res_get.status_code != 200 or "evaluations" not in data:
        print("FAILED: Expected HTTP status 200 and 'evaluations' array")
        return False

    print("\n=== Step 6: Testing GET /api/iso-evaluations/summary ===")
    res_sum = requests.get(f"{API_URL}/api/iso-evaluations/summary")
    print(f"Status Code: {res_sum.status_code}")
    summary_data = res_sum.json()
    print(f"Summary Response: {json.dumps(summary_data, indent=2)}")
    if res_sum.status_code != 200 or "summary" not in summary_data:
        print("FAILED: Expected HTTP status 200 and 'summary' object")
        return False
        
    summary = summary_data["summary"]
    print(f"Count of evaluations in summary: {summary['count']}")
    if summary["count"] < 1:
        print("FAILED: Expected evaluation count to be at least 1")
        return False
        
    print("\n=== ALL API TESTS PASSED SUCCESSFULLY! ===")
    return True

if __name__ == "__main__":
    import sys
    success = run_tests()
    if not success:
        sys.exit(1)
    sys.exit(0)

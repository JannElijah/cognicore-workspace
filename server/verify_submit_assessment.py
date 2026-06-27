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

import sqlite3
import os
import sys

API_URL = "http://127.0.0.1:5000"
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cognicore.db')

def test_submit_assessment():
    print("=== Start submit-assessment endpoint tests ===")

    # Test Case 1: Direct Scores Submit
    print("\n--- Test Case 1: Direct Scores Submit ---")
    payload1 = {
        "username": "direct_score_user",
        "assessment_type": "pre-test",
        "answers": {
            "spatial_visual_score": 70.0,
            "logical_math_score": 90.0,
            "attention_score": 55.0,
            "executive_score": 80.0
        }
    }
    res1 = requests.post(f"{API_URL}/api/submit-assessment", json=payload1)
    print(f"Status Code: {res1.status_code}")
    assert res1.status_code == 201, f"Failed: {res1.text}"
    data1 = res1.json()
    assert data1["status"] == "success"
    assert data1["weakest_domain"] == "reflexes_and_focus"
    assert data1["prescribed_game"] == "SpeedTap"
    print("SUCCESS: Direct scores submit computed weakest domain and prescribed game correctly.")

    # Test Case 2: Likert Scale Answers Map Submit
    print("\n--- Test Case 2: Likert Scale (1-5) Answers Submit ---")
    payload2 = {
        "username": "likert_user",
        "assessment_type": "pre-test",
        "answers": {
            "q1": 4, "q2": 5, "q3": 3, "q4": 4,
            "q5": 5, "q6": 5, "q7": 2, "q8": 4,
            "q9": 3, "q10": 5, "q11": 1, "q12": 4
        }
    }
    # For reflexes_and_focus: q3=3, q7=2, q11=1. Avg = 2.0. Score = ((2-1)/4)*100 = 25.0
    # For spatial_visual_memory: q1=4, q5=5, q9=3. Avg = 4.0. Score = ((4-1)/4)*100 = 75.0
    # For logical_mathematical: q2=5, q6=5, q10=5. Avg = 5.0. Score = ((5-1)/4)*100 = 100.0
    # For executive_strategy: q4=4, q8=4, q12=4. Avg = 4.0. Score = ((4-1)/4)*100 = 75.0
    res2 = requests.post(f"{API_URL}/api/submit-assessment", json=payload2)
    print(f"Status Code: {res2.status_code}")
    assert res2.status_code == 201, f"Failed: {res2.text}"
    data2 = res2.json()
    assert data2["status"] == "success"
    assert data2["scores"]["reflexes_and_focus"] == 25.0
    assert data2["scores"]["spatial_visual_memory"] == 75.0
    assert data2["weakest_domain"] == "reflexes_and_focus"
    assert data2["prescribed_game"] == "SpeedTap"
    print("SUCCESS: Likert scale parsing, mapping, and calculation works perfectly.")

    # Test Case 3: Verify Schema & Database Contents
    print("\n--- Test Case 3: Verify Schema & DB Contents ---")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ca.*, u.username 
        FROM cognitive_assessments ca 
        JOIN users u ON ca.user_id = u.id 
        WHERE u.username IN ('direct_score_user', 'likert_user')
        ORDER BY ca.id ASC
    """)
    rows = cursor.fetchall()
    assert len(rows) >= 2
    row_direct = [r for r in rows if r['username'] == 'direct_score_user'][0]
    row_likert = [r for r in rows if r['username'] == 'likert_user'][0]
    
    assert row_direct['attention_score'] == 55.0
    assert row_likert['attention_score'] == 25.0
    print("SUCCESS: Data successfully committed and verified in DB.")

    # Test Case 4: Verify Foreign Key Constraints (PRAGMA foreign_keys = ON;)
    print("\n--- Test Case 4: Verify Foreign Key Constraints ---")
    # Try inserting directly into database with an invalid user_id using the wrapper's connection
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        cursor.execute(
            """
            INSERT INTO cognitive_assessments 
            (user_id, assessment_type, spatial_visual_score, logical_math_score, attention_score, executive_score)
            VALUES (999999, 'pre-test', 50, 50, 50, 50)
            """
        )
        conn.commit()
        print("FAILED: Inserted record with non-existent user_id without triggering foreign key violation.")
        sys.exit(1)
    except sqlite3.IntegrityError as e:
        print(f"SUCCESS: SQLite triggered expected IntegrityError due to foreign key violation: {e}")
        
    conn.close()
    print("\n=== ALL SUBMIT ASSESSMENT AND SCHEMATIC TESTS PASSED! ===")

if __name__ == "__main__":
    try:
        test_submit_assessment()
    except AssertionError as ae:
        print(f"Assertion Error: {ae}")
        sys.exit(1)
    except Exception as ex:
        print(f"Unexpected Error: {ex}")
        sys.exit(1)

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
import sys

API_URL = "http://127.0.0.1:5000"

def test_evaluate_database():
    print("=== Start database-driven evaluate endpoint tests ===")
    
    unique_user = f"eval_user_{uuid.uuid4().hex[:8]}"
    
    # Step 1: Submit pre-test assessment
    print("\nSubmitting Pre-Test Assessment...")
    payload_pre = {
        "username": unique_user,
        "assessment_type": "pre-test",
        "answers": {
            "spatial_visual_score": 50.0,
            "logical_math_score": 60.0,
            "attention_score": 45.0,
            "executive_score": 55.0
        }
    }
    res_pre = requests.post(f"{API_URL}/api/submit-assessment", json=payload_pre)
    assert res_pre.status_code == 201
    
    # Step 2: Try evaluating immediately without a post-test (should fail 400)
    print("\nEvaluating with pre-test only (should fail)...")
    res_fail = requests.post(f"{API_URL}/api/evaluate", json={"username": unique_user})
    print(f"Status Code: {res_fail.status_code}")
    assert res_fail.status_code == 400
    print("SUCCESS: Rejected evaluation due to missing post-test.")

    # Step 3: Submit post-test assessment
    print("\nSubmitting Post-Test Assessment...")
    payload_post = {
        "username": unique_user,
        "assessment_type": "post-test",
        "answers": {
            "spatial_visual_score": 75.0,
            "logical_math_score": 85.0,
            "attention_score": 70.0,
            "executive_score": 80.0
        }
    }
    res_post = requests.post(f"{API_URL}/api/submit-assessment", json=payload_post)
    assert res_post.status_code == 201
    
    # Step 4: Run paired evaluation
    print("\nEvaluating pre-test vs post-test...")
    res_eval = requests.post(f"{API_URL}/api/evaluate", json={"username": unique_user})
    print(f"Status Code: {res_eval.status_code}")
    assert res_eval.status_code == 200, f"Failed: {res_eval.text}"
    eval_data = res_eval.json()
    print("Evaluation Results:")
    print(json.dumps(eval_data, indent=2))
    
    assert eval_data["status"] == "success"
    assert eval_data["sample_size"] == 4
    assert eval_data["mean_pretest"] == 52.5 # (50+60+45+55)/4
    assert eval_data["mean_posttest"] == 77.5 # (75+85+70+80)/4
    assert eval_data["domain_improvements"]["spatial_visual_memory"] == 25.0
    assert eval_data["domain_improvements"]["logical_mathematical"] == 25.0
    assert eval_data["domain_improvements"]["reflexes_and_focus"] == 25.0
    assert eval_data["domain_improvements"]["executive_strategy"] == 25.0
    
    print("\n=== ALL DATABASE-DRIVEN EVALUATION TESTS PASSED! ===")

if __name__ == "__main__":
    try:
        test_evaluate_database()
    except AssertionError as ae:
        print(f"Assertion Error: {ae}")
        sys.exit(1)
    except Exception as ex:
        print(f"Unexpected Error: {ex}")
        sys.exit(1)

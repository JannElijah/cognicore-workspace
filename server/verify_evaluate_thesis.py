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
import math

API_URL = "http://127.0.0.1:5000"

def run_tests():
    print("=== Testing POST /api/evaluate with valid cohort data (Option B) ===")
    pretest = [72, 68, 75, 80, 65, 78, 70, 74, 82, 69]
    posttest = [84, 76, 85, 88, 78, 88, 82, 84, 91, 80]
    
    payload = {
        "pretest_scores": pretest,
        "posttest_scores": posttest
    }
    
    res = requests.post(f"{API_URL}/api/evaluate", json=payload)
    print(f"Status Code: {res.status_code}")
    
    if res.status_code != 200:
        print(f"FAILED: Expected status code 200, got {res.status_code}")
        return False
        
    data = res.json()
    print(f"Response data: {json.dumps(data, indent=2)}")
    
    # Assertions for main attributes
    if "cohens_d" not in data:
        print("FAILED: Response missing 'cohens_d'")
        return False
    if "effect_size_magnitude" not in data:
        print("FAILED: Response missing 'effect_size_magnitude'")
        return False
        
    # Expected Cohen's d:
    # diffs = [12, 8, 10, 8, 13, 10, 12, 10, 9, 11]
    # mean_diff = 10.3
    # sum of squares = (1.7^2)*2 + (-2.3^2)*2 + (-0.3^2)*3 + (2.7^2) + (-1.3^2) + (0.7^2)
    #                = 5.78 + 10.58 + 0.27 + 7.29 + 1.69 + 0.49 = 26.1
    # var_diff = 26.1 / 9 = 2.9
    # sd_diff = sqrt(2.9) = 1.702938636592606
    # cohens_d = 10.3 / sd_diff = 6.048373738012678
    # rounded: 6.0484
    expected_d = 6.0484
    if abs(data["cohens_d"] - expected_d) > 0.0001:
        print(f"FAILED: Expected cohens_d ≈ {expected_d}, got {data['cohens_d']}")
        return False
        
    if data["effect_size_magnitude"] != "large":
        print(f"FAILED: Expected magnitude 'large', got {data['effect_size_magnitude']}")
        return False
        
    print("SUCCESS: Valid cohort test passed.")

    print("\n=== Testing POST /api/evaluate with identical changes (sd_diff = 0 edge case) ===")
    payload_zero_variance = {
        "pretest_scores": [70, 70, 70],
        "posttest_scores": [80, 80, 80]
    }
    res_zero = requests.post(f"{API_URL}/api/evaluate", json=payload_zero_variance)
    print(f"Status Code: {res_zero.status_code}")
    if res_zero.status_code != 200:
        print(f"FAILED: Expected status code 200, got {res_zero.status_code}")
        return False
    data_zero = res_zero.json()
    print(f"Zero Variance Response: {json.dumps(data_zero, indent=2)}")
    
    if data_zero["cohens_d"] != 0.0:
        print(f"FAILED: Expected cohens_d 0.0 for zero variance, got {data_zero['cohens_d']}")
        return False
    if data_zero["effect_size_magnitude"] != "negligible":
        print(f"FAILED: Expected magnitude 'negligible', got {data_zero['effect_size_magnitude']}")
        return False
    print("SUCCESS: Zero variance edge case handled safely.")

    print("\n=== Testing POST /api/evaluate with sample size too small (n < 2) ===")
    payload_small = {
        "pretest_scores": [70],
        "posttest_scores": [80]
    }
    res_small = requests.post(f"{API_URL}/api/evaluate", json=payload_small)
    print(f"Status Code: {res_small.status_code}")
    if res_small.status_code != 400:
        print(f"FAILED: Expected status code 400, got {res_small.status_code}")
        return False
    print("SUCCESS: Low sample size check passed.")

    print("\n=== Testing POST /api/evaluate with mismatched cohort sizes ===")
    payload_mismatched = {
        "pretest_scores": [70, 72, 75],
        "posttest_scores": [80, 82]
    }
    res_mismatched = requests.post(f"{API_URL}/api/evaluate", json=payload_mismatched)
    print(f"Status Code: {res_mismatched.status_code}")
    if res_mismatched.status_code != 400:
        print(f"FAILED: Expected status code 400, got {res_mismatched.status_code}")
        return False
    print("SUCCESS: Mismatched cohort size validation passed.")

    print("\n=== Testing POST /api/evaluate with missing parameters ===")
    payload_missing = {
        "pretest_scores": [70, 72, 75]
    }
    res_missing = requests.post(f"{API_URL}/api/evaluate", json=payload_missing)
    print(f"Status Code: {res_missing.status_code}")
    if res_missing.status_code != 400:
        print(f"FAILED: Expected status code 400, got {res_missing.status_code}")
        return False
    print("SUCCESS: Missing parameter validation passed.")

    print("\n=== ALL COHEN'S D API TESTS PASSED SUCCESSFULLY! ===")
    return True

if __name__ == "__main__":
    import sys
    success = run_tests()
    if not success:
        sys.exit(1)
    sys.exit(0)

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

API_URL = "http://127.0.0.1:5000"

def test_research_sandbox():
    print("=== Step 1: Testing /api/research/correlations (All Cohort) ===")
    res1 = requests.get(f"{API_URL}/api/research/correlations?var1=rule_shift_latency_ms&var2=spam_click_count&cohort=all")
    print(f"Status: {res1.status_code}")
    assert res1.status_code == 200, "Correlations endpoint failed"
    data1 = res1.json()
    assert data1["status"] == "success", "Failed status in correlation payload"
    assert "r" in data1, "Missing r value"
    assert "p_value" in data1, "Missing p_value"
    assert "data_points" in data1, "Missing data points"
    print(f"SUCCESS: Correlation computed: r={data1['r']}, p={data1['p_value']}, count={len(data1['data_points'])}")
    print(f"Interpretation: {data1['interpretation']}")

    print("\n=== Step 2: Testing /api/research/correlations (Clinical Cohort) ===")
    res2 = requests.get(f"{API_URL}/api/research/correlations?var1=reaction_time&var2=accuracy_rate&cohort=clinical")
    print(f"Status: {res2.status_code}")
    assert res2.status_code == 200
    data2 = res2.json()
    print(f"SUCCESS: Clinical Correlation: r={data2['r']}, count={len(data2['data_points'])}")

    print("\n=== Step 3: Testing /api/research/learning-curves (user: player_one) ===")
    res3 = requests.get(f"{API_URL}/api/research/learning-curves/player_one")
    print(f"Status: {res3.status_code}")
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["status"] == "success"
    assert "curves" in data3
    assert "active_user" in data3["curves"]
    assert "clinical_cohort" in data3["curves"]
    assert "all_cohort" in data3["curves"]
    print("SUCCESS: Cohort learning curves fetched successfully.")
    print(f"Active user curve points: {len(data3['curves']['active_user'])}")
    print(f"Clinical cohort curve points: {len(data3['curves']['clinical_cohort'])}")
    print(f"All cohort curve points: {len(data3['curves']['all_cohort'])}")

    print("\n=== All Sandbox Endpoint Tests Passed! ===")

if __name__ == "__main__":
    test_research_sandbox()

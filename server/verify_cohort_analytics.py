import requests
import json
import sys

API_URL = "http://127.0.0.1:5000"

def test_cohort_analytics():
    print("=== Start Cohort-Analytics endpoint tests ===")
    
    res = requests.get(f"{API_URL}/api/cohort-analytics")
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200, f"Failed: {res.text}"
    
    data = res.json()
    print("Cohort Analytics Response payload (formatted):")
    print(json.dumps(data, indent=2))
    
    assert data["status"] == "success"
    assert data["sample_size"] == 30
    assert "overall_pre_mean" in data
    assert "overall_post_mean" in data
    assert "overall_improvement_rate_pct" in data
    assert "cohort_t_statistic" in data
    assert "cohort_p_value" in data
    assert "cohort_cohens_d" in data
    assert "effect_size_magnitude" in data
    assert data["statistically_significant"] is True
    assert "hypothesis_verdict" in data
    
    # Check domain specifics
    domains = ["spatial_visual_memory", "logical_mathematical", "reflexes_and_focus", "executive_strategy"]
    for d in domains:
        assert d in data["domains"]
        d_data = data["domains"][d]
        assert "pre_mean" in d_data
        assert "pre_std" in d_data
        assert "post_mean" in d_data
        assert "post_std" in d_data
        assert "improvement_pct" in d_data
        print(f"Verified domain statistics for: {d}")
        
    print("\n=== ALL COHORT ANALYTICS VERIFICATION TESTS PASSED! ===")

if __name__ == "__main__":
    try:
        test_cohort_analytics()
    except AssertionError as ae:
        print(f"Assertion Error: {ae}")
        sys.exit(1)
    except Exception as ex:
        print(f"Unexpected Error: {ex}")
        sys.exit(1)

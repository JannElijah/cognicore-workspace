import requests
import json
import sys

API_URL = "http://127.0.0.1:5000"

def test_model_clustering_pipeline():
    print("\n==============================================")
    print("=== Testing Model & Clustering Pipeline ===")
    print("==============================================")
    
    # 1. Test model status
    print("\n[Step 1] Fetching active model status...")
    res = requests.get(f"{API_URL}/api/model/status")
    print(f"Status code: {res.status_code}")
    assert res.status_code == 200, f"Failed model status: {res.text}"
    status_data = res.json()
    assert status_data["status"] == "success"
    assert "is_sklearn_available" in status_data
    assert "is_loaded_from_disk" in status_data
    assert "dataset_size" in status_data
    print("Initial status check passed:")
    print(json.dumps(status_data, indent=2))
    
    # 2. Test model retrain
    print("\n[Step 2] Triggering online model retraining...")
    res_retrain = requests.post(f"{API_URL}/api/model/retrain")
    print(f"Status code: {res_retrain.status_code}")
    assert res_retrain.status_code in (200, 202), f"Failed model retrain: {res_retrain.text}"
    retrain_data = res_retrain.json()
    assert retrain_data["status"] == "success"
    
    # Poll status endpoint until training finishes
    import time
    print("Waiting for background retraining to complete...")
    max_retries = 40
    retries = 0
    while retries < max_retries:
        time.sleep(1)
        res_status = requests.get(f"{API_URL}/api/model/status")
        assert res_status.status_code == 200
        status_data = res_status.json()
        if status_data.get("training_status") != "training":
            break
        retries += 1
        
    assert status_data.get("training_status") == "idle", f"Retraining failed or timed out: {status_data}"
    retrain_metrics = status_data.get("last_retrain_metrics")
    assert retrain_metrics is not None, "Missing retrain metrics post-retrain"
    assert "test_accuracy" in retrain_metrics
    assert "cluster_centroids" in retrain_metrics
    assert "classification_report" in retrain_metrics
    
    print("\nRetraining completed successfully. Results summary:")
    print(f"  Test Accuracy: {retrain_metrics['test_accuracy']}")
    print("  Cluster centroids:")
    print(json.dumps(retrain_metrics["cluster_centroids"], indent=2))
    
    # 3. Test model status after retraining (loaded from disk should be True)
    print("\n[Step 3] Fetching model status post-retrain...")
    res_status2 = requests.get(f"{API_URL}/api/model/status")
    assert res_status2.status_code == 200
    status_data2 = res_status2.json()
    assert status_data2["is_loaded_from_disk"] is True
    print("Status loaded_from_disk flag verified post-training.")
    
    # 4. Test model clusters retrieval
    print("\n[Step 4] Querying clustered session datasets...")
    res_clusters = requests.get(f"{API_URL}/api/model/clusters")
    print(f"Status code: {res_clusters.status_code}")
    assert res_clusters.status_code == 200, f"Failed model clusters: {res_clusters.text}"
    clusters_data = res_clusters.json()
    assert clusters_data["status"] == "success"
    assert "data_points" in clusters_data
    
    points = clusters_data["data_points"]
    print(f"Retrieved {len(points)} clustered training data points.")
    if len(points) > 0:
        first_point = points[0]
        print("First data point schema:")
        print(json.dumps(first_point, indent=2))
        assert "cluster" in first_point
        assert "accuracy" in first_point
        assert "reaction_time" in first_point
        assert "hesitation" in first_point
        assert "spam_clicks" in first_point
        assert "path_efficiency" in first_point
        assert "username" in first_point
        assert "session_id" in first_point
        
    print("\n==============================================")
    print("=== SUCCESS: Model & Clustering tests passed! ===")
    print("==============================================")

if __name__ == "__main__":
    try:
        test_model_clustering_pipeline()
    except AssertionError as e:
        print(f"\nAssertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nTest encountered error: {e}")
        sys.exit(1)

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
import sys

API_URL = "http://127.0.0.1:5000"

def test_model_clustering_pipeline(monkeypatch, tmp_path, request):
    import pickle
    import routes.ml as ml_routes
    import train_model

    cron_secret = "test_model_clustering_secret"
    monkeypatch.setenv("CRON_SECRET", cron_secret)
    base_get_db = ml_routes.get_db_connection

    class _FetchManyCursor:
        def __init__(self, inner):
            self._inner = inner

        def fetchmany(self, size=1000):
            return self._inner.cursor.fetchmany(size)

        def __getattr__(self, name):
            return getattr(self._inner, name)

    class _FetchManyConn:
        def __init__(self, inner):
            self._inner = inner

        def cursor(self):
            return _FetchManyCursor(self._inner.cursor())

        def __enter__(self):
            self._inner.__enter__()
            return self

        def __exit__(self, *args):
            return self._inner.__exit__(*args)

        def __getattr__(self, name):
            return getattr(self._inner, name)

    monkeypatch.setattr(train_model, "get_db_connection", lambda: _FetchManyConn(base_get_db()))

    model_out = tmp_path / "cognitive_model.pkl"
    cluster_out = tmp_path / "clustering_model.pkl"
    scaler_out = tmp_path / "scaler.pkl"
    version_dir = tmp_path / "model_versions"
    monkeypatch.setattr(train_model, "MODEL_OUT_PATH", str(model_out))
    monkeypatch.setattr(train_model, "CLUSTER_OUT_PATH", str(cluster_out))
    monkeypatch.setattr(train_model, "SCALER_OUT_PATH", str(scaler_out))
    monkeypatch.setattr(train_model, "MODEL_VERSION_DIR", str(version_dir))

    real_grid_search = train_model.GridSearchCV

    def _fast_grid_search(estimator, param_grid, **kwargs):
        kwargs["n_jobs"] = 1
        return real_grid_search(estimator, {"n_estimators": [30], "max_depth": [4, None]}, **kwargs)

    monkeypatch.setattr(train_model, "GridSearchCV", _fast_grid_search)

    classifier = ml_routes.archetype_classifier
    orig_model = classifier.model
    orig_cluster = classifier.clustering_model
    orig_scaler = classifier.scaler
    orig_loaded = classifier.is_loaded_from_disk

    def _reload_from_tmp():
        with open(model_out, "rb") as f:
            classifier.model = pickle.load(f)
        with open(cluster_out, "rb") as f:
            classifier.clustering_model = pickle.load(f)
        with open(scaler_out, "rb") as f:
            classifier.scaler = pickle.load(f)
        classifier.is_loaded_from_disk = True
        return True

    def _restore_classifier():
        classifier.model = orig_model
        classifier.clustering_model = orig_cluster
        classifier.scaler = orig_scaler
        classifier.is_loaded_from_disk = orig_loaded

    monkeypatch.setattr(classifier, "reload_models", _reload_from_tmp)
    request.addfinalizer(_restore_classifier)
    print("\n==============================================")
    print("=== Testing Model & Clustering Pipeline ===")
    print("==============================================")
    
    # 1. Test model status
    print("\n[Step 1] Fetching active model status...")
    res = requests.get(f"{API_URL}/api/model/status")
    print(f"Status code: {res.status_code}")
    assert res.status_code == 200, f"Failed model status: {res.text}"
    status_data = res.json()
    assert status_data["status"] == "idle"
    print("Initial status check passed:")
    print(json.dumps(status_data, indent=2))
    
    # 2. Test model retrain
    print("\n[Step 2] Triggering online model retraining...")
    res_unauth = requests.post(f"{API_URL}/api/model/retrain")
    assert res_unauth.status_code == 401, f"Expected 401 without X-Cron-Secret, got {res_unauth.status_code}"
    res_retrain = requests.post(
        f"{API_URL}/api/model/retrain",
        headers={"X-Cron-Secret": cron_secret},
    )
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
        if status_data.get("status") != "training":
            break
        retries += 1
        
    assert status_data.get("status") == "idle", f"Retraining failed or timed out: {status_data}"
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
    assert status_data2["status"] == "idle"
    assert status_data2["last_retrain_metrics"] is not None
    assert classifier.is_loaded_from_disk is True
    print("Status loaded_from_disk flag verified post-training.")
    
    # 4. Test model clusters retrieval
    print("\n[Step 4] Querying clustered session datasets...")
    res_clusters = requests.get(f"{API_URL}/api/model/clusters")
    print(f"Status code: {res_clusters.status_code}")
    assert res_clusters.status_code == 200, f"Failed model clusters: {res_clusters.text}"
    clusters_data = res_clusters.json()
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

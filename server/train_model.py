import os
import pickle
import numpy as np
import gc
from database import get_db_connection

# Try importing sklearn
try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split, GridSearchCV
    from sklearn.metrics import classification_report, accuracy_score
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

MODEL_OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cognitive_model.pkl')
CLUSTER_OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'clustering_model.pkl')
SCALER_OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scaler.pkl')

def calculate_ols_slope(y_vals):
    n = len(y_vals)
    if n < 2:
        return 0.0
    x_vals = list(range(n))
    sum_x = sum(x_vals)
    sum_y = sum(y_vals)
    sum_xx = sum(x ** 2 for x in x_vals)
    sum_xy = sum(x_vals[i] * y_vals[i] for i in range(n))
    
    denominator = n * sum_xx - sum_x ** 2
    if denominator == 0:
        return 0.0
    slope = (n * sum_xy - sum_x * sum_y) / denominator
    return slope

def train_retargeted_classifier():
    print("=== Start Offline Model Retraining & Tuning Pipeline ===")
    
    if not SKLEARN_AVAILABLE:
        print("Error: scikit-learn is not installed. Retraining aborted.")
        return False

    conn = get_db_connection()
    cursor = conn.cursor()
    
    raw_sessions = []
    
    print("Extracting user session metrics (Batched & Memory Optimized)...")
    
    # 1. Fetch all aggregated data in one go, ordered by user and time to avoid N+1 queries
    # Using fetchmany() and chunking to prevent OOM on Render
    cursor.execute("""
        SELECT 
            gs.user_id,
            gs.id as session_id,
            AVG(pm.accuracy_rate) as avg_acc, 
            AVG(pm.reaction_time) as avg_rt,
            AVG(pm.hesitation_ms) as avg_hes,
            AVG(pm.spam_click_count) as avg_spam,
            AVG(pm.rule_shift_latency_ms) as avg_rule,
            AVG(pm.path_efficiency) as avg_path
        FROM game_sessions gs
        JOIN performance_metrics pm ON gs.id = pm.session_id
        GROUP BY gs.user_id, gs.id, gs.start_time
        ORDER BY gs.user_id ASC, gs.start_time ASC, gs.id ASC
    """)
    
    current_user = None
    history_acc = []
    history_rt = []
    
    while True:
        rows = cursor.fetchmany(1000)
        if not rows:
            break
            
        for row in rows:
            user_id = row['user_id']
            avg_acc = row['avg_acc']
            avg_rt = row['avg_rt']
            avg_hesitation = row['avg_hes'] if row['avg_hes'] is not None else 0.0
            avg_spam = row['avg_spam'] if row['avg_spam'] is not None else 0.0
            avg_rule_shift = row['avg_rule'] if row['avg_rule'] is not None else 0.0
            avg_path_eff = row['avg_path'] if row['avg_path'] is not None else 1.0
            
            if current_user != user_id:
                current_user = user_id
                history_acc = []
                history_rt = []
                
            if avg_acc is not None and avg_rt is not None:
                if avg_rt > 30000.0 or avg_rt < 50.0:
                    continue
                history_acc.append(avg_acc)
                history_rt.append(avg_rt)
                
                # Compute OLS slopes
                acc_slope = calculate_ols_slope(history_acc)
                rt_slope = calculate_ols_slope(history_rt)
                
                # Features for clustering (7 dimensions)
                cluster_features = [
                    avg_acc, 
                    avg_rt, 
                    acc_slope, 
                    rt_slope, 
                    avg_hesitation, 
                    avg_spam, 
                    avg_path_eff
                ]
                
                # Features for classifier (7 dimensions - upgraded)
                classifier_features = [avg_acc, avg_rt, acc_slope, rt_slope, avg_hesitation, avg_spam, avg_path_eff]
                
                raw_sessions.append({
                    "cluster_features": cluster_features,
                    "classifier_features": classifier_features
                })
        
        # Explicit garbage collection per batch to save RAM
        gc.collect()

    conn.close()
    
    n_samples = len(raw_sessions)
    print(f"Extracted {n_samples} training samples.")
    if n_samples < 15:
        print("Error: Too few training samples to fit classification model. Make sure database is seeded.")
        return False
        
    # Extract feature matrices
    X_cluster = np.array([s["cluster_features"] for s in raw_sessions])
    X_classifier = np.array([s["classifier_features"] for s in raw_sessions])
    
    # 2. Fit standard scaler and KMeans
    scaler = StandardScaler()
    X_cluster_scaled = scaler.fit_transform(X_cluster)
    
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(X_cluster_scaled)
    
    # 3. Dynamically map cluster index to logical cognitive archetype names
    # Calculate rank score for each cluster: mean_accuracy * 1000 - mean_reaction_time
    centroids = kmeans.cluster_centers_
    # Let's project centroids back to original scale to find the original means
    centroids_orig = scaler.inverse_transform(centroids)
    
    cluster_scores = []
    for i in range(3):
        mean_acc = centroids_orig[i][0]  # first feature is accuracy
        mean_rt = centroids_orig[i][1]   # second feature is reaction_time
        mean_hes = centroids_orig[i][4]  # fifth feature is hesitation
        mean_spam = centroids_orig[i][5] # sixth feature is spam clicks
        score = mean_acc * 1000.0 - mean_rt - mean_hes * 2.0 - mean_spam * 500.0
        cluster_scores.append((score, i))
        
    # Sort clusters by score ascending:
    # 1. Lowest score: High Fatigue (Beginner)
    # 2. Middle score: Plateauing (Standard)
    # 3. Highest score: Fast Learner (Advanced)
    cluster_scores.sort()
    
    cluster_mapping = {
        cluster_scores[0][1]: "High Fatigue",
        cluster_scores[1][1]: "Plateauing",
        cluster_scores[2][1]: "Fast Learner"
    }
    
    y = np.array([cluster_mapping[lbl] for lbl in cluster_labels])
    
    # Print cluster characteristics
    print("\nDiscovered Unsupervised Archetypes (Centroids in Original Scale):")
    for mapped_idx, (score, orig_idx) in enumerate(cluster_scores):
        name = cluster_mapping[orig_idx]
        c_orig = centroids_orig[orig_idx]
        print(f"  Cluster {orig_idx} -> {name}:")
        print(f"    Avg Accuracy: {c_orig[0]*100:.2f}%")
        print(f"    Avg Reaction Time: {c_orig[1]:.2f} ms")
        print(f"    Avg Hesitation: {c_orig[4]:.2f} ms")
        print(f"    Avg Spam Clicks: {c_orig[5]:.2f}")
        print(f"    Avg Path Efficiency: {c_orig[6]:.2f}")
        
    # Check class distributions
    classes, counts = np.unique(y, return_counts=True)
    print("\nClass distribution based on clustering:")
    for cls, cnt in zip(classes, counts):
        print(f"  {cls}: {cnt} samples ({cnt/n_samples*100:.1f}%)")
        
    # Split train/test sets
    X_train, X_test, y_train, y_test = train_test_split(
        X_classifier, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print("\nPerforming Grid Search for RandomForestClassifier hyperparameter optimization...")
    # Setup hyperparameter grids for tuning (optimized for execution speed < 5s)
    param_grid = {
        'n_estimators': [30, 50, 100, 150],
        'max_depth': [4, 6, 8, None],
        'min_samples_split': [2, 5, 10],
        'min_samples_leaf': [1, 2, 4],
        'class_weight': [None, 'balanced'],
        'criterion': ['gini', 'entropy']
    }
    
    rf = RandomForestClassifier(random_state=42)
    grid_search = GridSearchCV(estimator=rf, param_grid=param_grid, cv=3, n_jobs=-1, scoring='accuracy')
    grid_search.fit(X_train, y_train)
    
    best_rf = grid_search.best_estimator_
    print(f"Best hyperparameters selected: {grid_search.best_params_}")
    print(f"Best cross-validation accuracy score: {grid_search.best_score_:.4f}")
    
    # Evaluate model
    y_pred = best_rf.predict(X_test)
    test_acc = accuracy_score(y_test, y_pred)
    print(f"\nEvaluation on Test Set (20% split - {len(y_test)} samples):")
    print(f"Test Accuracy Score: {test_acc:.4f}")
    
    # Save the files to disk
    print(f"Saving scaler to {SCALER_OUT_PATH}...")
    with open(SCALER_OUT_PATH, 'wb') as f:
        pickle.dump(scaler, f)
        
    print(f"Saving clustering model to {CLUSTER_OUT_PATH}...")
    with open(CLUSTER_OUT_PATH, 'wb') as f:
        pickle.dump(kmeans, f)
        
    print(f"Saving optimized RandomForest classifier to {MODEL_OUT_PATH}...")
    with open(MODEL_OUT_PATH, 'wb') as f:
        pickle.dump(best_rf, f)
        
    # Create evaluation metrics structure to return
    metrics_summary = {
        "status": "success",
        "sample_size": n_samples,
        "test_accuracy": round(float(test_acc), 4),
        "best_params": grid_search.best_params_,
        "cluster_centroids": {
            cluster_mapping[orig_idx]: {
                "accuracy": round(float(centroids_orig[orig_idx][0]), 4),
                "reaction_time": round(float(centroids_orig[orig_idx][1]), 2),
                "hesitation": round(float(centroids_orig[orig_idx][4]), 2),
                "spam_clicks": round(float(centroids_orig[orig_idx][5]), 2),
                "path_efficiency": round(float(centroids_orig[orig_idx][6]), 4)
            }
            for score, orig_idx in cluster_scores
        },
        "classification_report": classification_report(y_test, y_pred, output_dict=True)
    }
    
    # Save metrics summary to a temporary json/pickle for IPC or return
    print("=== Offline Classifier Training Completed Successfully ===")
    return metrics_summary

if __name__ == '__main__':
    train_retargeted_classifier()

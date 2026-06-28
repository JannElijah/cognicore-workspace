import sqlite3
import os
import pickle
import numpy as np

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

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cognicore.db')
MODEL_OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cognitive_model.pkl')
CLUSTER_OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'clustering_model.pkl')
SCALER_OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scaler.pkl')

def get_db_connection():
    return sqlite3.connect(DB_PATH)

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

    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}. Run seeding first.")
        return False
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Fetch all users
    cursor.execute("SELECT id, username FROM users")
    users = cursor.fetchall()
    
    raw_sessions = []
    
    print(f"Extracting user session metrics for {len(users)} users...")
    
    for user_id, username in users:
        # Fetch sessions chronologically
        cursor.execute(
            """
            SELECT id 
            FROM game_sessions 
            WHERE user_id = ? 
            ORDER BY start_time ASC, id ASC
            """,
            (user_id,)
        )
        sessions = cursor.fetchall()
        session_ids = [s[0] for s in sessions]
        
        # Chronological averages history
        history_acc = []
        history_rt = []
        
        for s_id in session_ids:
            # Query session averages for core + micro-behavioral metrics
            cursor.execute(
                """
                SELECT 
                    AVG(accuracy_rate), 
                    AVG(reaction_time),
                    AVG(hesitation_ms),
                    AVG(spam_click_count),
                    AVG(rule_shift_latency_ms),
                    AVG(path_efficiency)
                FROM performance_metrics
                WHERE session_id = ?
                """,
                (s_id,)
            )
            stats = cursor.fetchone()
            
            avg_acc = stats[0]
            avg_rt = stats[1]
            avg_hesitation = stats[2] if stats[2] is not None else 0.0
            avg_spam = stats[3] if stats[3] is not None else 0.0
            avg_rule_shift = stats[4] if stats[4] is not None else 0.0
            avg_path_eff = stats[5] if stats[5] is not None else 1.0
            
            # If session has metrics
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
                
                # Features for classifier (4 dimensions - backward compatible)
                classifier_features = [avg_acc, avg_rt, acc_slope, rt_slope]
                
                raw_sessions.append({
                    "cluster_features": cluster_features,
                    "classifier_features": classifier_features
                })
                
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

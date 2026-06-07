import sqlite3
import os
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import classification_report, accuracy_score

DB_PATH = 'cognicore.db'
MODEL_OUT_PATH = 'cognitive_model.pkl'

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
    
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}. Run seeding first.")
        return False
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Fetch all users
    cursor.execute("SELECT id, username FROM users")
    users = cursor.fetchall()
    
    X = []
    y = []
    
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
            # Query session averages
            cursor.execute(
                """
                SELECT AVG(accuracy_rate), AVG(reaction_time)
                FROM performance_metrics
                WHERE session_id = ?
                """,
                (s_id,)
            )
            stats = cursor.fetchone()
            
            avg_acc = stats[0]
            avg_rt = stats[1]
            
            # If session has metrics
            if avg_acc is not None and avg_rt is not None:
                history_acc.append(avg_acc)
                history_rt.append(avg_rt)
                
                # Compute OLS slopes
                acc_slope = calculate_ols_slope(history_acc)
                rt_slope = calculate_ols_slope(history_rt)
                
                # Create feature vector
                features = [avg_acc, avg_rt, acc_slope, rt_slope]
                
                # Ground truth labeling logic
                # We align with model.py classes: Fast Learner, High Fatigue, Plateauing
                if acc_slope > 0.005 and rt_slope < -5.0:
                    label = "Fast Learner"
                elif acc_slope < -0.005 and rt_slope > 5.0:
                    label = "High Fatigue"
                else:
                    label = "Plateauing"
                    
                X.append(features)
                y.append(label)
                
    conn.close()
    
    n_samples = len(X)
    print(f"Extracted {n_samples} training samples.")
    if n_samples < 15:
        print("Error: Too few training samples to fit classification model. Make sure database is seeded.")
        return False
        
    X_arr = np.array(X)
    y_arr = np.array(y)
    
    # Check class distributions
    classes, counts = np.unique(y_arr, return_counts=True)
    print("Class distribution in database:")
    for cls, cnt in zip(classes, counts):
        print(f"  {cls}: {cnt} samples ({cnt/n_samples*100:.1f}%)")
        
    # Split train/test sets
    X_train, X_test, y_train, y_test = train_test_split(X_arr, y_arr, test_size=0.2, random_state=42, stratify=y_arr)
    
    print("\nPerforming Grid Search for Random Forest hyperparameter optimization...")
    # Setup hyperparameter grids for tuning
    param_grid = {
        'n_estimators': [20, 50, 80, 120],
        'max_depth': [3, 4, 5, 8, None],
        'min_samples_split': [2, 5],
        'criterion': ['gini', 'entropy']
    }
    
    rf = RandomForestClassifier(random_state=42)
    grid_search = GridSearchCV(estimator=rf, param_grid=param_grid, cv=5, n_jobs=-1, scoring='accuracy')
    grid_search.fit(X_train, y_train)
    
    best_rf = grid_search.best_estimator_
    print(f"Best hyperparameters selected: {grid_search.best_params_}")
    print(f"Best cross-validation accuracy score: {grid_search.best_score_:.4f}")
    
    # Evaluate model
    y_pred = best_rf.predict(X_test)
    test_acc = accuracy_score(y_test, y_pred)
    print(f"\nEvaluation on Test Set (20% split - {len(y_test)} samples):")
    print(f"Test Accuracy Score: {test_acc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save the optimized model to disk
    print(f"Serializing optimized classifier to {MODEL_OUT_PATH}...")
    with open(MODEL_OUT_PATH, 'wb') as f:
        pickle.dump(best_rf, f)
        
    print("=== Offline Classifier Training Completed Successfully ===")
    return True

if __name__ == '__main__':
    train_retargeted_classifier()

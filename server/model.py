"""
================================================================================
Chapter 2 Methodology Compliance: Software Engineering Architecture Patterns
- Pattern: Strategy Pattern / Machine Learning Prediction Service
- Component: Classifier Model (Service Layer)
- Model: Scikit-Learn RandomForestClassifier & KMeans Clustering
- Description: Trains a Random Forest Classifier on synthetic baseline data representing
  Beginner, Intermediate, and Advanced cognitive profiles. Predicts real-time
  archetypes and confidence scores from player session telemetry.
- Robust Connection Redundancy: Includes a deterministic rule-based fallback model
  if Scikit-Learn is missing, ensuring zero runtime interruptions.
================================================================================
"""

import numpy as np
import os
import pickle

# Try importing scikit-learn
try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

class ArchetypeModel:
    def __init__(self):
        self.model = None
        self.clustering_model = None
        self.scaler = None
        self.is_loaded_from_disk = False
        
        if SKLEARN_AVAILABLE:
            dir_path = os.path.dirname(__file__) if '__file__' in globals() else ''
            model_path = os.path.join(dir_path, 'cognitive_model.pkl')
            cluster_path = os.path.join(dir_path, 'clustering_model.pkl')
            scaler_path = os.path.join(dir_path, 'scaler.pkl')
            
            if os.path.exists(model_path) and os.path.exists(cluster_path) and os.path.exists(scaler_path):
                try:
                    with open(model_path, 'rb') as f:
                        self.model = pickle.load(f)
                    with open(cluster_path, 'rb') as f:
                        self.clustering_model = pickle.load(f)
                    with open(scaler_path, 'rb') as f:
                        self.scaler = pickle.load(f)
                    self.is_loaded_from_disk = True
                    print("[ML Model Service] Pre-trained models loaded successfully from disk.")
                except Exception as e:
                    print(f"[ML Model Service] Failed to load cognitive models: {e}. Retraining...")
                    self.train_model()
            else:
                self.train_model()
        else:
            print("[ML Model Service] scikit-learn not available. Falling back to rule-based engine.")

    def train_model(self):
        try:
            # Generate synthetic datasets for 3 longitudinal archetypes
            np.random.seed(42)
            X_cluster = []
            y = []

            # 1. Fast Learner (Improving accuracy, decreasing RT/getting faster)
            for _ in range(60):
                accuracy = np.random.uniform(0.80, 1.0)
                rt = np.random.uniform(200.0, 600.0)
                acc_slope = np.random.uniform(0.015, 0.08)
                rt_slope = np.random.uniform(-40.0, -10.0)
                hes = np.random.uniform(100.0, 400.0)
                spam = float(np.random.poisson(0.5))
                pe = np.random.uniform(0.85, 1.0)
                X_cluster.append([accuracy, rt, acc_slope, rt_slope, hes, spam, pe])
                y.append("Fast Learner")

            # 2. Plateauing (Steady accuracy, steady RT)
            for _ in range(60):
                accuracy = np.random.uniform(0.70, 0.90)
                rt = np.random.uniform(400.0, 800.0)
                acc_slope = np.random.uniform(-0.01, 0.01)
                rt_slope = np.random.uniform(-10.0, 10.0)
                hes = np.random.uniform(300.0, 800.0)
                spam = float(np.random.poisson(1.2))
                pe = np.random.uniform(0.70, 0.90)
                X_cluster.append([accuracy, rt, acc_slope, rt_slope, hes, spam, pe])
                y.append("Plateauing")

            # 3. High Fatigue (Declining accuracy, increasing RT/getting slower)
            for _ in range(60):
                accuracy = np.random.uniform(0.50, 0.80)
                rt = np.random.uniform(600.0, 1200.0)
                acc_slope = np.random.uniform(-0.08, -0.015)
                rt_slope = np.random.uniform(15.0, 60.0)
                hes = np.random.uniform(700.0, 1800.0)
                spam = float(np.random.poisson(3.5))
                pe = np.random.uniform(0.40, 0.70)
                X_cluster.append([accuracy, rt, acc_slope, rt_slope, hes, spam, pe])
                y.append("High Fatigue")

            X_cluster = np.array(X_cluster)
            X_classifier = X_cluster[:, :4]
            y = np.array(y)

            # Fit Scaler
            from sklearn.preprocessing import StandardScaler
            self.scaler = StandardScaler()
            X_cluster_scaled = self.scaler.fit_transform(X_cluster)

            # Fit KMeans
            from sklearn.cluster import KMeans
            self.clustering_model = KMeans(n_clusters=3, random_state=42, n_init=10)
            self.clustering_model.fit(X_cluster_scaled)

            # Train the Scikit-Learn Random Forest Classifier
            self.model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
            self.model.fit(X_classifier, y)
            print("[ML Model Service] Random Forest Longitudinal Classifier trained successfully.")

            # Save the trained models to disk
            dir_path = os.path.dirname(__file__) if '__file__' in globals() else ''
            model_path = os.path.join(dir_path, 'cognitive_model.pkl')
            cluster_path = os.path.join(dir_path, 'clustering_model.pkl')
            scaler_path = os.path.join(dir_path, 'scaler.pkl')

            with open(model_path, 'wb') as f:
                pickle.dump(self.model, f)
            with open(cluster_path, 'wb') as f:
                pickle.dump(self.clustering_model, f)
            with open(scaler_path, 'wb') as f:
                pickle.dump(self.scaler, f)
            print("[ML Model Service] Models serialized successfully.")
        except Exception as e:
            print(f"[ML Model Service] Error training Random Forest Model: {e}. Reverting to rule-based engine.")
            self.model = None
            self.clustering_model = None
            self.scaler = None

    def predict(self, avg_accuracy, avg_rt_ms, acc_slope, rt_slope):
        """
        Predicts player longitudinal archetype based on session averages and slopes.
        Returns a dict: {"archetype": str, "confidence_score": float}
        """
        # If the ML model is successfully trained
        if SKLEARN_AVAILABLE and self.model is not None:
            try:
                features = [[avg_accuracy, avg_rt_ms, acc_slope, rt_slope]]
                prediction = self.model.predict(features)[0]
                probabilities = self.model.predict_proba(features)[0]
                class_index = list(self.model.classes_).index(prediction)
                confidence = float(probabilities[class_index])
                
                # Hybrid Clinical Safety Net: Overrides class-imbalance classifier bias for extreme outliers
                if (avg_rt_ms > 10000.0 and avg_accuracy < 0.35) or (avg_accuracy < 0.25):
                    prediction = "High Fatigue"
                    confidence = max(confidence, 0.80)
                elif avg_accuracy > 0.90 and avg_rt_ms < 500.0:
                    prediction = "Fast Learner"
                    confidence = max(confidence, 0.85)
                    
                return {
                    "archetype": prediction,
                    "confidence_score": round(confidence, 2)
                }
            except Exception as e:
                print(f"[ML Model Service] Inference failed, using fallback rules: {e}")

        # Fallback Heuristics (Deterministic Heuristic Engine)
        if acc_slope > 0.01 and rt_slope < -10.0:
            return {"archetype": "Fast Learner", "confidence_score": 0.85}
        elif acc_slope < -0.01 and rt_slope > 10.0:
            return {"archetype": "High Fatigue", "confidence_score": 0.80}
        else:
            return {"archetype": "Plateauing", "confidence_score": 0.75}

# Instantiate the global model instance
archetype_classifier = ArchetypeModel()

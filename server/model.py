"""
================================================================================
Chapter 2 Methodology Compliance: Software Engineering Architecture Patterns
- Pattern: Strategy Pattern / Machine Learning Prediction Service
- Component: Classifier Model (Service Layer)
- Model: Scikit-Learn RandomForestClassifier
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
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

class ArchetypeModel:
    def __init__(self):
        self.model = None
        self.is_loaded_from_disk = False
        if SKLEARN_AVAILABLE:
            model_path = os.path.join(os.path.dirname(__file__), 'cognitive_model.pkl') if '__file__' in globals() else 'cognitive_model.pkl'
            if os.path.exists(model_path):
                try:
                    with open(model_path, 'rb') as f:
                        self.model = pickle.load(f)
                    self.is_loaded_from_disk = True
                    print("[ML Model Service] Pre-trained RandomForestClassifier loaded successfully from cognitive_model.pkl")
                except Exception as e:
                    print(f"[ML Model Service] Failed to load cognitive_model.pkl: {e}. Retraining...")
                    self.train_model()
            else:
                self.train_model()
        else:
            print("[ML Model Service] scikit-learn not available. Falling back to rule-based engine.")

    def train_model(self):
        try:
            # Generate synthetic datasets for 3 longitudinal archetypes
            np.random.seed(42)
            X = []
            y = []

            # 1. Fast Learner (Improving accuracy, decreasing RT/getting faster)
            for _ in range(60):
                accuracy = np.random.uniform(0.80, 1.0)
                rt = np.random.uniform(200.0, 600.0)
                acc_slope = np.random.uniform(0.015, 0.08)
                rt_slope = np.random.uniform(-40.0, -10.0)
                X.append([accuracy, rt, acc_slope, rt_slope])
                y.append("Fast Learner")

            # 2. Plateauing (Steady accuracy, steady RT)
            for _ in range(60):
                accuracy = np.random.uniform(0.70, 0.90)
                rt = np.random.uniform(400.0, 800.0)
                acc_slope = np.random.uniform(-0.01, 0.01)
                rt_slope = np.random.uniform(-10.0, 10.0)
                X.append([accuracy, rt, acc_slope, rt_slope])
                y.append("Plateauing")

            # 3. High Fatigue (Declining accuracy, increasing RT/getting slower)
            for _ in range(60):
                accuracy = np.random.uniform(0.50, 0.80)
                rt = np.random.uniform(600.0, 1200.0)
                acc_slope = np.random.uniform(-0.08, -0.015)
                rt_slope = np.random.uniform(15.0, 60.0)
                X.append([accuracy, rt, acc_slope, rt_slope])
                y.append("High Fatigue")

            # Train the Scikit-Learn Random Forest Classifier
            self.model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
            self.model.fit(X, y)
            print("[ML Model Service] Random Forest Longitudinal Classifier trained successfully.")
            # Save the trained model to disk for future boot speedups
            model_path = os.path.join(os.path.dirname(__file__), 'cognitive_model.pkl') if '__file__' in globals() else 'cognitive_model.pkl'
            with open(model_path, 'wb') as f:
                pickle.dump(self.model, f)
            print(f"[ML Model Service] Model serialized to {model_path} successfully.")
        except Exception as e:
            print(f"[ML Model Service] Error training Random Forest Model: {e}. Reverting to rule-based engine.")
            self.model = None

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

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

# Try importing scikit-learn
try:
    from sklearn.ensemble import RandomForestClassifier
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

class ArchetypeModel:
    def __init__(self):
        self.model = None
        if SKLEARN_AVAILABLE:
            self.train_model()
        else:
            print("[ML Model Service] scikit-learn not available. Falling back to rule-based engine.")

    def train_model(self):
        try:
            # Generate synthetic datasets for 3 archetypes
            np.random.seed(42)
            X = []
            y = []

            # 1. Advanced (High speed, high accuracy, low error)
            for _ in range(60):
                accuracy = np.random.uniform(0.91, 1.0)
                rt = np.random.uniform(180.0, 420.0)
                error_rate = 1.0 - accuracy
                X.append([accuracy, rt, error_rate])
                y.append("Advanced")

            # 2. Intermediate (Medium speed, medium accuracy, medium error)
            for _ in range(60):
                accuracy = np.random.uniform(0.70, 0.90)
                rt = np.random.uniform(420.0, 780.0)
                error_rate = 1.0 - accuracy
                X.append([accuracy, rt, error_rate])
                y.append("Intermediate")

            # 3. Beginner (Slow speed, low accuracy, high error)
            for _ in range(60):
                accuracy = np.random.uniform(0.30, 0.69)
                rt = np.random.uniform(780.0, 1600.0)
                error_rate = 1.0 - accuracy
                X.append([accuracy, rt, error_rate])
                y.append("Beginner")

            # Train the Scikit-Learn Random Forest Classifier
            self.model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
            self.model.fit(X, y)
            print("[ML Model Service] Random Forest Classifier successfully trained on synthetic cohort.")
        except Exception as e:
            print(f"[ML Model Service] Error training Random Forest Model: {e}. Reverting to rule-based engine.")
            self.model = None

    def predict(self, avg_accuracy, avg_rt_ms, error_rate):
        """
        Predicts player archetype based on performance metrics.
        Returns a dict: {"archetype": str, "confidence_score": float}
        """
        # If the ML model is successfully trained
        if SKLEARN_AVAILABLE and self.model is not None:
            try:
                features = [[avg_accuracy, avg_rt_ms, error_rate]]
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
        # Matches the boundaries of the synthetic dataset
        if avg_accuracy >= 0.90 and avg_rt_ms <= 450:
            return {"archetype": "Advanced", "confidence_score": 0.85}
        elif avg_accuracy >= 0.70 and avg_rt_ms <= 800:
            return {"archetype": "Intermediate", "confidence_score": 0.75}
        else:
            return {"archetype": "Beginner", "confidence_score": 0.70}

# Instantiate the global model instance
archetype_classifier = ArchetypeModel()

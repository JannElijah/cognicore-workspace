import os
import sys
import subprocess
import pickle

def run_tuning_tests():
    print("=== Step 1: Running train_model.py ===")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    train_model_path = os.path.join(script_dir, "train_model.py")
    try:
        res = subprocess.run([sys.executable, train_model_path], cwd=script_dir, capture_output=True, text=True, check=True)
        print("Script stdout:")
        print(res.stdout)
    except subprocess.CalledProcessError as e:
        print("FAILED: Model training raised process error")
        print("stderr:")
        print(e.stderr)
        sys.exit(1)
        
    print("\n=== Step 2: Verifying Serialized Model Asset ===")
    model_path = os.path.join(script_dir, "cognitive_model.pkl")
    if not os.path.exists(model_path):
        print(f"FAILED: Pre-trained model file not found: {model_path}")
        sys.exit(1)
        
    size = os.path.getsize(model_path)
    print(f"  OK   Found pre-trained model: {model_path} ({size} bytes)")
    
    # Load and check model contents
    try:
        with open(model_path, 'rb') as f:
            clf = pickle.load(f)
        print(f"  OK   Deserialized model successfully. Classes: {clf.classes_}")
    except Exception as e:
        print(f"FAILED: Model deserialization error: {e}")
        sys.exit(1)
        
    print("\n=== Step 3: Verifying backend loader initialization ===")
    # Remove cached modules if any to force reimport
    if "model" in sys.modules:
        del sys.modules["model"]
        
    try:
        from model import archetype_classifier
        print("Imported archetype_classifier successfully.")
        
        # Check loading flag
        if not hasattr(archetype_classifier, "is_loaded_from_disk"):
            print("FAILED: archetype_classifier does not have is_loaded_from_disk attribute")
            sys.exit(1)
            
        if not archetype_classifier.is_loaded_from_disk:
            print("FAILED: archetype_classifier did not load the pre-trained model from disk")
            sys.exit(1)
            
        print("  OK   archetype_classifier successfully loaded RandomForest from disk!")
    except Exception as e:
        print(f"FAILED: Backend model loader import error: {e}")
        sys.exit(1)
        
    print("\n=== Step 4: Running Inference Assertions ===")
    # 1. Test Improving metrics
    res_fast = archetype_classifier.predict(0.95, 300.0, 0.06, -80.0)
    print(f"  Fast Learner prediction output: {res_fast}")
    assert res_fast["archetype"] == "Fast Learner"
    assert "confidence_score" in res_fast
    
    # 2. Test Fatiguing metrics
    res_fatigue = archetype_classifier.predict(0.20, 25000.0, -0.06, 80.0)
    print(f"  High Fatigue prediction output: {res_fatigue}")
    assert res_fatigue["archetype"] == "High Fatigue"
    assert "confidence_score" in res_fatigue
    
    # 3. Test Plateauing metrics
    res_plat = archetype_classifier.predict(0.50, 1000.0, 0.0, 0.0)
    print(f"  Plateauing prediction output: {res_plat}")
    assert res_plat["archetype"] == "Plateauing"
    assert "confidence_score" in res_plat
    
    print("\n=== SUCCESS: Model retraining, serialization, and deserialization verified perfectly! ===")

if __name__ == "__main__":
    run_tuning_tests()

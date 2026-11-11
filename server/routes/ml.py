import hmac
import logging
import os
import threading
import time

from flask import Blueprint, jsonify, request
from auth import admin_required
from database import get_db_connection
from extensions import limiter
from game_utils import calculate_ols_slope
from model import archetype_classifier, SKLEARN_AVAILABLE

logger = logging.getLogger(__name__)

# Global model training state tracking
model_training_lock = threading.Lock()
model_training_state = {
    "status": "idle",  # "idle", "training", "error"
    "error_message": None,
    "last_trained_at": None,
    "last_retrain_metrics": None,
}

ml_bp = Blueprint('ml_bp', __name__)


@ml_bp.route('/api/model/status', methods=['GET'])
def model_status():
    with model_training_lock:
        payload = dict(model_training_state)
    payload["training_status"] = payload["status"]
    payload["training_error"] = payload["error_message"]
    return jsonify(payload), 200


@ml_bp.route('/api/model/retrain', methods=['POST'])
@limiter.limit("10 per minute")
def retrain_model():
    cron_secret = os.environ.get("CRON_SECRET")
    provided_secret = (
        request.headers.get("X-Cron-Secret")
        or request.headers.get("Cron-Secret")
        or ""
    )

    if not cron_secret:
        return jsonify({"status": "error", "message": "CRON_SECRET environment variable is not configured."}), 500

    if not hmac.compare_digest(provided_secret, cron_secret):
        return jsonify({"status": "error", "message": "Unauthorized. Invalid Cron-Secret."}), 401

    with model_training_lock:
        if model_training_state["status"] == "training":
            return jsonify({"status": "error", "message": "Model retraining is already in progress."}), 400
        model_training_state["status"] = "training"
        model_training_state["error_message"] = None

    def run_training():
        try:
            from train_model import train_retargeted_classifier
            res = train_retargeted_classifier()
            if isinstance(res, dict) and res.get("status") == "success":
                # Reload classifier instance to fetch newly serialized pickle files
                archetype_classifier.reload_models()
                with model_training_lock:
                    model_training_state["status"] = "idle"
                    model_training_state["last_trained_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
                    model_training_state["last_retrain_metrics"] = res
            else:
                with model_training_lock:
                    model_training_state["status"] = "error"
                    model_training_state["error_message"] = (
                        "Model retraining pipeline completed with error or insufficient data samples."
                    )
        except Exception as e:
            with model_training_lock:
                model_training_state["status"] = "error"
                model_training_state["error_message"] = str(e)

    threading.Thread(target=run_training, daemon=True).start()
    return jsonify({"status": "success", "message": "Model retraining started in background."}), 202

@ml_bp.route('/api/model/clusters', methods=['GET'])
def get_model_clusters():
    try:
        import numpy as np
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            query = """
                SELECT 
                    gs.id AS session_id,
                    u.username,
                    gs.game_type,
                    AVG(pm.accuracy_rate) AS avg_acc,
                    AVG(pm.reaction_time) AS avg_rt,
                    AVG(pm.hesitation_ms) AS avg_hes,
                    AVG(pm.spam_click_count) AS avg_spam,
                    AVG(pm.rule_shift_latency_ms) AS avg_rule,
                    AVG(pm.path_efficiency) AS avg_path
                FROM game_sessions gs
                JOIN users u ON gs.user_id = u.id
                JOIN performance_metrics pm ON gs.id = pm.session_id
                GROUP BY gs.id, u.username, gs.game_type
                ORDER BY gs.id ASC
            """
            cursor.execute(query)
            rows = cursor.fetchall()
        finally:
            conn.close()

        user_sessions = {}
        for r in rows:
            uname = r["username"]
            if uname not in user_sessions:
                user_sessions[uname] = []
            user_sessions[uname].append(r)

        data_points = []
        X_features = []

        for uname, sessions in user_sessions.items():
            history_acc = []
            history_rt = []
            for s in sessions:
                avg_acc = float(s["avg_acc"]) if s["avg_acc"] is not None else 0.0
                avg_rt = float(s["avg_rt"]) if s["avg_rt"] is not None else 0.0
                history_acc.append(avg_acc)
                history_rt.append(avg_rt)

                acc_slope = calculate_ols_slope(history_acc[-20:])
                rt_slope = calculate_ols_slope(history_rt[-20:])

                avg_hes = float(s["avg_hes"]) if s["avg_hes"] is not None else 0.0
                avg_spam = float(s["avg_spam"]) if s["avg_spam"] is not None else 0.0
                avg_path = float(s["avg_path"]) if s["avg_path"] is not None else 1.0

                feature_vector = [avg_acc, avg_rt, acc_slope, rt_slope, avg_hes, avg_spam, avg_path]
                X_features.append(feature_vector)

                data_points.append({
                    "session_id": s["session_id"],
                    "username": uname,
                    "game_type": s["game_type"],
                    "accuracy": round(avg_acc, 4),
                    "reaction_time": round(avg_rt, 2),
                    "acc_slope": round(acc_slope, 4),
                    "rt_slope": round(rt_slope, 2),
                    "hesitation": round(avg_hes, 2),
                    "spam_clicks": round(avg_spam, 2),
                    "path_efficiency": round(avg_path, 4)
                })

        if not data_points:
            return jsonify({"status": "success", "data_points": []}), 200

        if SKLEARN_AVAILABLE and archetype_classifier.clustering_model is not None and archetype_classifier.scaler is not None:
            X_arr = np.array(X_features)
            X_scaled = archetype_classifier.scaler.transform(X_arr)
            cluster_labels = archetype_classifier.clustering_model.predict(X_scaled)

            centroids = archetype_classifier.clustering_model.cluster_centers_
            centroids_orig = archetype_classifier.scaler.inverse_transform(centroids)

            cluster_scores = []
            for i in range(3):
                mean_acc = centroids_orig[i][0]
                mean_rt = centroids_orig[i][1]
                score = mean_acc * 1000.0 - mean_rt
                cluster_scores.append((score, i))
            cluster_scores.sort()

            cluster_mapping = {
                cluster_scores[0][1]: "High Fatigue",
                cluster_scores[1][1]: "Steady Improver",
                cluster_scores[2][1]: "Fast Learner"
            }

            for idx, label in enumerate(cluster_labels):
                data_points[idx]["cluster"] = cluster_mapping[label]
        else:
            for dp in data_points:
                acc_slope = dp["acc_slope"]
                rt_slope = dp["rt_slope"]
                if acc_slope > 0.01 and rt_slope < -10.0:
                    dp["cluster"] = "Fast Learner"
                elif acc_slope < -0.01 and rt_slope > 10.0:
                    dp["cluster"] = "High Fatigue"
                else:
                    dp["cluster"] = "Steady Improver"

        return jsonify({
            "status": "success",
            "data_points": data_points
        }), 200
    except Exception as e:
        logger.error(f"Error in get_model_clusters: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500

@ml_bp.route('/api/admin/retrain', methods=['POST'])
@limiter.limit("10 per minute")
@admin_required
def admin_retrain(current_user_id, current_username):
    """
    Dynamically rebuilds the RandomForest, KMeans, and IsolationForest models
    using live database telemetry.
    """
    with model_training_lock:
        if model_training_state["status"] == "training":
            return jsonify({"status": "error", "message": "Model retraining is already in progress."}), 400
        model_training_state["status"] = "training"
        model_training_state["error_message"] = None

    try:
        from train_model import train_retargeted_classifier

        metrics = train_retargeted_classifier()
        if not metrics:
            with model_training_lock:
                model_training_state["status"] = "error"
                model_training_state["error_message"] = "Failed to retrain models. Check database size or logs."
            return jsonify({"status": "error", "message": "Failed to retrain models. Check database size or logs."}), 500

        # Dynamically reload the models in the app memory
        archetype_classifier.reload_models()  # Re-init will pick up new .pkls
        with model_training_lock:
            model_training_state["status"] = "idle"
            model_training_state["last_trained_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
            model_training_state["last_retrain_metrics"] = metrics

        return jsonify(metrics), 200

    except Exception as e:
        with model_training_lock:
            model_training_state["status"] = "error"
            model_training_state["error_message"] = str(e)
        logger.error(f"Error in admin_retrain: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500
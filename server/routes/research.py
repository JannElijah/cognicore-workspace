from flask import Blueprint, jsonify, request, make_response
from auth import token_required
from database import db
import logging
from sqlalchemy import text
from game_utils import safe_float, safe_int, calculate_pearson_r
import datetime
import io

logger = logging.getLogger(__name__)

def get_db_connection():
    import psycopg2
    from psycopg2.extras import RealDictCursor
    import os
    DATABASE_URL = os.environ.get("DATABASE_URL")
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

research_bp = Blueprint('research_bp', __name__)

@research_bp.route('/api/iso-evaluations', methods=['GET'])
def get_iso_evaluations():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, functionality_score, usability_score, reliability_score, efficiency_score, ux_score, created_at FROM iso_evaluations ORDER BY created_at DESC"
        )
        rows = cursor.fetchall()
        
        evaluations = []
        for r in rows:
            evaluations.append({
                "id": r["id"],
                "functionality_score": r["functionality_score"],
                "usability_score": r["usability_score"],
                "reliability_score": r["reliability_score"],
                "efficiency_score": r["efficiency_score"],
                "ux_score": r["ux_score"],
                "created_at": r["created_at"]
            })
            
        return jsonify({
            "status": "success",
            "evaluations": evaluations
        }), 200
        
    except Exception as e:
        logger.error(f"Error in get_iso_evaluations: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@research_bp.route('/api/cohort-db-scores', methods=['GET'])
def get_cohort_db_scores():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Get all users starting with clinical_subject_
        cursor.execute("SELECT id, username FROM users WHERE username LIKE 'clinical_subject_%' ORDER BY username ASC")
        users = cursor.fetchall()
        
        pretest_scores = []
        posttest_scores = []
        
        for u in users:
            uid = u['id']
            # Fetch all performance metrics for this user
            cursor.execute(
                """
                SELECT pm.accuracy_rate 
                FROM performance_metrics pm
                JOIN game_sessions gs ON pm.session_id = gs.id
                WHERE gs.user_id = %s
                ORDER BY gs.start_time ASC, pm.id ASC
                """,
                (uid,)
            )
            rows = cursor.fetchall()
            accuracies = [r['accuracy_rate'] for r in rows]
            
            if len(accuracies) >= 10:
                # Pretest is average of first 5 rounds (Session 1)
                pre_avg = sum(accuracies[:5]) / 5.0 * 100
                # Posttest is average of last 5 rounds (Session 8)
                post_avg = sum(accuracies[-5:]) / 5.0 * 100
                
                pretest_scores.append(round(pre_avg, 1))
                posttest_scores.append(round(post_avg, 1))
            elif len(accuracies) > 0:
                # Fallback if less than 10
                pretest_scores.append(round(accuracies[0] * 100, 1))
                posttest_scores.append(round(accuracies[-1] * 100, 1))
        
        return jsonify({
            "status": "success",
            "pretest_scores": pretest_scores,
            "posttest_scores": posttest_scores,
            "count": len(pretest_scores)
        }), 200
        
    except Exception as e:
        logger.error(f"Error in get_cohort_db_scores: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@research_bp.route('/api/export-csv', methods=['GET'])
def export_csv():
    conn = get_db_connection()
    try:
        from flask import Response
        import csv
        import io
        
        cursor = conn.cursor()
        
        query = """
            SELECT 
                pm.id AS metric_id,
                pm.session_id,
                gs.user_id,
                u.username,
                pm.cognitive_domain,
                pm.game_type,
                pm.reaction_time,
                pm.accuracy_rate,
                pm.difficulty_level,
                pm.error_count,
                pm.hesitation_ms,
                pm.spam_click_count,
                pm.rule_shift_latency_ms,
                pm.path_efficiency,
                pm.recorded_at
            FROM performance_metrics pm
            JOIN game_sessions gs ON pm.session_id = gs.id
            JOIN users u ON gs.user_id = u.id
            ORDER BY pm.recorded_at DESC, pm.id DESC
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers matching professor telemetry specifications
        writer.writerow([
            "Metric ID", "Session ID", "User ID", "Username", 
            "Cognitive Domain", "Game Type", "Reaction Time (ms)", 
            "Accuracy Rate", "Difficulty Level", "Error Count", 
            "Hesitation (ms)", "Spam Click Count", "Rule-Shift Latency (ms)", "Path Efficiency", "Timestamp"
        ])
        
        for r in rows:
            writer.writerow([
                r["metric_id"], r["session_id"], r["user_id"], r["username"],
                r["cognitive_domain"], r["game_type"], r["reaction_time"],
                r["accuracy_rate"], r["difficulty_level"], r["error_count"],
                r["hesitation_ms"], r["spam_click_count"], r["rule_shift_latency_ms"], r["path_efficiency"], r["recorded_at"]
            ])
            
        output.seek(0)
        csv_data = output.getvalue()
        
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-disposition": "attachment; filename=cohort_telemetry_report.csv"}
        )
    except Exception as e:
        logger.error(f"Error in export_csv: {e}")
        return jsonify({"status": "error", "message": f"Export failed: {str(e)}"}), 500
    finally:
        conn.close()

@research_bp.route('/api/research/correlations', methods=['GET'])
def get_research_correlations():
    try:
        var1 = request.args.get('var1', 'rule_shift_latency_ms')
        var2 = request.args.get('var2', 'spam_click_count')
        cohort = request.args.get('cohort', 'all')  # 'all', 'clinical', 'active'
        active_username = request.args.get('username', '')

        # Valid numeric variables for correlation matrix comparison
        valid_vars = {
            'reaction_time', 'accuracy_rate', 'difficulty_level', 
            'error_count', 'hesitation_ms', 'spam_click_count', 
            'rule_shift_latency_ms', 'path_efficiency'
        }
        if var1 not in valid_vars or var2 not in valid_vars:
            return jsonify({"status": "error", "message": "Invalid variables selected"}), 400

        conn = get_db_connection()
        try:
            cursor = conn.cursor()

            if cohort == 'active' and active_username:
                query = f"""
                    SELECT pm.{var1}, pm.{var2}, u.username
                    FROM performance_metrics pm
                    JOIN game_sessions gs ON pm.session_id = gs.id
                    JOIN users u ON gs.user_id = u.id
                    WHERE u.username = %s AND pm.{var1} IS NOT NULL AND pm.{var2} IS NOT NULL
                """
                cursor.execute(query, (active_username,))
            elif cohort == 'clinical':
                query = f"""
                    SELECT pm.{var1}, pm.{var2}, u.username
                    FROM performance_metrics pm
                    JOIN game_sessions gs ON pm.session_id = gs.id
                    JOIN users u ON gs.user_id = u.id
                    WHERE u.username LIKE 'clinical_subject_%' AND pm.{var1} IS NOT NULL AND pm.{var2} IS NOT NULL
                """
                cursor.execute(query)
            else:  # all
                query = f"""
                    SELECT pm.{var1}, pm.{var2}, u.username
                    FROM performance_metrics pm
                    JOIN game_sessions gs ON pm.session_id = gs.id
                    JOIN users u ON gs.user_id = u.id
                    WHERE pm.{var1} IS NOT NULL AND pm.{var2} IS NOT NULL
                """
                cursor.execute(query)

            rows = cursor.fetchall()
        finally:
            conn.close()

        x_vals = []
        y_vals = []
        data_points = []

        for r in rows:
            val1 = r[var1]
            val2 = r[var2]
            if val1 is not None and val2 is not None:
                x_vals.append(float(val1))
                y_vals.append(float(val2))
                data_points.append({
                    "x": float(val1),
                    "y": float(val2),
                    "username": r["username"]
                })

        r_coeff, p_value = calculate_pearson_r(x_vals, y_vals)
        r_squared = r_coeff * r_coeff

        abs_r = abs(r_coeff)
        if abs_r >= 0.7:
            magnitude = "strong"
        elif abs_r >= 0.4:
            magnitude = "moderate"
        elif abs_r >= 0.1:
            magnitude = "weak"
        else:
            magnitude = "negligible"

        direction = "positive" if r_coeff >= 0 else "negative"
        interpretation = f"There is a {magnitude} {direction} correlation between {var1.replace('_', ' ')} and {var2.replace('_', ' ')} (r = {r_coeff:.4f}, p = {p_value:.4f})."

        return jsonify({
            "status": "success",
            "var1": var1,
            "var2": var2,
            "cohort": cohort,
            "r": round(r_coeff, 4),
            "r_squared": round(r_squared, 4),
            "p_value": round(p_value, 4),
            "magnitude": magnitude,
            "direction": direction,
            "interpretation": interpretation,
            "data_points": data_points
        }), 200
    except Exception as e:
        logger.error(f"Error in get_research_correlations: {e}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@research_bp.route('/api/research/learning-curves/<username>', methods=['GET'])
def get_learning_curves(username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT gs.user_id, u.username, gs.id AS session_id, gs.start_time,
                   AVG(pm.accuracy_rate) as avg_acc,
                   AVG(pm.reaction_time) as avg_rt
            FROM game_sessions gs
            JOIN users u ON gs.user_id = u.id
            LEFT JOIN performance_metrics pm ON pm.session_id = gs.id
            WHERE u.username = %s OR u.username LIKE 'clinical_subject_%%'
            GROUP BY gs.id, gs.user_id, u.username, gs.start_time
            ORDER BY gs.user_id, gs.start_time ASC
        """, (username,))
        rows = cursor.fetchall()

        user_sessions = {}
        for r in rows:
            uid = r["user_id"]
            if uid not in user_sessions:
                user_sessions[uid] = []
            user_sessions[uid].append({
                "username": r["username"],
                "avg_acc": r["avg_acc"] if r["avg_acc"] is not None else 0.0,
                "avg_rt": r["avg_rt"] if r["avg_rt"] is not None else 0.0
            })

        active_user_curve = []
        clinical_cohort_curves = {}
        all_cohort_curves = {}

        for uid, sessions in user_sessions.items():
            is_active = (sessions[0]["username"] == username) if sessions else False
            is_clinical = sessions[0]["username"].startswith("clinical_subject_") if sessions else False
            
            for idx, s in enumerate(sessions):
                session_num = idx + 1
                
                if is_active:
                    active_user_curve.append({
                        "session_index": session_num,
                        "accuracy": round(s["avg_acc"], 4),
                        "reaction_time": round(s["avg_rt"], 2)
                    })
                
                if is_clinical:
                    if session_num not in clinical_cohort_curves:
                        clinical_cohort_curves[session_num] = []
                    clinical_cohort_curves[session_num].append(s)
                
                if session_num not in all_cohort_curves:
                    all_cohort_curves[session_num] = []
                all_cohort_curves[session_num].append(s)

        clinical_curve = []
        for idx in sorted(clinical_cohort_curves.keys()):
            s_list = clinical_cohort_curves[idx]
            avg_acc = sum(x["avg_acc"] for x in s_list) / len(s_list)
            avg_rt = sum(x["avg_rt"] for x in s_list) / len(s_list)
            clinical_curve.append({
                "session_index": idx,
                "accuracy": round(avg_acc, 4),
                "reaction_time": round(avg_rt, 2)
            })

        all_curve = []
        for idx in sorted(all_cohort_curves.keys()):
            s_list = all_cohort_curves[idx]
            avg_acc = sum(x["avg_acc"] for x in s_list) / len(s_list)
            avg_rt = sum(x["avg_rt"] for x in s_list) / len(s_list)
            all_curve.append({
                "session_index": idx,
                "accuracy": round(avg_acc, 4),
                "reaction_time": round(avg_rt, 2)
            })

        return jsonify({
            "status": "success",
            "username": username,
            "curves": {
                "active_user": active_user_curve,
                "clinical_cohort": clinical_curve,
                "all_cohort": all_curve
            }
        }), 200

    except Exception as e:
        logger.error(f"Error in get_learning_curves: {e}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
    finally:
        conn.close()
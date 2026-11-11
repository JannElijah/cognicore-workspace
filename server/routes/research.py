import csv
import io
import logging
from flask import Blueprint, jsonify, request, Response
from auth import token_required, admin_required, is_admin_user
from database import get_db_connection
from extensions import limiter
from game_utils import safe_int
from utils import compute_paired_ttest_stats, compute_pearson_correlation

logger = logging.getLogger(__name__)


research_bp = Blueprint('research_bp', __name__)

ISO_SCORE_FIELDS = (
    'functionality_score',
    'usability_score',
    'reliability_score',
    'efficiency_score',
    'ux_score',
)


def _parse_iso_likert_score(raw):
    """Parse an integer 1..5 ISO 25010 Likert score, rejecting booleans and non-integers."""
    if raw is None or isinstance(raw, bool):
        return None
    if isinstance(raw, int):
        return raw if 1 <= raw <= 5 else None
    if isinstance(raw, float):
        if not raw.is_integer():
            return None
        val = int(raw)
        return val if 1 <= val <= 5 else None
    if isinstance(raw, str) and raw.strip():
        try:
            fval = float(raw.strip())
        except ValueError:
            return None
        if not fval.is_integer():
            return None
        val = int(fval)
        return val if 1 <= val <= 5 else None
    return None


@research_bp.route('/api/iso-evaluations', methods=['GET', 'POST'])
@token_required
def iso_evaluations(current_user_id, current_username):
    conn = None
    try:
        if request.method == 'POST':
            data = request.get_json() or {}
            missing = [field for field in ISO_SCORE_FIELDS if data.get(field) is None]
            if missing:
                return jsonify({
                    "status": "error",
                    "message": "All scores are required (functionality, usability, reliability, efficiency, ux).",
                }), 400

            scores = []
            for field in ISO_SCORE_FIELDS:
                parsed = _parse_iso_likert_score(data.get(field))
                if parsed is None:
                    return jsonify({
                        "status": "error",
                        "message": f"Invalid {field}: must be an integer between 1 and 5.",
                    }), 400
                scores.append(parsed)

            conn = get_db_connection()
            with conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO iso_evaluations
                    (functionality_score, usability_score, reliability_score, efficiency_score, ux_score)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    tuple(scores),
                )

            return jsonify({
                "status": "success",
                "message": "ISO 25010 evaluation recorded successfully.",
            }), 201

        limit = max(1, min(safe_int(request.args.get('limit'), 100), 500))
        offset = max(0, safe_int(request.args.get('offset'), 0))
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, functionality_score, usability_score, reliability_score, efficiency_score, ux_score, created_at FROM iso_evaluations ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (limit, offset),
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
                "created_at": r["created_at"],
            })

        return jsonify({
            "status": "success",
            "evaluations": evaluations,
        }), 200

    except Exception as e:
        logger.error(f"Error in iso_evaluations: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500
    finally:
        if conn is not None:
            conn.close()


@research_bp.route('/api/iso-evaluations/summary', methods=['GET'])
@token_required
def get_iso_evaluations_summary(current_user_id, current_username):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                AVG(functionality_score) as avg_func,
                AVG(usability_score) as avg_usab,
                AVG(reliability_score) as avg_rel,
                AVG(efficiency_score) as avg_eff,
                AVG(ux_score) as avg_ux,
                COUNT(*) as count
            FROM iso_evaluations
            """
        )
        row = cursor.fetchone()

        count = int(row["count"] or 0) if row else 0
        if row and count > 0:
            summary = {
                "avg_functionality": round(float(row["avg_func"] or 0.0), 2),
                "avg_usability": round(float(row["avg_usab"] or 0.0), 2),
                "avg_reliability": round(float(row["avg_rel"] or 0.0), 2),
                "avg_efficiency": round(float(row["avg_eff"] or 0.0), 2),
                "avg_ux": round(float(row["avg_ux"] or 0.0), 2),
                "count": count,
            }
        else:
            summary = {
                "avg_functionality": 0.0,
                "avg_usability": 0.0,
                "avg_reliability": 0.0,
                "avg_efficiency": 0.0,
                "avg_ux": 0.0,
                "count": 0,
            }

        return jsonify({
            "status": "success",
            "summary": summary,
        }), 200

    except Exception as e:
        logger.error(f"Error in get_iso_evaluations_summary: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500
    finally:
        if conn is not None:
            conn.close()

@research_bp.route('/api/cohort-db-scores', methods=['GET'])
@token_required
def get_cohort_db_scores(current_user_id, current_username):
    limit = max(1, min(safe_int(request.args.get('limit'), 50), 500))
    offset = max(0, safe_int(request.args.get('offset'), 0))
    cache_key = f"cognicore:cohort_db_scores_{limit}_{offset}"
    
    import redis
    import json
    import os
    redis_url = os.environ.get("REDIS_URL", "memory://")
    redis_client = None
    if redis_url != "memory://":
        try:
            redis_client = redis.from_url(redis_url)
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return jsonify(json.loads(cached_data)), 200
        except Exception:
            pass
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Get all users starting with clinical_subject_
        cursor.execute("SELECT id, username FROM users WHERE username LIKE 'clinical_subject_%%' ORDER BY username ASC LIMIT %s OFFSET %s", (limit, offset))
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
        
        
        response_data = {
            "status": "success",
            "pretest_scores": pretest_scores,
            "posttest_scores": posttest_scores,
            "count": len(pretest_scores)
        }
        if redis_client:
            try:
                redis_client.setex(cache_key, 900, json.dumps(response_data))
            except Exception:
                pass
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Error in get_cohort_db_scores: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500
    finally:
        conn.close()

@research_bp.route('/api/research/cohort-data', methods=['GET'])
@token_required
def get_overall_cohort_data(current_user_id, current_username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Total Participants and PWD distribution
        cursor.execute("SELECT pwd_status FROM users")
        users = cursor.fetchall()
        total_participants = len(users)
        
        pwd_distribution = {}
        for u in users:
            status = u['pwd_status'] or 'None'
            pwd_distribution[status] = pwd_distribution.get(status, 0) + 1
            
        # Average Pre/Post Scores (all assessments + paired per-user overall averages)
        cursor.execute(
            """
            SELECT user_id, assessment_type, spatial_visual_score, logical_math_score, attention_score, executive_score
            FROM cognitive_assessments
            ORDER BY completed_at ASC, id ASC
            """
        )
        assessments = cursor.fetchall()

        pre_scores = {"sv": 0, "lm": 0, "at": 0, "ex": 0, "count": 0}
        post_scores = {"sv": 0, "lm": 0, "at": 0, "ex": 0, "count": 0}
        latest_pre_by_user = {}
        latest_post_by_user = {}

        for a in assessments:
            sv = a['spatial_visual_score'] or 0
            lm = a['logical_math_score'] or 0
            at = a['attention_score'] or 0
            ex = a['executive_score'] or 0
            overall_score = (sv + lm + at + ex) / 4.0

            if a['assessment_type'] == 'pre-test':
                pre_scores['sv'] += sv
                pre_scores['lm'] += lm
                pre_scores['at'] += at
                pre_scores['ex'] += ex
                pre_scores['count'] += 1
                latest_pre_by_user[a['user_id']] = overall_score
            elif a['assessment_type'] == 'post-test':
                post_scores['sv'] += sv
                post_scores['lm'] += lm
                post_scores['at'] += at
                post_scores['ex'] += ex
                post_scores['count'] += 1
                latest_post_by_user[a['user_id']] = overall_score

        def get_avg(data):
            if data['count'] == 0:
                return {"sv": 0, "lm": 0, "at": 0, "ex": 0, "overall": 0}
            sv = data['sv'] / data['count']
            lm = data['lm'] / data['count']
            at = data['at'] / data['count']
            ex = data['ex'] / data['count']
            overall = (sv + lm + at + ex) / 4.0
            return {
                "sv": round(sv, 2),
                "lm": round(lm, 2),
                "at": round(at, 2),
                "ex": round(ex, 2),
                "overall": round(overall, 2),
            }

        avg_pre = get_avg(pre_scores)
        avg_post = get_avg(post_scores)
        mean_shift = (
            round(avg_post['overall'] - avg_pre['overall'], 2)
            if pre_scores['count'] > 0 and post_scores['count'] > 0
            else None
        )

        paired_uids = sorted(set(latest_pre_by_user.keys()) & set(latest_post_by_user.keys()))
        paired_pre = [latest_pre_by_user[uid] for uid in paired_uids]
        paired_post = [latest_post_by_user[uid] for uid in paired_uids]
        paired_stats = compute_paired_ttest_stats(paired_pre, paired_post)

        cursor.execute(
            """
            SELECT
                COUNT(*) AS count,
                AVG((functionality_score + usability_score + reliability_score + efficiency_score + ux_score) / 5.0) AS overall_mean
            FROM iso_evaluations
            """
        )
        iso_row = cursor.fetchone()
        iso_count = int(iso_row['count']) if iso_row and iso_row['count'] else 0
        iso_overall_mean = (
            round(float(iso_row['overall_mean']), 2)
            if iso_count > 0 and iso_row['overall_mean'] is not None
            else None
        )

        return jsonify({
            "status": "success",
            "total_participants": total_participants,
            "pwd_distribution": pwd_distribution,
            "avg_pre_scores": avg_pre,
            "avg_post_scores": avg_post,
            "pre_test_count": pre_scores['count'],
            "post_test_count": post_scores['count'],
            "mean_shift": mean_shift,
            "statistics": {
                "paired_sample_size": paired_stats["sample_size"],
                "paired_mean_shift": paired_stats["mean_shift"],
                "paired_improvement_pct": paired_stats["improvement_pct"],
                "t_statistic": paired_stats["t_statistic"],
                "p_value": paired_stats["p_value"],
                "cohens_d": paired_stats["cohens_d"],
                "effect_size_magnitude": paired_stats["effect_size_magnitude"],
                "statistically_significant": paired_stats["statistically_significant"],
            },
            "iso_summary": {
                "count": iso_count,
                "overall_mean": iso_overall_mean,
            },
        }), 200
        
    except Exception as e:
        logger.error(f"Error in get_overall_cohort_data: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500
    finally:
        conn.close()

@research_bp.route('/api/export-csv', methods=['GET'])
@limiter.limit("20 per minute")
@admin_required
def export_csv(current_user_id, current_username):
    def _serialize_csv_rows(rows):
        output = io.StringIO()
        writer = csv.writer(output)
        for r in rows:
            writer.writerow([
                r["metric_id"], r["session_id"], r["user_id"], r["username"],
                r["cognitive_domain"], r["game_type"], r["reaction_time"],
                r["accuracy_rate"], r["difficulty_level"], r["error_count"],
                r["hesitation_ms"], r["spam_click_count"], r["rule_shift_latency_ms"],
                r["path_efficiency"], r["recorded_at"],
            ])
        return output.getvalue()

    def generate():
        conn = None
        cursor = None
        was_autocommit = None
        had_error = False
        try:
            conn = get_db_connection()
            if getattr(conn, "autocommit", None) is True:
                was_autocommit = True
                conn.autocommit = False

            # Use a named server-side cursor on Postgres to prevent memory exhaustion on massive tables
            try:
                cursor = conn.cursor(name="csv_export_cursor")
            except TypeError:
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

            header_output = io.StringIO()
            header_writer = csv.writer(header_output)
            header_writer.writerow([
                "Metric ID", "Session ID", "User ID", "Username",
                "Cognitive Domain", "Game Type", "Reaction Time (ms)",
                "Accuracy Rate", "Difficulty Level", "Error Count",
                "Hesitation (ms)", "Spam Click Count", "Rule-Shift Latency (ms)",
                "Path Efficiency", "Timestamp",
            ])
            yield header_output.getvalue()

            fetchmany_fn = getattr(cursor, "fetchmany", None)
            if callable(fetchmany_fn):
                while True:
                    rows = fetchmany_fn(1000)
                    if not rows:
                        break
                    yield _serialize_csv_rows(rows)
            else:
                rows = cursor.fetchall()
                if rows:
                    yield _serialize_csv_rows(rows)

        except Exception as e:
            had_error = True
            logger.error(f"Error in export_csv stream: {e}")
            if conn is not None and was_autocommit:
                try:
                    conn.rollback()
                except Exception:
                    pass
        finally:
            if cursor is not None:
                try:
                    cursor.close()
                except Exception:
                    pass
            if conn is not None:
                if was_autocommit:
                    if not had_error:
                        try:
                            conn.commit()
                        except Exception:
                            pass
                    try:
                        conn.autocommit = True
                    except Exception:
                        pass
                try:
                    conn.close()
                except Exception:
                    pass

    return Response(
        generate(),
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=cohort_telemetry_report.csv"}
    )

@research_bp.route('/api/research/correlations', methods=['GET'])
@token_required
def get_research_correlations(current_user_id, current_username):
    try:
        is_admin = is_admin_user(current_user_id, current_username)
        var1 = request.args.get('var1', 'rule_shift_latency_ms')
        var2 = request.args.get('var2', 'spam_click_count')
        cohort = request.args.get('cohort', 'all')  # 'all', 'clinical', 'active'
        active_username = request.args.get('username', '')

        if cohort == 'active' and active_username and active_username != current_username and not is_admin:
            return jsonify({"status": "error", "message": "Forbidden: you can only inspect your own active correlation data."}), 403

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
            
            base_select = f"""
                SELECT 
                    pm.{var1} AS val1, 
                    pm.{var2} AS val2, 
                    u.username
                FROM performance_metrics pm
                JOIN game_sessions gs ON pm.session_id = gs.id
                JOIN users u ON gs.user_id = u.id
                WHERE pm.{var1} IS NOT NULL AND pm.{var2} IS NOT NULL
            """

            if cohort == 'active' and active_username:
                query = base_select + " AND u.username = %s"
                cursor.execute(query, (active_username,))
            elif cohort == 'clinical':
                query = base_select + " AND u.username LIKE 'clinical_subject_%'"
                cursor.execute(query)
            else:  # all
                query = base_select
                cursor.execute(query)

            rows = cursor.fetchall()
        finally:
            conn.close()

        data_points = []
        xs = []
        ys = []
        for r in rows:
            x_val = float(r['val1'])
            y_val = float(r['val2'])
            xs.append(x_val)
            ys.append(y_val)
            point_username = r["username"] if (is_admin or r["username"] == current_username) else "participant"
            data_points.append({
                "x": x_val,
                "y": y_val,
                "username": point_username
            })

        r_coeff, p_value = compute_pearson_correlation(xs, ys)

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
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500

@research_bp.route('/api/research/learning-curves/<username>', methods=['GET'])
@token_required
def get_learning_curves(current_user_id, current_username, username):
    if username in ["player_one", "", None]:
        username = current_username
    if current_username != username and not is_admin_user(current_user_id, current_username):
        return jsonify({"status": "error", "message": "Unauthorized: you can only view your own learning curves"}), 403

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
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500
    finally:
        conn.close()
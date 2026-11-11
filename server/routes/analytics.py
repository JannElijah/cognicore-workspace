from flask import Blueprint, jsonify, request
from auth import token_required, is_admin_user
from database import db, get_db_connection
import logging
from sqlalchemy import text
from game_utils import safe_float, safe_int, get_domain_for_game
from utils import compute_paired_ttest_stats

DOMAIN_NAMES = {
    "reflexes_and_focus": "Reflexes & Focus",
    "spatial_visual_memory": "Spatial-Visual Memory",
    "executive_strategy": "Executive Strategy",
    "logical_mathematical": "Logical-Mathematical",
}

# Recommended active game title per domain (aligned with active lobby games and assessments)
DOMAIN_GAME_MAP = {
    "reflexes_and_focus": "Speed Tap",
    "spatial_visual_memory": "Matrix Recall",
    "executive_strategy": "Priority Queue",
    "logical_mathematical": "Equation Balance",
}

logger = logging.getLogger(__name__)



analytics_bp = Blueprint('analytics_bp', __name__)

@analytics_bp.route('/api/user-analytics/<username>', methods=['GET'])
@token_required
def get_user_analytics(current_user_id, current_username, username):
    if username in ['player_one', '', None]:
        username = current_username
    if current_username != username:
        return jsonify({'status': 'error', 'message': 'Unauthorized: you can only view your own analytics'}), 403

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        target_uid = user['id']

        cursor.execute("""
            SELECT performance_metrics.cognitive_domain AS cognitive_domain,
                   COALESCE(performance_metrics.game_type, game_sessions.game_type) AS game_type,
                   AVG(accuracy_rate) AS avg_accuracy,
                   AVG(reaction_time) AS avg_rt,
                   COUNT(*) AS metric_count
            FROM performance_metrics
            JOIN game_sessions ON performance_metrics.session_id = game_sessions.id
            WHERE game_sessions.user_id = %s
            GROUP BY performance_metrics.cognitive_domain, COALESCE(performance_metrics.game_type, game_sessions.game_type)
        """, (target_uid,))
        domain_stats = cursor.fetchall()

        cursor.execute("""
            SELECT date(game_sessions.start_time) as day, AVG(accuracy_rate) as avg_accuracy, AVG(reaction_time) as avg_rt
            FROM performance_metrics JOIN game_sessions ON performance_metrics.session_id = game_sessions.id
            WHERE game_sessions.user_id = %s GROUP BY date(game_sessions.start_time) ORDER BY day ASC LIMIT 14
        """, (target_uid,))
        timeline_stats = cursor.fetchall()

        cursor.execute(
            "SELECT archetype_name, confidence_score FROM archetype_history WHERE user_id = %s ORDER BY timestamp DESC, id DESC LIMIT 1",
            (target_uid,),
        )
        latest_archetype_row = cursor.fetchone()

        cursor.execute("""
            SELECT game_sessions.id, game_sessions.game_type, game_sessions.start_time,
                   COALESCE(AVG(performance_metrics.accuracy_rate), 0.0) as accuracy_rate,
                   COALESCE(AVG(performance_metrics.reaction_time), 0.0) as reaction_time,
                   COALESCE(MAX(performance_metrics.difficulty_level), 1) as difficulty_level
            FROM game_sessions
            LEFT JOIN performance_metrics ON game_sessions.id = performance_metrics.session_id
            WHERE game_sessions.user_id = %s
            GROUP BY game_sessions.id, game_sessions.game_type, game_sessions.start_time
            ORDER BY game_sessions.start_time DESC
            LIMIT 5
        """, (target_uid,))
        recent_activity_rows = cursor.fetchall()

        cursor.execute("""
            SELECT COUNT(DISTINCT game_sessions.id) as total_games,
                   COALESCE(MAX(performance_metrics.difficulty_level), 1) as highest_level,
                   COALESCE(AVG(performance_metrics.accuracy_rate), 0.0) as overall_accuracy
            FROM game_sessions
            LEFT JOIN performance_metrics ON game_sessions.id = performance_metrics.session_id
            WHERE game_sessions.user_id = %s
        """, (target_uid,))
        kpi_row = cursor.fetchone()

        cursor.execute("SELECT xp, level, coins FROM user_profiles WHERE user_id = %s", (target_uid,))
        prof_row = cursor.fetchone()

        cursor.execute("SELECT current_streak, longest_streak FROM user_streaks WHERE user_id = %s", (target_uid,))
        streak_row = cursor.fetchone()
    finally:
        conn.close()

    kpis = {
        "total_games": kpi_row["total_games"] if kpi_row and kpi_row["total_games"] else 0,
        "highest_level": kpi_row["highest_level"] if kpi_row and kpi_row["highest_level"] else 1,
        "overall_accuracy": float(kpi_row["overall_accuracy"]) if kpi_row and kpi_row["overall_accuracy"] else 0.0
    }

    user_profile = {
        "xp": prof_row["xp"] if prof_row and prof_row["xp"] is not None else 0,
        "level": prof_row["level"] if prof_row and prof_row["level"] is not None else 1,
        "coins": prof_row["coins"] if prof_row and prof_row["coins"] is not None else 0
    }

    streak_info = {
        "current_streak": streak_row["current_streak"] if streak_row and streak_row["current_streak"] is not None else 1,
        "longest_streak": streak_row["longest_streak"] if streak_row and streak_row["longest_streak"] is not None else 1
    }

    domain_agg = {}
    for row in domain_stats:
        dom = row["cognitive_domain"] or get_domain_for_game(row["game_type"], default=None)
        if not dom:
            continue
        cnt = row["metric_count"] or 0
        acc = float(row["avg_accuracy"] or 0.0)
        rt = float(row["avg_rt"] or 0.0)
        bucket = domain_agg.setdefault(dom, {"acc_sum": 0.0, "rt_sum": 0.0, "count": 0})
        bucket["acc_sum"] += acc * cnt
        bucket["rt_sum"] += rt * cnt
        bucket["count"] += cnt

    domain_list = [
        {
            "cognitive_domain": dom,
            "avg_accuracy": bucket["acc_sum"] / bucket["count"],
            "avg_rt": bucket["rt_sum"] / bucket["count"],
        }
        for dom, bucket in domain_agg.items()
        if bucket["count"] > 0
    ]
    top_strength = None
    primary_bottleneck = None
    insight_text = "Play more games to generate your personalized AI coaching insight!"
    recommended_game = None

    if domain_list:
        sorted_domains = sorted(domain_list, key=lambda x: x['avg_accuracy'], reverse=True)
        top_strength = sorted_domains[0]['cognitive_domain']
        primary_bottleneck = sorted_domains[-1]['cognitive_domain']

        domain_names = DOMAIN_NAMES
        domain_game_map = DOMAIN_GAME_MAP

        strength_name = domain_names.get(top_strength, top_strength.replace("_", " ").title())
        bottleneck_name = domain_names.get(primary_bottleneck, primary_bottleneck.replace("_", " ").title())
        recommended_game = domain_game_map.get(primary_bottleneck, "Any Game")

        if sorted_domains[0]['avg_accuracy'] > 0.8 and sorted_domains[-1]['avg_accuracy'] < 0.6:
            insight_text = f"Your {strength_name} is exceptional! However, your {bottleneck_name} is holding you back. I recommend focusing on {recommended_game} for your next 3 sessions to balance your cognitive profile."
        elif sorted_domains[-1]['avg_accuracy'] > 0.8:
            insight_text = f"Outstanding performance across the board! Your {strength_name} is perfectly honed. Try pushing for higher levels in {recommended_game} to keep challenging yourself."
        else:
            insight_text = f"You are building a solid foundation. Let's work on boosting your {bottleneck_name}. Play {recommended_game} today to sharpen those neural pathways!"

    cognitive_profile = None
    if latest_archetype_row or domain_list:
        cognitive_profile = dict(latest_archetype_row) if latest_archetype_row else {"archetype_name": "Unclassified", "confidence_score": 0.0}
        cognitive_profile["top_strength"] = top_strength
        cognitive_profile["primary_bottleneck"] = primary_bottleneck
        cognitive_profile["insight_text"] = insight_text
        cognitive_profile["recommended_game"] = recommended_game

    return jsonify({
        "status": "success",
        "kpis": kpis,
        "user_profile": user_profile,
        "streak": streak_info,
        "domain_stats": domain_list,
        "timeline_stats": [dict(row) for row in timeline_stats],
        "cognitive_profile": cognitive_profile,
        "recent_activity": [dict(row) for row in recent_activity_rows]
    }), 200

@analytics_bp.route('/api/evaluate', methods=['POST'])
@token_required
def run_evaluation(current_user_id, current_username):
    data = request.json or {}

    # Case 1: Custom cohort paired t-test evaluation (Research portal)
    pre_scores = data.get('pretest_scores')
    post_scores = data.get('posttest_scores')
    if pre_scores is not None and post_scores is not None:
        if len(pre_scores) != len(post_scores) or len(pre_scores) < 2:
            return jsonify({"status": "error", "message": "Pretest and posttest cohorts must have the same length (minimum 2)."}), 400
        stats_res = compute_paired_ttest_stats(pre_scores, post_scores)
        significant = stats_res["statistically_significant"]
        return jsonify({
            "status": "success",
            "sample_size": stats_res["sample_size"],
            "mean_pretest": stats_res["mean_pre"],
            "mean_posttest": stats_res["mean_post"],
            "overall_improvement_rate_pct": stats_res["improvement_pct"],
            "t_statistic": stats_res["t_statistic"],
            "p_value": stats_res["p_value"],
            "cohens_d": stats_res["cohens_d"],
            "effect_size_magnitude": stats_res["effect_size_magnitude"],
            "statistically_significant": significant,
            "hypothesis_result": "Reject Null Hypothesis: Significant improvement detected across domains." if significant else "Fail to Reject Null Hypothesis: Improvement is not statistically significant."
        }), 200

    # Case 2: Individual participant evaluation
    username = data.get('username') or current_username

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        user_id = current_user_id
        if username and username != current_username:
            cursor.execute("SELECT id, username FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
            if not user or user['id'] != current_user_id:
                return jsonify({"status": "error", "message": "Unauthorized: you can only evaluate your own assessments"}), 403
            user_id = user['id']
        
        cursor.execute("SELECT * FROM cognitive_assessments WHERE user_id = %s ORDER BY completed_at ASC", (user_id,))
        assessments = cursor.fetchall()
        
        pre_test = next((a for a in assessments if a['assessment_type'] == 'pre-test'), None)
        post_tests = [a for a in assessments if a['assessment_type'] == 'post-test']
        post_test = post_tests[-1] if post_tests else None
        
        if not pre_test or not post_test:
            return jsonify({"status": "error", "message": "Incomplete assessments"}), 400
            
        pre_scores = [pre_test['spatial_visual_score'], pre_test['logical_math_score'], pre_test['attention_score'], pre_test['executive_score']]
        post_scores = [post_test['spatial_visual_score'], post_test['logical_math_score'], post_test['attention_score'], post_test['executive_score']]

        stats_res = compute_paired_ttest_stats(pre_scores, post_scores)
        significant = stats_res["statistically_significant"]

        return jsonify({
            "status": "success",
            "sample_size": stats_res["sample_size"],
            "mean_pretest": stats_res["mean_pre"],
            "mean_posttest": stats_res["mean_post"],
            "overall_improvement_rate_pct": stats_res["improvement_pct"],
            "t_statistic": stats_res["t_statistic"],
            "p_value": stats_res["p_value"],
            "cohens_d": stats_res["cohens_d"],
            "effect_size_magnitude": stats_res["effect_size_magnitude"],
            "statistically_significant": significant,
            "hypothesis_result": "Reject Null Hypothesis: Significant improvement detected across domains." if significant else "Fail to Reject Null Hypothesis: Improvement is not statistically significant.",
            "domain_improvements": {
                "spatial_visual_memory": round(post_test['spatial_visual_score'] - pre_test['spatial_visual_score'], 2),
                "logical_mathematical": round(post_test['logical_math_score'] - pre_test['logical_math_score'], 2),
                "attention": round(post_test['attention_score'] - pre_test['attention_score'], 2),
                "executive_strategy": round(post_test['executive_score'] - pre_test['executive_score'], 2)
            }
        }), 200
    except Exception as e:
        logger.error(f"Error in run_evaluation: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500
    finally:
        conn.close()

@analytics_bp.route('/api/cohort-analytics', methods=['GET'])
@token_required
def get_cohort_analytics(current_user_id, current_username):
    import redis
    import json
    import os
    redis_url = os.environ.get("REDIS_URL", "memory://")
    redis_client = None
    if redis_url != "memory://":
        try:
            redis_client = redis.from_url(redis_url)
            cached_data = redis_client.get("cognicore:cohort_analytics")
            if cached_data:
                return jsonify(json.loads(cached_data)), 200
        except Exception:
            pass
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Query matched pre and post scores for all users (using latest pre/post tests)
        cursor.execute(
            """
            WITH latest_pre AS (
                SELECT DISTINCT ON (user_id) * 
                FROM cognitive_assessments 
                WHERE assessment_type = 'pre-test' 
                ORDER BY user_id, completed_at DESC
            ),
            latest_post AS (
                SELECT DISTINCT ON (user_id) * 
                FROM cognitive_assessments 
                WHERE assessment_type = 'post-test' 
                ORDER BY user_id, completed_at DESC
            )
            SELECT 
                pre.spatial_visual_score AS pre_sv,
                pre.logical_math_score AS pre_lm,
                pre.attention_score AS pre_at,
                pre.executive_score AS pre_ex,
                post.spatial_visual_score AS post_sv,
                post.logical_math_score AS post_lm,
                post.attention_score AS post_at,
                post.executive_score AS post_ex
            FROM latest_pre pre
            JOIN latest_post post ON pre.user_id = post.user_id
            """
        )
        rows = cursor.fetchall()
        
        if not rows:
            return jsonify({
                "status": "error",
                "message": "No research cohort subjects found in database. Please run the seeding script first."
            }), 404

        pre_sv_list = []
        pre_lm_list = []
        pre_at_list = []
        pre_ex_list = []
        
        post_sv_list = []
        post_lm_list = []
        post_at_list = []
        post_ex_list = []
        
        pre_averages = []
        post_averages = []
        
        for r in rows:
            pre_sv = safe_float(r['pre_sv'])
            pre_lm = safe_float(r['pre_lm'])
            pre_at = safe_float(r['pre_at'])
            pre_ex = safe_float(r['pre_ex'])
            
            post_sv = safe_float(r['post_sv'])
            post_lm = safe_float(r['post_lm'])
            post_at = safe_float(r['post_at'])
            post_ex = safe_float(r['post_ex'])
            
            pre_sv_list.append(pre_sv)
            pre_lm_list.append(pre_lm)
            pre_at_list.append(pre_at)
            pre_ex_list.append(pre_ex)
            
            post_sv_list.append(post_sv)
            post_lm_list.append(post_lm)
            post_at_list.append(post_at)
            post_ex_list.append(post_ex)
            
            pre_averages.append((pre_sv + pre_lm + pre_at + pre_ex) / 4.0)
            post_averages.append((post_sv + post_lm + post_at + post_ex) / 4.0)
            
        # Helper standard deviation
        def get_mean_std(lst):
            length = len(lst)
            if length == 0:
                return 0.0, 0.0
            mean = sum(lst) / length
            if length > 1:
                var = sum((x - mean) ** 2 for x in lst) / (length - 1)
                std = var ** 0.5
            else:
                std = 0.0
            return mean, std
            
        mean_pre_sv, std_pre_sv = get_mean_std(pre_sv_list)
        mean_post_sv, std_post_sv = get_mean_std(post_sv_list)
        
        mean_pre_lm, std_pre_lm = get_mean_std(pre_lm_list)
        mean_post_lm, std_post_lm = get_mean_std(post_lm_list)
        
        mean_pre_at, std_pre_at = get_mean_std(pre_at_list)
        mean_post_at, std_post_at = get_mean_std(post_at_list)
        
        mean_pre_ex, std_pre_ex = get_mean_std(pre_ex_list)
        mean_post_ex, std_post_ex = get_mean_std(post_ex_list)
        
        stats_res = compute_paired_ttest_stats(pre_averages, post_averages)
        significant = stats_res["statistically_significant"]

        response_data = {
            "status": "success",
            "sample_size": stats_res["sample_size"],
            "overall_pre_mean": stats_res["mean_pre"],
            "overall_post_mean": stats_res["mean_post"],
            "overall_improvement_rate_pct": stats_res["improvement_pct"],
            "cohort_t_statistic": stats_res["t_statistic"],
            "cohort_p_value": stats_res["p_value"],
            "cohort_cohens_d": stats_res["cohens_d"],
            "effect_size_magnitude": stats_res["effect_size_magnitude"],
            "statistically_significant": significant,
            "hypothesis_verdict": "Reject Null Hypothesis: Significant improvement detected across the cohort." if significant else "Fail to Reject Null Hypothesis: Improvement is not statistically significant.",
            "domains": {
                "spatial_visual_memory": {
                    "pre_mean": round(mean_pre_sv, 2),
                    "pre_std": round(std_pre_sv, 2),
                    "post_mean": round(mean_post_sv, 2),
                    "post_std": round(std_post_sv, 2),
                    "improvement_pct": round(((mean_post_sv - mean_pre_sv) / mean_pre_sv * 100) if mean_pre_sv != 0 else 0.0, 2)
                },
                "logical_mathematical": {
                    "pre_mean": round(mean_pre_lm, 2),
                    "pre_std": round(std_pre_lm, 2),
                    "post_mean": round(mean_post_lm, 2),
                    "post_std": round(std_post_lm, 2),
                    "improvement_pct": round(((mean_post_lm - mean_pre_lm) / mean_pre_lm * 100) if mean_pre_lm != 0 else 0.0, 2)
                },
                "reflexes_and_focus": {
                    "pre_mean": round(mean_pre_at, 2),
                    "pre_std": round(std_pre_at, 2),
                    "post_mean": round(mean_post_at, 2),
                    "post_std": round(std_post_at, 2),
                    "improvement_pct": round(((mean_post_at - mean_pre_at) / mean_pre_at * 100) if mean_pre_at != 0 else 0.0, 2)
                },
                "executive_strategy": {
                    "pre_mean": round(mean_pre_ex, 2),
                    "pre_std": round(std_pre_ex, 2),
                    "post_mean": round(mean_post_ex, 2),
                    "post_std": round(std_post_ex, 2),
                    "improvement_pct": round(((mean_post_ex - mean_pre_ex) / mean_pre_ex * 100) if mean_pre_ex != 0 else 0.0, 2)
                }
            }
        }
        

        if redis_client:
            try:
                redis_client.setex("cognicore:cohort_analytics", 900, json.dumps(response_data))
            except Exception:
                pass
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Error in get_cohort_analytics: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500
    finally:
        conn.close()

@analytics_bp.route('/api/user-session-history/<username>', methods=['GET'])
@token_required
def get_user_session_history(current_user_id, current_username, username):
    if username in ["player_one", "", None]:
        username = current_username
    if current_username != username and not is_admin_user(current_user_id, current_username):
        return jsonify({"status": "error", "message": "Unauthorized: you can only view your own session history"}), 403
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Get user
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"status": "success", "sessions": []}), 200
        user_id = user['id']
        
        # Fetch sessions with precomputed stats in a single join query
        cursor.execute(
            """
            SELECT 
                gs.id AS session_id, 
                gs.game_type, 
                gs.game_mode, 
                gs.start_time,
                AVG(pm.reaction_time) AS avg_rt,
                AVG(pm.accuracy_rate) AS avg_acc,
                MAX(pm.difficulty_level) AS max_diff,
                COUNT(pm.id) AS rounds_count
            FROM game_sessions gs
            LEFT JOIN performance_metrics pm ON gs.id = pm.session_id
            WHERE gs.user_id = %s
            GROUP BY gs.id
            ORDER BY gs.start_time DESC
            """,
            (user_id,)
        )
        sessions_rows = cursor.fetchall()
        
        sessions = []
        for s in sessions_rows:
            sessions.append({
                "session_id": s["session_id"],
                "game_type": s["game_type"],
                "game_mode": s["game_mode"] if s["game_mode"] else "timed",
                "start_time": s["start_time"],
                "avg_rt": round(float(s["avg_rt"]), 2) if s["avg_rt"] is not None else 0.0,
                "avg_acc": round(float(s["avg_acc"]), 4) if s["avg_acc"] is not None else 0.0,
                "max_diff": s["max_diff"] if s["max_diff"] is not None else 1,
                "rounds_count": s["rounds_count"]
            })
            
        return jsonify({"status": "success", "sessions": sessions}), 200
        
    except Exception as e:
        logger.error(f"Error in get_user_session_history: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500
    finally:
        conn.close()

@analytics_bp.route('/api/session-metrics/<int:session_id>', methods=['GET'])
@token_required
def get_session_metrics(current_user_id, current_username, session_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Verify if session exists
        cursor.execute("SELECT id FROM game_sessions WHERE id = %s AND user_id = %s", (session_id, current_user_id))
        if not cursor.fetchone():
            return jsonify({"status": "error", "message": f"Session ID {session_id} not found."}), 404

        cursor.execute(
            """
            SELECT id, reaction_time, accuracy_rate, difficulty_level, recorded_at, rule_shift_latency_ms, path_efficiency
            FROM performance_metrics
            WHERE session_id = %s
            ORDER BY id ASC
            """,
            (session_id,)
        )
        rows = cursor.fetchall()
        
        metrics = []
        for r in rows:
            metrics.append({
                "metric_id": r["id"],
                "reaction_time": r["reaction_time"],
                "reaction_time_ms": r["reaction_time"],  # legacy compatibility
                "accuracy_rate": r["accuracy_rate"],
                "difficulty_level": r["difficulty_level"],
                "recorded_at": r["recorded_at"],
                "timestamp": r["recorded_at"],  # legacy compatibility
                "rule_shift_latency_ms": r["rule_shift_latency_ms"],
                "path_efficiency": r["path_efficiency"]
            })
            
        return jsonify({"status": "success", "session_id": session_id, "metrics": metrics}), 200
        
    except Exception as e:
        logger.error(f"Error in get_session_metrics: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500
    finally:
        conn.close()

@analytics_bp.route('/api/cohort-comparison/<username>', methods=['GET'])
@token_required
def get_cohort_comparison(current_user_id, current_username, username):
    if username in ["player_one", "", None]:
        username = current_username
    if current_username != username:
        return jsonify({"status": "error", "message": "Unauthorized: you can only view your own cohort comparison"}), 403
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Get active user averages
        cursor.execute(
            """
            SELECT 
                AVG(pm.reaction_time) as avg_rt,
                AVG(pm.accuracy_rate) as avg_acc
            FROM performance_metrics pm
            JOIN game_sessions gs ON pm.session_id = gs.id
            JOIN users u ON gs.user_id = u.id
            WHERE u.username = %s
            """,
            (username,)
        )
        user_stats = cursor.fetchone()
        user_rt = round(user_stats["avg_rt"], 2) if user_stats and user_stats["avg_rt"] is not None else 0.0
        user_acc = round(user_stats["avg_acc"], 4) if user_stats and user_stats["avg_acc"] is not None else 0.0
        
        # Get clinical cohort averages (seeded clinical_subject_%)
        cursor.execute(
            """
            SELECT 
                AVG(pm.reaction_time) as avg_rt,
                AVG(pm.accuracy_rate) as avg_acc
            FROM performance_metrics pm
            JOIN game_sessions gs ON pm.session_id = gs.id
            JOIN users u ON gs.user_id = u.id
            WHERE u.username LIKE 'clinical_subject_%'
            """
        )
        cohort_stats = cursor.fetchone()
        cohort_rt = round(cohort_stats["avg_rt"], 2) if cohort_stats and cohort_stats["avg_rt"] is not None else 0.0
        cohort_acc = round(cohort_stats["avg_acc"], 4) if cohort_stats and cohort_stats["avg_acc"] is not None else 0.0
        
        return jsonify({
            "status": "success",
            "username": username,
            "user_averages": {
                "reaction_time": user_rt,
                "reaction_time_ms": user_rt,  # legacy compatibility
                "accuracy_rate": user_acc
            },
            "cohort_averages": {
                "reaction_time": cohort_rt,
                "reaction_time_ms": cohort_rt,  # legacy compatibility
                "accuracy_rate": cohort_acc
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error in get_cohort_comparison: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500
    finally:
        conn.close()

@analytics_bp.route('/api/archetype-progression/<username>', methods=['GET'])
@token_required
def get_archetype_progression(current_user_id, current_username, username):
    if username in ["player_one", "", None]:
        username = current_username
    if current_username != username:
        return jsonify({"status": "error", "message": "Unauthorized: you can only view your own archetype progression"}), 403
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Get user
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"status": "success", "history": []}), 200
        user_id = user['id']
        
        # Fetch progression history joined with game_sessions to know what game they played
        cursor.execute(
            """
            SELECT ah.id, ah.session_id, gs.game_type, ah.archetype_name, ah.confidence_score, ah.timestamp
            FROM archetype_history ah
            LEFT JOIN game_sessions gs ON ah.session_id = gs.id
            WHERE ah.user_id = %s
            ORDER BY ah.timestamp ASC, ah.id ASC
            """,
            (user_id,)
        )
        rows = cursor.fetchall()
        
        history = []
        for r in rows:
            history.append({
                "id": r["id"],
                "session_id": r["session_id"],
                "game_type": r["game_type"] or "Unknown",
                "archetype_name": r["archetype_name"],
                "confidence_score": r["confidence_score"],
                "timestamp": r["timestamp"]
            })
            
        return jsonify({"status": "success", "history": history}), 200
        
    except Exception as e:
        logger.error(f"Error in get_archetype_progression: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500
    finally:
        conn.close()

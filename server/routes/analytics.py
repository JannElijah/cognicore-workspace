from flask import Blueprint, jsonify, request
from auth import token_required
from database import db
import logging
from sqlalchemy import text
from game_utils import safe_float, safe_int
import math

try:
    from scipy import stats
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False

def calculate_approx_t_p_value(t_stat, df):
    """
    Computes a highly accurate mathematical approximation of the two-sided p-value
    for a Student's t-distribution with given degrees of freedom, without external libraries.
    """
    if df < 1:
        return 1.0
        
    t_abs = abs(t_stat)
    
    # Exact calculation for df = 1 (Cauchy distribution)
    if df == 1:
        return 1.0 - (2.0 / math.pi) * math.atan(t_abs)
    # Exact calculation for df = 2
    if df == 2:
        return 1.0 - t_abs / math.sqrt(2.0 + t_abs * t_abs)
    # Exact calculation for df = 3
    if df == 3:
        term1 = t_abs / (math.pi * math.sqrt(3.0) * (1.0 + t_abs * t_abs / 3.0))
        term2 = math.atan(t_abs / math.sqrt(3.0)) / math.pi
        return max(0.0, min(1.0, 2.0 * (0.5 - term1 - term2)))
    # Exact calculation for df = 4
    if df == 4:
        term = (t_abs / (2.0 * math.sqrt(4.0 + t_abs * t_abs))) * (1.0 + 2.0 / (4.0 + t_abs * t_abs))
        return max(0.0, min(1.0, 2.0 * (0.5 - term)))
        
    # Peizer-Pratt adjusted normal approximation for df >= 5
    z = t_abs * (1.0 - 1.0 / (4.0 * df)) / math.sqrt(1.0 + t_abs * t_abs / (2.0 * df))
    
    # Standard normal CDF approximation (Abramowitz & Stegun formula 26.2.17)
    p = 0.2316419
    b1 = 0.319381530
    b2 = -0.356563782
    b3 = 1.781477937
    b4 = -1.821255978
    b5 = 1.330274429
    
    t = 1.0 / (1.0 + p * z)
    exponential = math.exp(-0.5 * z * z)
    prob = 1.0 - (1.0 / math.sqrt(2.0 * math.pi)) * exponential * (
        b1 * t + b2 * (t ** 2) + b3 * (t ** 3) + b4 * (t ** 4) + b5 * (t ** 5)
    )
    
    # Return two-sided p-value
    two_sided_p = 2.0 * (1.0 - prob)
    return max(0.0, min(1.0, two_sided_p))

logger = logging.getLogger(__name__)

def get_db_connection():
    import psycopg2
    from psycopg2.extras import RealDictCursor
    import os
    DATABASE_URL = os.environ.get("DATABASE_URL")
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

analytics_bp = Blueprint('analytics_bp', __name__)

@analytics_bp.route('/api/user-analytics/<username>', methods=['GET'])
@token_required
def get_user_analytics(current_user_id, current_username, username):
    # Ownership check: users can only view their own analytics
    if current_username != username:
        return jsonify({'status': 'error', 'message': 'Unauthorized: you can only view your own analytics'}), 403

    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        target_uid = user['id']
        
        # Fetch metrics grouped by domain
        cursor.execute("""
            SELECT 
                cognitive_domain, 
                AVG(accuracy_rate) as avg_accuracy, 
                AVG(reaction_time) as avg_rt 
            FROM performance_metrics 
            JOIN game_sessions ON performance_metrics.session_id = game_sessions.id 
            WHERE game_sessions.user_id = %s
            GROUP BY cognitive_domain
        """, (target_uid,))
        domain_stats = cursor.fetchall()
        
        # Fetch time series (daily average accuracy/rt)
        cursor.execute("""
            SELECT 
                date(game_sessions.start_time) as day, 
                AVG(accuracy_rate) as avg_accuracy, 
                AVG(reaction_time) as avg_rt
            FROM performance_metrics
            JOIN game_sessions ON performance_metrics.session_id = game_sessions.id
            WHERE game_sessions.user_id = %s
            GROUP BY date(game_sessions.start_time)
            ORDER BY day ASC
            LIMIT 14
        """, (target_uid,))
        timeline_stats = cursor.fetchall()
        
        # Fetch latest archetype
        cursor.execute("""
            SELECT archetype_name, confidence_score
            FROM archetype_history 
            WHERE user_id = %s 
            ORDER BY timestamp DESC, id DESC LIMIT 1
        """, (target_uid,))
        latest_archetype_row = cursor.fetchone()
        
        cursor.execute("""
            SELECT 
                game_sessions.game_type,
                game_sessions.start_time,
                performance_metrics.accuracy_rate,
                performance_metrics.reaction_time,
                performance_metrics.difficulty_level
            FROM game_sessions
            LEFT JOIN performance_metrics ON game_sessions.id = performance_metrics.session_id
            WHERE game_sessions.user_id = %s
            ORDER BY game_sessions.start_time DESC
            LIMIT 5
        """, (target_uid,))
        recent_activity_rows = cursor.fetchall()
        
        # Fetch KPI stats
        cursor.execute("""
            SELECT 
                COUNT(game_sessions.id) as total_games,
                MAX(performance_metrics.difficulty_level) as highest_level,
                AVG(performance_metrics.accuracy_rate) as overall_accuracy
            FROM game_sessions
            LEFT JOIN performance_metrics ON game_sessions.id = performance_metrics.session_id
            WHERE game_sessions.user_id = %s
        """, (target_uid,))
        kpi_row = cursor.fetchone()
        
        kpis = {
            "total_games": kpi_row["total_games"] if kpi_row and kpi_row["total_games"] else 0,
            "highest_level": kpi_row["highest_level"] if kpi_row and kpi_row["highest_level"] else 1,
            "overall_accuracy": float(kpi_row["overall_accuracy"]) if kpi_row and kpi_row["overall_accuracy"] else 0.0
        }
        
        # Calculate AI Insights
        domain_list = [dict(row) for row in domain_stats]
        top_strength = None
        primary_bottleneck = None
        insight_text = "Play more games to generate your personalized AI coaching insight!"
        recommended_game = None

        if domain_list:
            sorted_domains = sorted(domain_list, key=lambda x: x['avg_accuracy'], reverse=True)
            top_strength = sorted_domains[0]['cognitive_domain']
            primary_bottleneck = sorted_domains[-1]['cognitive_domain']

            domain_names = {
                "reflexes_and_focus": "Reflexes & Focus",
                "spatial_visual_memory": "Spatial-Visual Memory",
                "executive_strategy": "Executive Strategy",
                "logical_mathematical": "Logical-Mathematical"
            }
            
            domain_game_map = {
                "reflexes_and_focus": "Speed Tap",
                "spatial_visual_memory": "Sequence Decoder",
                "executive_strategy": "Rule Shifter",
                "logical_mathematical": "Equation Balance"
            }

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
            "domain_stats": domain_list,
            "timeline_stats": [dict(row) for row in timeline_stats],
            "cognitive_profile": cognitive_profile,
            "recent_activity": [dict(row) for row in recent_activity_rows]
        }), 200
    finally:
        conn.close()

@analytics_bp.route('/api/evaluate', methods=['POST'])
def run_evaluation():
    data = request.json
    username = data.get('username')
    if not username:
        return jsonify({"status": "error", "message": "Username required"}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        user_id = user['id']
        
        cursor.execute("SELECT * FROM cognitive_assessments WHERE user_id = %s", (user_id,))
        assessments = cursor.fetchall()
        
        pre_test = next((a for a in assessments if a['assessment_type'] == 'pre-test'), None)
        post_test = next((a for a in assessments if a['assessment_type'] == 'post-test'), None)
        
        if not pre_test or not post_test:
            return jsonify({"status": "error", "message": "Incomplete assessments"}), 400
            
        pre_scores = [pre_test['spatial_visual_score'], pre_test['logical_math_score'], pre_test['attention_score'], pre_test['executive_score']]
        post_scores = [post_test['spatial_visual_score'], post_test['logical_math_score'], post_test['attention_score'], post_test['executive_score']]
        
        n = 4 # Number of domains
        mean_pre = sum(pre_scores) / n
        mean_post = sum(post_scores) / n
        improvement_pct = ((mean_post - mean_pre) / mean_pre * 100) if mean_pre != 0 else 0.0
        
        import math
        diffs = [post_scores[i] - pre_scores[i] for i in range(n)]
        mean_diff = sum(diffs) / n
        
        if SCIPY_AVAILABLE:
            t_stat, p_val = stats.ttest_rel(post_scores, pre_scores)
        else:
            var_diff = sum((d - mean_diff) ** 2 for d in diffs) / (n - 1) if n > 1 else 0.0
            sd_diff = var_diff ** 0.5
            se_diff = sd_diff / (n ** 0.5) if n > 0 else 0.0
            t_stat = mean_diff / se_diff if se_diff != 0 else 0.0
            p_val = calculate_approx_t_p_value(t_stat, n - 1)
            
        if math.isnan(t_stat) or math.isinf(t_stat):
            t_stat = 0.0
        if math.isnan(p_val) or math.isinf(p_val):
            p_val = 1.0
            
        var_diff_d = sum((d - mean_diff) ** 2 for d in diffs) / (n - 1) if n > 1 else 0.0
        sd_diff_d = var_diff_d ** 0.5
        cohens_d = mean_diff / sd_diff_d if sd_diff_d > 0 else 0.0
        
        if math.isnan(cohens_d) or math.isinf(cohens_d):
            cohens_d = 0.0
            
        abs_d = abs(cohens_d)
        if abs_d < 0.2:
            effect_magnitude = "negligible"
        elif abs_d < 0.5:
            effect_magnitude = "small"
        elif abs_d < 0.8:
            effect_magnitude = "medium"
        else:
            effect_magnitude = "large"
            
        significant = p_val < 0.05
        
        return jsonify({
            "status": "success",
            "sample_size": n,
            "mean_pretest": round(mean_pre, 2),
            "mean_posttest": round(mean_post, 2),
            "overall_improvement_rate_pct": round(improvement_pct, 2),
            "t_statistic": round(t_stat, 4),
            "p_value": round(p_val, 6),
            "cohens_d": round(cohens_d, 4),
            "effect_size_magnitude": effect_magnitude,
            "statistically_significant": bool(significant),
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
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@analytics_bp.route('/api/cohort-analytics', methods=['GET'])
def get_cohort_analytics():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Query matched pre and post scores for research subjects
        cursor.execute(
            """
            SELECT 
                ca_pre.spatial_visual_score AS pre_sv,
                ca_pre.logical_math_score AS pre_lm,
                ca_pre.attention_score AS pre_at,
                ca_pre.executive_score AS pre_ex,
                ca_post.spatial_visual_score AS post_sv,
                ca_post.logical_math_score AS post_lm,
                ca_post.attention_score AS post_at,
                ca_post.executive_score AS post_ex
            FROM users u
            JOIN cognitive_assessments ca_pre ON u.id = ca_pre.user_id AND ca_pre.assessment_type = 'pre-test'
            JOIN cognitive_assessments ca_post ON u.id = ca_post.user_id AND ca_post.assessment_type = 'post-test'
            WHERE u.username LIKE 'research_subject_%'
            """
        )
        rows = cursor.fetchall()
        
        if not rows:
            return jsonify({
                "status": "error",
                "message": "No research cohort subjects found in database. Please run the seeding script first."
            }), 404
            
        n = len(rows)
        
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
        
        overall_pre_mean = sum(pre_averages) / n
        overall_post_mean = sum(post_averages) / n
        overall_improvement_rate = ((overall_post_mean - overall_pre_mean) / overall_pre_mean * 100) if overall_pre_mean != 0 else 0.0
        
        # Paired t-test
        import math
        diffs = [post_averages[i] - pre_averages[i] for i in range(n)]
        mean_diff = sum(diffs) / n
        
        if SCIPY_AVAILABLE:
            t_stat, p_val = stats.ttest_rel(post_averages, pre_averages)
        else:
            var_diff = sum((d - mean_diff) ** 2 for d in diffs) / (n - 1) if n > 1 else 0.0
            sd_diff = var_diff ** 0.5
            se_diff = sd_diff / (n ** 0.5) if n > 0 else 0.0
            t_stat = mean_diff / se_diff if se_diff != 0 else 0.0
            p_val = calculate_approx_t_p_value(t_stat, n - 1)
            
        if math.isnan(t_stat) or math.isinf(t_stat):
            t_stat = 0.0
        if math.isnan(p_val) or math.isinf(p_val):
            p_val = 1.0
            
        # Cohen's d for cohort
        var_diff_d = sum((d - mean_diff) ** 2 for d in diffs) / (n - 1) if n > 1 else 0.0
        sd_diff_d = var_diff_d ** 0.5
        cohens_d = mean_diff / sd_diff_d if sd_diff_d > 0 else 0.0
        
        if math.isnan(cohens_d) or math.isinf(cohens_d):
            cohens_d = 0.0
            
        abs_d = abs(cohens_d)
        if abs_d < 0.2:
            effect_magnitude = "negligible"
        elif abs_d < 0.5:
            effect_magnitude = "small"
        elif abs_d < 0.8:
            effect_magnitude = "medium"
        else:
            effect_magnitude = "large"
            
        significant = p_val < 0.05
        
        response_data = {
            "status": "success",
            "sample_size": n,
            "overall_pre_mean": round(overall_pre_mean, 2),
            "overall_post_mean": round(overall_post_mean, 2),
            "overall_improvement_rate_pct": round(overall_improvement_rate, 2),
            "cohort_t_statistic": round(t_stat, 4),
            "cohort_p_value": round(p_val, 6),
            "cohort_cohens_d": round(cohens_d, 4),
            "effect_size_magnitude": effect_magnitude,
            "statistically_significant": bool(significant),
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
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Error in get_cohort_analytics: {e}")
        return jsonify({"status": "error", "message": f"Cohort evaluation error: {str(e)}"}), 500
    finally:
        conn.close()

@analytics_bp.route('/api/user-session-history/<username>', methods=['GET'])
def get_user_session_history(username):
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
                "avg_rt": round(s["avg_rt"], 2) if s["avg_rt"] is not None else 0.0,
                "avg_acc": round(s["avg_acc"], 4) if s["avg_acc"] is not None else 0.0,
                "max_diff": s["max_diff"] if s["max_diff"] is not None else 1,
                "rounds_count": s["rounds_count"]
            })
            
        return jsonify({"status": "success", "sessions": sessions}), 200
        
    except Exception as e:
        logger.error(f"Error in get_user_session_history: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@analytics_bp.route('/api/session-metrics/<int:session_id>', methods=['GET'])
def get_session_metrics(session_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Verify if session exists
        cursor.execute("SELECT id FROM game_sessions WHERE id = %s", (session_id,))
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
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@analytics_bp.route('/api/cohort-comparison/<username>', methods=['GET'])
def get_cohort_comparison(username):
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
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@analytics_bp.route('/api/archetype-progression/<username>', methods=['GET'])
def get_archetype_progression(username):
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
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@analytics_bp.route('/api/training-goals/<username>', methods=['GET'])
def get_training_goals(username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            with conn:
                cursor.execute("INSERT INTO users (username) VALUES (%s)", (username,))
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
        
        user_id = user['id']

        cursor.execute("SELECT id, domain, metric_type, target_value, is_completed FROM training_goals WHERE user_id = %s", (user_id,))
        goals_rows = cursor.fetchall()

        # Query all domain averages for this user in a single database roundtrip
        cursor.execute(
            """
            SELECT 
                pm.cognitive_domain,
                AVG(pm.accuracy_rate) AS avg_acc,
                AVG(pm.reaction_time) AS avg_rt,
                MAX(pm.difficulty_level) AS max_diff
            FROM performance_metrics pm
            JOIN game_sessions gs ON pm.session_id = gs.id
            WHERE gs.user_id = %s
            GROUP BY pm.cognitive_domain
            """,
            (user_id,)
        )
        stats_rows = cursor.fetchall()
        
        # Map cognitive_domain to its metrics
        domain_stats = {
            row['cognitive_domain']: {
                'avg_acc': row['avg_acc'],
                'avg_rt': row['avg_rt'],
                'max_diff': row['max_diff']
            }
            for row in stats_rows if row['cognitive_domain'] is not None
        }

        goals = []
        for g in goals_rows:
            gid = g['id']
            domain = g['domain']
            metric_type = g['metric_type']
            target_value = g['target_value']
            is_completed_db = g['is_completed']

            stats = domain_stats.get(domain)
            current_value = 0.0
            achieved = False

            if stats:
                if metric_type == 'accuracy':
                    avg_acc = stats['avg_acc'] if stats['avg_acc'] is not None else 0.0
                    current_value = round(avg_acc * 100, 1)
                    achieved = (current_value >= target_value)
                elif metric_type == 'reaction_time':
                    avg_rt = stats['avg_rt'] if stats['avg_rt'] is not None else 0.0
                    current_value = round(avg_rt, 1)
                    achieved = (0 < current_value <= target_value)
                elif metric_type == 'difficulty':
                    max_diff = stats['max_diff'] if stats['max_diff'] is not None else 1
                    current_value = float(max_diff)
                    achieved = (current_value >= target_value)

            just_completed = False
            if achieved and is_completed_db == 0:
                with conn:
                    cursor.execute("UPDATE training_goals SET is_completed = 1 WHERE id = %s", (gid,))
                just_completed = True
                is_completed_db = 1

            goals.append({
                "id": gid,
                "domain": domain,
                "metric_type": metric_type,
                "target_value": target_value,
                "current_value": current_value,
                "is_completed": is_completed_db,
                "just_completed": just_completed
            })

        return jsonify({"status": "success", "goals": goals}), 200

    except Exception as e:
        logger.error(f"Error in get_training_goals: {e}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
    finally:
        conn.close()

@analytics_bp.route('/api/training-goals/<int:goal_id>', methods=['DELETE'])
def delete_training_goal(goal_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        with conn:
            cursor.execute("DELETE FROM training_goals WHERE id = %s", (goal_id,))
            if cursor.rowcount == 0:
                return jsonify({"status": "error", "message": f"Training goal with ID {goal_id} not found."}), 404
        return jsonify({"status": "success", "message": "Goal deleted successfully"}), 200
    except Exception as e:
        logger.error(f"Error in delete_training_goal: {e}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
    finally:
        conn.close()

@analytics_bp.route('/api/training-goals', methods=['POST'])
def add_training_goal():
    data = request.json
    username = data.get('username')
    domain = data.get('domain')
    metric_type = data.get('metric_type')
    target_value = data.get('target_value')

    if not all([username, domain, metric_type, target_value]):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
            
        with conn:
            cursor.execute(
                "INSERT INTO training_goals (user_id, domain, metric_type, target_value) VALUES (%s, %s, %s, %s)",
                (user['id'], domain, metric_type, float(target_value))
            )
        return jsonify({"status": "success", "message": "Goal created"}), 201
    except Exception as e:
        import logging
        logging.error(f"Error in add_training_goal: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()
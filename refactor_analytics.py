import os
import re

filepath = r'd:\cognicore-workspace\server\routes\analytics.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

new_user_analytics = '''@analytics_bp.route('/api/user-analytics/<username>', methods=['GET'])
@token_required
def get_user_analytics(current_user_id, current_username, username):
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
    finally:
        conn.close()

    # Run remaining heavy queries concurrently using the connection pool
    from concurrent.futures import ThreadPoolExecutor
    
    def fetch_domain_stats():
        c = get_db_connection()
        try:
            cur = c.cursor()
            cur.execute("""
                SELECT cognitive_domain, AVG(accuracy_rate) as avg_accuracy, AVG(reaction_time) as avg_rt 
                FROM performance_metrics JOIN game_sessions ON performance_metrics.session_id = game_sessions.id 
                WHERE game_sessions.user_id = %s GROUP BY cognitive_domain
            """, (target_uid,))
            return cur.fetchall()
        finally:
            c.close()

    def fetch_timeline_stats():
        c = get_db_connection()
        try:
            cur = c.cursor()
            cur.execute("""
                SELECT date(game_sessions.start_time) as day, AVG(accuracy_rate) as avg_accuracy, AVG(reaction_time) as avg_rt
                FROM performance_metrics JOIN game_sessions ON performance_metrics.session_id = game_sessions.id
                WHERE game_sessions.user_id = %s GROUP BY date(game_sessions.start_time) ORDER BY day ASC LIMIT 14
            """, (target_uid,))
            return cur.fetchall()
        finally:
            c.close()

    def fetch_latest_archetype():
        c = get_db_connection()
        try:
            cur = c.cursor()
            cur.execute("SELECT archetype_name, confidence_score FROM archetype_history WHERE user_id = %s ORDER BY timestamp DESC, id DESC LIMIT 1", (target_uid,))
            return cur.fetchone()
        finally:
            c.close()

    def fetch_recent_activity():
        c = get_db_connection()
        try:
            cur = c.cursor()
            cur.execute("""
                SELECT game_sessions.game_type, game_sessions.start_time, performance_metrics.accuracy_rate, performance_metrics.reaction_time, performance_metrics.difficulty_level
                FROM game_sessions LEFT JOIN performance_metrics ON game_sessions.id = performance_metrics.session_id
                WHERE game_sessions.user_id = %s ORDER BY game_sessions.start_time DESC LIMIT 5
            """, (target_uid,))
            return cur.fetchall()
        finally:
            c.close()

    def fetch_kpis():
        c = get_db_connection()
        try:
            cur = c.cursor()
            cur.execute("""
                SELECT COUNT(game_sessions.id) as total_games, MAX(performance_metrics.difficulty_level) as highest_level, AVG(performance_metrics.accuracy_rate) as overall_accuracy
                FROM game_sessions LEFT JOIN performance_metrics ON game_sessions.id = performance_metrics.session_id WHERE game_sessions.user_id = %s
            """, (target_uid,))
            return cur.fetchone()
        finally:
            c.close()

    with ThreadPoolExecutor(max_workers=5) as executor:
        f_domain = executor.submit(fetch_domain_stats)
        f_time = executor.submit(fetch_timeline_stats)
        f_arch = executor.submit(fetch_latest_archetype)
        f_recent = executor.submit(fetch_recent_activity)
        f_kpi = executor.submit(fetch_kpis)

        domain_stats = f_domain.result()
        timeline_stats = f_time.result()
        latest_archetype_row = f_arch.result()
        recent_activity_rows = f_recent.result()
        kpi_row = f_kpi.result()

    kpis = {
        "total_games": kpi_row["total_games"] if kpi_row and kpi_row["total_games"] else 0,
        "highest_level": kpi_row["highest_level"] if kpi_row and kpi_row["highest_level"] else 1,
        "overall_accuracy": float(kpi_row["overall_accuracy"]) if kpi_row and kpi_row["overall_accuracy"] else 0.0
    }

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
    }), 200'''

content = re.sub(
    r"@analytics_bp\.route\('/api/user-analytics/<username>', methods=\['GET'\]\).*?def get_user_analytics.*?return jsonify\(\{.*?\}\), 200\n    finally:\n        conn\.close\(\)",
    new_user_analytics,
    content,
    flags=re.DOTALL
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)


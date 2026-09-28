import os
import re

filepath = r'd:\cognicore-workspace\server\routes\research.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

new_func = '''@research_bp.route('/api/research/correlations', methods=['GET'])
def get_research_correlations():
    try:
        var1 = request.args.get('var1', 'rule_shift_latency_ms')
        var2 = request.args.get('var2', 'spam_click_count')
        cohort = request.args.get('cohort', 'all')  # 'all', 'clinical', 'active'
        active_username = request.args.get('username', '')

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
                    u.username,
                    corr(pm.{var2}, pm.{var1}) OVER () AS r_coeff,
                    COUNT(*) OVER () AS n_points
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
        r_coeff = 0.0
        n_points = 0
        
        if rows:
            r_coeff = rows[0]['r_coeff'] if rows[0]['r_coeff'] is not None else 0.0
            n_points = rows[0]['n_points']
            for r in rows:
                data_points.append({
                    "x": float(r['val1']),
                    "y": float(r['val2']),
                    "username": r["username"]
                })

        # Calculate p-value manually
        import math
        p_value = 1.0
        if n_points > 2 and abs(r_coeff) < 1.0:
            t_stat = r_coeff * math.sqrt((n_points - 2) / (1.0 - r_coeff**2))
            # Use approximation from analytics if possible, or simple fallback
            from routes.analytics import calculate_approx_t_p_value
            p_value = calculate_approx_t_p_value(t_stat, n_points - 2)
        elif abs(r_coeff) >= 1.0:
            p_value = 0.0

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
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500'''

content = re.sub(
    r"@research_bp\.route\('/api/research/correlations', methods=\['GET'\]\).*?def get_research_correlations\(\):.*?return jsonify\(\{\"status\": \"error\", \"message\": \"An internal server error occurred\.\"\}\), 500",
    new_func,
    content,
    flags=re.DOTALL
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)


import re

with open('app.py', 'r') as f:
    content = f.read()

# Routes to remove for analytics, research, ml
routes_to_remove = [
    # analytics
    (r"@app\.route\('/api/user-analytics/<username>'.*?def get_user_analytics.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/cohort-analytics'.*?def get_cohort_analytics.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/user-session-history/<username>'.*?def get_user_session_history.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/session-metrics/<int:session_id>'.*?def get_session_metrics.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/cohort-comparison/<username>'.*?def get_cohort_comparison.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/archetype-progression/<username>'.*?def get_archetype_progression.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/training-goals/<username>'.*?def get_training_goals.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/training-goals', methods=\['POST'\].*?def add_training_goal.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/training-goals/<int:goal_id>'.*?def delete_training_goal.*?return jsonify.*?500\n", 0),
    
    # research
    (r"@app\.route\('/api/evaluate'.*?def run_evaluation.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/iso-evaluations'.*?def get_iso_evaluations.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/iso-evaluations/summary'.*?def get_iso_summary.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/cohort-db-scores'.*?def get_cohort_db_scores.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/export-csv'.*?def export_csv.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/research/correlations'.*?def get_research_correlations.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/research/learning-curves/<username>'.*?def get_learning_curves.*?return jsonify.*?500\n", 0),
    
    # ml
    (r"@app\.route\('/api/model/status'.*?def model_status.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/model/retrain'.*?def retrain_model.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/model/clusters'.*?def get_model_clusters.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/admin/retrain'.*?def admin_retrain.*?return jsonify.*?500\n", 0)
]

for pattern, flags in routes_to_remove:
    content = re.sub(pattern, "", content, flags=re.DOTALL)

with open('app.py', 'w') as f:
    f.write(content)

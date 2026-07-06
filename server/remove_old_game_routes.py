import re

with open('app.py', 'r') as f:
    content = f.read()

# Define the start and end of routes to remove.
# Because regex replacement on massive files can be tricky, we can find indices.

routes_to_remove = [
    (r"@app\.route\('/api/submit-assessment'.*?def submit_assessment.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/assessment-status/<username>'.*?def get_assessment_status.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/start-session'.*?def start_session.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/dda'.*?def adjust_difficulty.*?return jsonify.*?500\n", 0),
    (r"def execute_gamification.*?return xp_gained, coins_gained, leveled_up, newly_unlocked\n", 0),
    (r"@app\.route\('/api/submit-metrics'.*?def submit_metrics\(.*?return jsonify.*?500\n", 0),
    (r"@app\.route\('/api/submit-metrics/batch'.*?def submit_metrics_batch.*?return jsonify.*?500\n", 0),
]

for pattern, flags in routes_to_remove:
    # re.DOTALL is important because we are matching across newlines
    content = re.sub(pattern, "", content, flags=re.DOTALL)

with open('app.py', 'w') as f:
    f.write(content)

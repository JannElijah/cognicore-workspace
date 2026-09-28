import os
import re

filepath = r'd:\cognicore-workspace\server\routes\game.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

new_dda = '''        alpha = max(0.1, min(1.0, safe_float(data.get('smoothing_alpha'), 0.3)))
        current_smooth_difficulty = session_obj.current_smooth_difficulty if session_obj.current_smooth_difficulty is not None else float(current_difficulty)
        
        # --- Upgraded Item Response Theory (IRT) / Elo DDA Algorithm ---
        import math
        theta = current_smooth_difficulty
        discrimination = 2.0
        # Flow-state offset: we want expected accuracy to be ~80% when skill == difficulty
        # 1 / (1 + exp(-2(0 + 1.386))) = 0.80
        expected_accuracy = 1.0 / (1.0 + math.exp(-discrimination * (theta - float(current_difficulty) + 1.386)))
        
        learning_rate = 1.5
        theta_update = learning_rate * (avg_accuracy - expected_accuracy)
        
        if avg_rt > 1200:
            theta_update -= 0.15
        elif avg_rt < 400:
            theta_update += 0.15
            
        new_theta = max(1.0, min(5.0, theta + theta_update))
        new_difficulty = max(1, min(5, int(round(new_theta))))
        session_obj.current_smooth_difficulty = new_theta
        # -------------------------------------------------------------'''

content = re.sub(
    r"        alpha = max\(0\.1, min\(1\.0, safe_float\(data\.get\('smoothing_alpha'\), 0\.3\)\)\).*?session_obj\.current_smooth_difficulty = smooth_diff",
    new_dda,
    content,
    flags=re.DOTALL
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)


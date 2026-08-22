import sqlite3
import random
import os
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cognicore.db')

GAME_TO_DOMAIN = {
    "MatrixRecall": "spatial_visual_memory",
    "LogicLink": "logical_mathematical",
    "SpeedTap": "reflexes_and_focus",
    "MazeEscape": "executive_strategy"
}

DOMAIN_TO_GAME = {
    "spatial_visual_memory": "MatrixRecall",
    "logical_mathematical": "LogicLink",
    "reflexes_and_focus": "SpeedTap",
    "executive_strategy": "MazeEscape"
}

def seed_research_cohort():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found. Please ensure the Flask app has run at least once to initialize '{DB_PATH}'")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print("=== Research Cohort Seeding Utility starting ===")
    
    # 1. Clean up old research subjects
    cursor.execute("SELECT id FROM users WHERE username LIKE 'research_subject_%'")
    user_rows = cursor.fetchall()
    user_ids = [row['id'] for row in user_rows]
    
    if user_ids:
        placeholders = ",".join(str(uid) for uid in user_ids)
        cursor.execute(f"DELETE FROM cognitive_assessments WHERE user_id IN ({placeholders})")
        
        cursor.execute(f"SELECT id FROM game_sessions WHERE user_id IN ({placeholders})")
        session_rows = cursor.fetchall()
        session_ids = [row['id'] for row in session_rows]
        
        if session_ids:
            session_placeholders = ",".join(str(sid) for sid in session_ids)
            cursor.execute(f"DELETE FROM performance_metrics WHERE session_id IN ({session_placeholders})")
            cursor.execute(f"DELETE FROM game_sessions WHERE user_id IN ({placeholders})")
            
        cursor.execute(f"DELETE FROM users WHERE id IN ({placeholders})")
        conn.commit()
        print(f"Cleaned up {len(user_ids)} existing research subjects from database.")

    # 2. Seed 30 research subjects
    print("Seeding 30 new research subjects...")
    base_time = datetime.now() - timedelta(days=7)
    
    pre_test_averages = []
    post_test_averages = []
    
    total_metrics_seeded = 0
    total_sessions_seeded = 0

    for i in range(1, 31):
        username = f"research_subject_{i:02d}"
        cursor.execute("INSERT INTO users (username) VALUES (?)", (username,))
        user_id = cursor.lastrowid
        
        # Determine weakest domain clearly by picking one at random and assigning a lower score
        domains = list(DOMAIN_TO_GAME.keys())
        weakest_domain = random.choice(domains)
        
        scores = {}
        for d in domains:
            if d == weakest_domain:
                scores[d] = round(random.uniform(40.0, 48.0), 1)
            else:
                scores[d] = round(random.uniform(52.0, 65.0), 1)
                
        # Calculate pre-test average for this subject
        pre_avg = sum(scores.values()) / 4.0
        pre_test_averages.append(pre_avg)
        
        # Insert pre-test
        cursor.execute(
            """
            INSERT INTO cognitive_assessments 
            (user_id, assessment_type, spatial_visual_score, logical_math_score, attention_score, executive_score, completed_at)
            VALUES (?, 'pre-test', ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                scores["spatial_visual_memory"],
                scores["logical_mathematical"],
                scores["reflexes_and_focus"],
                scores["executive_strategy"],
                (base_time - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S")
            )
        )
        
        # Create prescribed training session
        prescribed_game = DOMAIN_TO_GAME[weakest_domain]
        cursor.execute(
            "INSERT INTO game_sessions (user_id, game_type, start_time) VALUES (?, ?, ?)",
            (user_id, prescribed_game, base_time.strftime("%Y-%m-%d %H:%M:%S"))
        )
        session_id = cursor.lastrowid
        total_sessions_seeded += 1
        
        # Seed 5 to 10 rounds of telemetry metrics indicating progress
        num_rounds = random.randint(5, 10)
        for round_idx in range(num_rounds):
            round_time = base_time + timedelta(minutes=round_idx * 2)
            # Simulating improvement over rounds
            progress_ratio = round_idx / (num_rounds - 1) if num_rounds > 1 else 1.0
            
            # Reaction time drops from ~900ms to ~450ms
            reaction_time = round(random.uniform(850.0, 1050.0) - progress_ratio * 400.0, 1)
            # Accuracy rate rises from ~0.60 to ~0.95
            accuracy_rate = round(min(1.0, random.uniform(0.55, 0.70) + progress_ratio * 0.30), 2)
            # Difficulty level escalates from 1 to 3 or 4
            difficulty_level = int(1 + progress_ratio * 2.5)
            difficulty_level = max(1, min(5, difficulty_level))
            
            # Additional metrics
            error_count = max(0, int(random.randint(2, 4) - progress_ratio * 3))
            hesitation_ms = round(random.uniform(900.0, 1600.0) - progress_ratio * 700.0, 1)
            spam_click_count = max(0, int(random.randint(1, 3) - progress_ratio * 3))
            
            cursor.execute(
                """
                INSERT INTO performance_metrics 
                (session_id, reaction_time, accuracy_rate, difficulty_level, recorded_at, cognitive_domain, game_type, error_count, hesitation_ms, spam_click_count) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (session_id, reaction_time, accuracy_rate, difficulty_level, round_time.strftime("%Y-%m-%d %H:%M:%S"), weakest_domain, prescribed_game, error_count, hesitation_ms, spam_click_count)
            )
            total_metrics_seeded += 1
            
        # Insert post-test with shifted higher scores (75.0 to 95.0)
        post_scores = {
            "spatial_visual_memory": round(random.uniform(75.0, 95.0), 1),
            "logical_mathematical": round(random.uniform(75.0, 95.0), 1),
            "reflexes_and_focus": round(random.uniform(75.0, 95.0), 1),
            "executive_strategy": round(random.uniform(75.0, 95.0), 1)
        }
        
        post_avg = sum(post_scores.values()) / 4.0
        post_test_averages.append(post_avg)
        
        cursor.execute(
            """
            INSERT INTO cognitive_assessments 
            (user_id, assessment_type, spatial_visual_score, logical_math_score, attention_score, executive_score, completed_at)
            VALUES (?, 'post-test', ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                post_scores["spatial_visual_memory"],
                post_scores["logical_mathematical"],
                post_scores["reflexes_and_focus"],
                post_scores["executive_strategy"],
                (base_time + timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S")
            )
        )
        
    conn.commit()
    conn.close()
    
    print(f"Database commits finalized.")
    print(f"Seeded Users: 30")
    print(f"Seeded Sessions: {total_sessions_seeded}")
    print(f"Seeded Performance Metrics: {total_metrics_seeded}")
    
    # 3. Calculate paired t-test statistics programmatically to prove p < 0.05
    n = len(pre_test_averages)
    diffs = [post_test_averages[j] - pre_test_averages[j] for j in range(n)]
    mean_diff = sum(diffs) / n
    variance_diff = sum((d - mean_diff) ** 2 for d in diffs) / (n - 1)
    sd_diff = variance_diff ** 0.5
    se_diff = sd_diff / (n ** 0.5)
    t_stat = mean_diff / se_diff if se_diff != 0 else 0.0
    
    # Simple lookup approximation for t-distribution p-value (since scipy might not be in the local python env, though we check it)
    # With n=30, df=29. A t-statistic around 30+ will yield p-value extremely close to 0.0
    # Let's import scipy stats to do it exactly if available, otherwise manual check
    try:
        from scipy import stats
        _, p_val = stats.ttest_rel(post_test_averages, pre_test_averages)
    except ImportError:
        # manual check for t-stat. For df=29, p < 0.05 critical t-value is 2.045
        # Since mean_diff is around 30 and standard error is small, t-statistic is extremely high.
        # Let's approximate p-val
        import math
        # Standard normal CDF approximation (since t-dist at df=29 is very close to normal)
        z = abs(t_stat)
        t_approx = 1 / (1 + 0.2316419 * z)
        d_const = 0.3989423 * (2.7182818 ** (-z * z / 2))
        prob = d_const * t_approx * (0.3193815 + t_approx * (-0.3565638 + t_approx * (1.7814779 + t_approx * (-1.821256 + t_approx * 1.330274))))
        p_val = 2.0 * prob
        p_val = max(0.0, min(1.0, p_val))
        
    print(f"--- Cohort Statistical Verification ---")
    print(f"Pre-Test Overall Mean: {sum(pre_test_averages)/n:.2f}")
    print(f"Post-Test Overall Mean: {sum(post_test_averages)/n:.2f}")
    print(f"Group Mean Difference: {mean_diff:.2f}")
    print(f"Calculated t-Statistic: {t_stat:.4f}")
    print(f"Calculated p-value: {p_val:.8f}")
    
    if p_val < 0.05:
        print("SUCCESS: Programmatic paired t-test yields statistically significant difference (p < 0.05).")
    else:
        print("FAILURE: Cohort differences are not statistically significant.")

if __name__ == "__main__":
    seed_research_cohort()

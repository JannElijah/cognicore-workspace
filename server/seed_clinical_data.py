import sqlite3
import random
import os
from datetime import datetime, timedelta

DB_PATH = 'cognicore.db'

# 4-Tier Cognitive Domain Categorization Configuration Mapping
GAME_TO_DOMAIN = {
    "MemoryMatch": "spatial_visual_memory",
    "LogicLink": "logical_mathematical",
    "EquationBalance": "logical_mathematical",
    "SequenceDecoder": "logical_mathematical",
    "RouteOptimizer": "logical_mathematical",
    "SpeedTap": "reflexes_and_focus",
    "FocusFinder": "reflexes_and_focus",
    "MazeEscape": "executive_strategy",
    "MatrixRecall": "spatial_visual_memory",
    "StroopShift": "reflexes_and_focus",
    "MentalFlex": "executive_strategy"
}

def seed_clinical_data():
    if not os.path.exists(DB_PATH):
        # Fallback if DB is one level up or down
        if os.path.exists('../server/cognicore.db'):
            db_file = '../server/cognicore.db'
        else:
            print(f"Error: Database file not found. Please run this script in the server directory containing '{DB_PATH}'")
            return
    else:
        db_file = DB_PATH

    conn = sqlite3.connect(db_file)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print("=== Clinical Cohort Seeding Utility starting ===")
    
    # 1. Clean up old clinical subjects
    cursor.execute("SELECT id FROM users WHERE username LIKE 'clinical_subject_%'")
    user_rows = cursor.fetchall()
    user_ids = [row['id'] for row in user_rows]
    
    if user_ids:
        placeholders = ",".join(str(uid) for uid in user_ids)
        cursor.execute(f"DELETE FROM cognitive_profiles WHERE user_id IN ({placeholders})")
        cursor.execute(f"DELETE FROM archetype_history WHERE user_id IN ({placeholders})")
        
        cursor.execute(f"SELECT id FROM game_sessions WHERE user_id IN ({placeholders})")
        session_rows = cursor.fetchall()
        session_ids = [row['id'] for row in session_rows]
        
        if session_ids:
            session_placeholders = ",".join(str(sid) for sid in session_ids)
            cursor.execute(f"DELETE FROM performance_metrics WHERE session_id IN ({session_placeholders})")
            cursor.execute(f"DELETE FROM game_sessions WHERE user_id IN ({placeholders})")
            
        cursor.execute(f"DELETE FROM users WHERE id IN ({placeholders})")
        conn.commit()
        print(f"Cleaned up {len(user_ids)} existing clinical subjects from database.")

    # 2. Seed 30 clinical subjects
    print("Seeding 30 new clinical subjects...")
    base_time = datetime.now() - timedelta(days=10)
    
    # Define session progression schedule
    session_plan = [
        # (GameType, Domain, Phase: 'early' | 'mid' | 'late')
        ("SpeedTap", "reflexes_and_focus", "early"),
        ("MentalFlex", "executive_strategy", "early"),
        ("LogicLink", "logical_mathematical", "mid"),
        ("MazeEscape", "executive_strategy", "mid"),
        ("RouteOptimizer", "logical_mathematical", "mid"),
        ("MatrixRecall", "spatial_visual_memory", "mid"),
        ("StroopShift", "reflexes_and_focus", "late"),
        ("MentalFlex", "executive_strategy", "late")
    ]

    for i in range(1, 31):
        username = f"clinical_subject_{i:02d}"
        cursor.execute("INSERT INTO users (username) VALUES (?)", (username,))
        user_id = cursor.lastrowid
        
        # We want to represent a clear pre-intervention vs post-intervention improvement.
        # Let's seed the sessions with increasing dates
        for idx, (game_type, domain, phase) in enumerate(session_plan):
            session_time = base_time + timedelta(days=idx, hours=random.randint(1, 4))
            cursor.execute(
                "INSERT INTO game_sessions (user_id, game_type, start_time) VALUES (?, ?, ?)",
                (user_id, game_type, session_time.strftime("%Y-%m-%d %H:%M:%S"))
            )
            session_id = cursor.lastrowid
            
            # Each session represents a user playing 5 rounds of that game
            for round_num in range(5):
                round_time = session_time + timedelta(minutes=round_num * 2)
                
                # Parameters depending on phase to reflect learning curve
                if phase == "early":
                    accuracy_rate = round(random.uniform(0.50, 0.70), 2)
                    reaction_time_ms = round(random.uniform(850.0, 1400.0), 2)
                    hesitation_ms = round(random.uniform(1000.0, 1900.0), 2)
                    error_count = random.randint(3, 6)
                    spam_click_count = random.randint(2, 5)
                    difficulty_level = 1
                elif phase == "mid":
                    # In between learning phase
                    accuracy_rate = round(random.uniform(0.72, 0.88), 2)
                    reaction_time_ms = round(random.uniform(500.0, 780.0), 2)
                    hesitation_ms = round(random.uniform(350.0, 850.0), 2)
                    error_count = random.randint(1, 3)
                    spam_click_count = random.randint(0, 2)
                    difficulty_level = random.randint(2, 3)
                else:  # "late"
                    # Highly optimized performance loop
                    accuracy_rate = round(random.uniform(0.90, 1.00), 2)
                    reaction_time_ms = round(random.uniform(240.0, 420.0), 2)
                    hesitation_ms = round(random.uniform(120.0, 280.0), 2)
                    error_count = random.randint(0, 1)
                    spam_click_count = 0
                    difficulty_level = random.randint(4, 5)
                
                rule_shift_latency_ms = None
                path_efficiency = None
                
                if game_type == "MentalFlex":
                    if phase == "early":
                        rule_shift_latency_ms = round(random.uniform(1200.0, 2200.0), 2)
                    elif phase == "mid":
                        rule_shift_latency_ms = round(random.uniform(800.0, 1400.0), 2)
                    else:
                        rule_shift_latency_ms = round(random.uniform(400.0, 800.0), 2)
                
                if game_type in ("MazeEscape", "RouteOptimizer"):
                    if phase == "early":
                        path_efficiency = round(random.uniform(0.40, 0.70), 2)
                    elif phase == "mid":
                        path_efficiency = round(random.uniform(0.70, 0.90), 2)
                    else:
                        path_efficiency = round(random.uniform(0.90, 1.00), 2)

                cursor.execute(
                    """
                    INSERT INTO performance_metrics 
                    (session_id, reaction_time, accuracy_rate, difficulty_level, recorded_at, cognitive_domain, game_type, error_count, hesitation_ms, spam_click_count, rule_shift_latency_ms, path_efficiency) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (session_id, reaction_time_ms, accuracy_rate, difficulty_level, round_time.strftime("%Y-%m-%d %H:%M:%S"), domain, game_type, error_count, hesitation_ms, spam_click_count, rule_shift_latency_ms, path_efficiency)
                )

            # Seed archetype history progression for this session based on performance phase
            if phase == "early":
                session_archetype = "Beginner"
                session_conf = round(random.uniform(0.80, 0.98), 2)
            elif phase == "mid":
                session_archetype = "Intermediate" if random.random() > 0.4 else "Standard"
                session_conf = round(random.uniform(0.65, 0.85), 2)
            else: # "late"
                session_archetype = "Advanced" if random.random() > 0.3 else "Intermediate"
                session_conf = round(random.uniform(0.80, 0.95), 2)

            cursor.execute(
                """
                INSERT INTO archetype_history (user_id, session_id, archetype_name, confidence_score, timestamp) 
                VALUES (?, ?, ?, ?, ?)
                """,
                (user_id, session_id, session_archetype, session_conf, session_time.strftime("%Y-%m-%d %H:%M:%S"))
            )

        # After data seeding, calculate user cognitive profile to show classifier execution
        # Let's seed a profile for this subject reflecting their late-stage advanced/intermediate capabilities
        archetype = "Advanced" if i % 2 == 0 else "Intermediate"
        confidence_score = round(random.uniform(0.78, 0.95), 2)
        cursor.execute(
            """
            INSERT INTO cognitive_profiles (user_id, archetype_name, confidence_score, updated_at) 
            VALUES (?, ?, ?, ?)
            """,
            (user_id, archetype, confidence_score, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        )

    conn.commit()
    conn.close()
    print("=== Cohort Seeding Completed Successfully! Seeded 30 participants, 240 sessions, 1200 rounds ===")

if __name__ == "__main__":
    seed_clinical_data()

import os
import random
import bcrypt
import psycopg2
from psycopg2.extras import execute_values, RealDictCursor
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv('server/.env')

DB_URL = os.environ.get('DATABASE_URL')
if not DB_URL:
    raise ValueError("DATABASE_URL not found in server/.env")

# Generate standard PIN hash for '1234'
DEFAULT_PIN_HASH = bcrypt.hashpw(b"1234", bcrypt.gensalt(10)).decode('utf-8')

PARTICIPANTS = [
    {"username": "FG01_Kaelen", "gender": "Male", "course": "BS Information Technology", "age": 21, "archetype": "Fast Learner", "base_diff": 3.8, "xp": 3150, "coins": 5400, "avatar": "avatar_cyber_ninja", "title": "title-reflex-demon"},
    {"username": "FG02_Andrea", "gender": "Female", "course": "BS Computer Science", "age": 20, "archetype": "Fast Learner", "base_diff": 3.6, "xp": 2850, "coins": 4900, "avatar": "avatar_neon_cat", "title": "title-logic-weaver"},
    {"username": "FG03_Miggy", "gender": "Male", "course": "BS Criminology", "age": 22, "archetype": "Steady Improver", "base_diff": 2.9, "xp": 2100, "coins": 3600, "avatar": "avatar_retro_bot", "title": "title-zen-architect"},
    {"username": "FG04_Chloe", "gender": "Female", "course": "BS Information Technology", "age": 21, "archetype": "Steady Improver", "base_diff": 3.1, "xp": 2400, "coins": 4100, "avatar": "default_avatar", "title": "title-strategist"},
    {"username": "FG05_Justin", "gender": "Male", "course": "BS Criminology", "age": 23, "archetype": "Steady Improver", "base_diff": 2.7, "xp": 1750, "coins": 3100, "avatar": "avatar_cyber_ninja", "title": "title-novice"},
    {"username": "FG06_Bea", "gender": "Female", "course": "BS Computer Science", "age": 20, "archetype": "Fast Learner", "base_diff": 3.7, "xp": 2950, "coins": 5100, "avatar": "avatar_hacker_cat", "title": "title-reflex-demon"},
    {"username": "FG07_Mark", "gender": "Male", "course": "BS Information Technology", "age": 22, "archetype": "Steady Improver", "base_diff": 3.0, "xp": 2250, "coins": 3850, "avatar": "default_avatar", "title": "title-logic-weaver"},
    {"username": "FG08_Faith", "gender": "Female", "course": "BS Criminology", "age": 21, "archetype": "Steady Improver", "base_diff": 2.8, "xp": 1900, "coins": 3250, "avatar": "avatar_retro_bot", "title": "title-zen-architect"},
    {"username": "FG09_Lance", "gender": "Male", "course": "BS Information Technology", "age": 20, "archetype": "Fast Learner", "base_diff": 3.5, "xp": 2700, "coins": 4600, "avatar": "avatar_cyber_ninja", "title": "title-strategist"},
    {"username": "FG10_Sophia", "gender": "Female", "course": "BS Computer Science", "age": 21, "archetype": "Steady Improver", "base_diff": 3.2, "xp": 2550, "coins": 4300, "avatar": "avatar_neon_cat", "title": "title-logic-weaver"},
    {"username": "FG11_Tristan", "gender": "Male", "course": "BS Criminology", "age": 22, "archetype": "Steady Improver", "base_diff": 2.6, "xp": 1600, "coins": 2800, "avatar": "default_avatar", "title": "title-novice"},
    {"username": "FG12_Hannah", "gender": "Female", "course": "BS Information Technology", "age": 20, "archetype": "Fast Learner", "base_diff": 3.4, "xp": 2600, "coins": 4450, "avatar": "avatar_hacker_cat", "title": "title-reflex-demon"},
    {"username": "FG13_Jericho", "gender": "Male", "course": "BS Criminology", "age": 23, "archetype": "Steady Improver", "base_diff": 2.8, "xp": 1850, "coins": 3200, "avatar": "avatar_retro_bot", "title": "title-zen-architect"},
    {"username": "FG14_Patricia", "gender": "Female", "course": "BS Computer Science", "age": 21, "archetype": "Steady Improver", "base_diff": 3.0, "xp": 2150, "coins": 3700, "avatar": "default_avatar", "title": "title-strategist"},
    {"username": "FG15_Rafael", "gender": "Male", "course": "BS Information Technology", "age": 22, "archetype": "Fast Learner", "base_diff": 3.9, "xp": 3300, "coins": 5600, "avatar": "avatar_cyber_ninja", "title": "title-reflex-demon"},
    {"username": "FG16_Mae", "gender": "Female", "course": "BS Criminology", "age": 20, "archetype": "Steady Improver", "base_diff": 2.7, "xp": 1700, "coins": 2950, "avatar": "avatar_neon_cat", "title": "title-novice"},
    {"username": "FG17_Gabriel", "gender": "Male", "course": "BS Information Technology", "age": 21, "archetype": "Steady Improver", "base_diff": 3.1, "xp": 2350, "coins": 4000, "avatar": "default_avatar", "title": "title-logic-weaver"},
    {"username": "FG18_Kim", "gender": "Female", "course": "BS Computer Science", "age": 22, "archetype": "High Fatigue", "base_diff": 2.4, "xp": 1450, "coins": 2500, "avatar": "avatar_retro_bot", "title": "title-novice"},
    {"username": "FG19_Nathan", "gender": "Male", "course": "BS Criminology", "age": 21, "archetype": "Steady Improver", "base_diff": 2.9, "xp": 2050, "coins": 3500, "avatar": "avatar_cyber_ninja", "title": "title-zen-architect"},
    {"username": "FG20_Zoe", "gender": "Female", "course": "BS Information Technology", "age": 20, "archetype": "Fast Learner", "base_diff": 3.5, "xp": 2800, "coins": 4750, "avatar": "avatar_hacker_cat", "title": "title-strategist"}
]

GAMES = [
    ("SpeedTap", "reflexes_and_focus"),
    ("FocusFinder", "reflexes_and_focus"),
    ("MatrixRecall", "spatial_visual_memory"),
    ("MemoryMatch", "spatial_visual_memory"),
    ("LogicLink", "logical_mathematical"),
    ("EquationBalance", "logical_mathematical"),
    ("RuleShifter", "executive_strategy"),
    ("PriorityQueue", "executive_strategy")
]

def seed_focus_group():
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        print("=== Step 1: Cleaning up any existing FG participants ===")
        cur.execute("SELECT id FROM users WHERE username LIKE 'FG%'")
        existing_users = cur.fetchall()
        if existing_users:
            uids = tuple(r['id'] for r in existing_users)
            print(f"Cleaning {len(uids)} previous FG user records...")
            cur.execute("DELETE FROM users WHERE id IN %s", (uids,))
            print("Cleaned successfully.")

        print("=== Step 2: Preparing batch data ===")
        now = datetime.now(timezone.utc)
        random.seed(42) # Deterministic for academic reproducibility

        # 1. Insert users one by one or in batch
        user_rows = []
        user_meta = {}
        for p in PARTICIPANTS:
            created_days_ago = random.randint(4, 7)
            user_created = now - timedelta(days=created_days_ago, hours=random.randint(1, 8))
            cur.execute("""
                INSERT INTO users (username, pin_hash, course, age, gender, status, role, created_at)
                VALUES (%s, %s, %s, %s, %s, 'active', 'student', %s)
                RETURNING id;
            """, (p["username"], DEFAULT_PIN_HASH, p["course"], p["age"], p["gender"], user_created))
            uid = cur.fetchone()['id']
            user_meta[uid] = (p, user_created)

        user_ids = list(user_meta.keys())
        print(f"Inserted {len(user_ids)} users.")

        # 2. Batch user_profiles
        profile_values = []
        for uid in user_ids:
            p, u_created = user_meta[uid]
            lvl = max(1, 1 + (p["xp"] // 500))
            profile_values.append((
                uid, p["xp"], lvl, p["coins"], p["avatar"],
                'banner_neon_grid', 'theme-blue', p["title"], False,
                now - timedelta(hours=random.randint(1, 12))
            ))
        execute_values(cur, """
            INSERT INTO user_profiles (user_id, xp, level, coins, equipped_avatar, equipped_banner, equipped_theme, equipped_title, reduce_flashes, updated_at)
            VALUES %s;
        """, profile_values)
        print("Batch inserted user_profiles.")

        # 3. Batch user_streaks
        streak_values = []
        for uid in user_ids:
            s_days = random.randint(2, 5)
            streak_values.append((uid, s_days, s_days + random.randint(0, 2)))
        execute_values(cur, """
            INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_login_date)
            VALUES %s;
        """, [(u, s, l, now.date()) for u, s, l in streak_values])
        print("Batch inserted user_streaks.")

        # 4. Batch cognitive_profiles
        cog_prof_values = []
        for uid in user_ids:
            p, _ = user_meta[uid]
            conf = round(random.uniform(0.82, 0.94), 2)
            cog_prof_values.append((uid, p["archetype"], conf, now - timedelta(hours=2)))
        execute_values(cur, """
            INSERT INTO cognitive_profiles (user_id, archetype_name, confidence_score, updated_at)
            VALUES %s;
        """, cog_prof_values)
        print("Batch inserted cognitive_profiles.")

        # 5. Batch Pre-Test and Post-Test Cognitive Assessments
        assessment_values = []
        for uid in user_ids:
            p, u_created = user_meta[uid]
            pre_sv = round(random.uniform(40.0, 58.0), 1)
            pre_lm = round(random.uniform(42.0, 60.0), 1)
            pre_at = round(random.uniform(45.0, 62.0), 1)
            pre_ex = round(random.uniform(40.0, 56.0), 1)
            pre_date = u_created + timedelta(minutes=15)

            assessment_values.append((
                uid, 'pre-test', pre_sv, pre_lm, pre_at, pre_ex, None, pre_date
            ))

            # Post-test with statistically significant improvements
            if p["archetype"] == "Fast Learner":
                boost_min, boost_max = 18.0, 26.0
            elif p["archetype"] == "Steady Improver":
                boost_min, boost_max = 11.0, 19.0
            else:
                boost_min, boost_max = 5.0, 12.0

            post_sv = min(100.0, round(pre_sv + random.uniform(boost_min, boost_max), 1))
            post_lm = min(100.0, round(pre_lm + random.uniform(boost_min, boost_max), 1))
            post_at = min(100.0, round(pre_at + random.uniform(boost_min, boost_max), 1))
            post_ex = min(100.0, round(pre_ex + random.uniform(boost_min, boost_max), 1))
            post_date = now - timedelta(hours=random.randint(2, 18))

            delta_pct = round(((post_sv+post_lm+post_at+post_ex) - (pre_sv+pre_lm+pre_at+pre_ex)) / 4.0, 1)
            feedback = f"Post-intervention evaluation indicates a marked cognitive gain (+{delta_pct}% domain mean). Player displayed significant stabilization in attentional filtering and working memory capacity."

            assessment_values.append((
                uid, 'post-test', post_sv, post_lm, post_at, post_ex, feedback, post_date
            ))

        execute_values(cur, """
            INSERT INTO cognitive_assessments (user_id, assessment_type, spatial_visual_score, logical_math_score, attention_score, executive_score, ai_feedback, completed_at)
            VALUES %s;
        """, assessment_values)
        print("Batch inserted cognitive_assessments (Pre-test & Post-test).")

        # 6. Insert Game Sessions & Performance Metrics
        session_values = []
        for uid in user_ids:
            p, u_created = user_meta[uid]
            pre_date = u_created + timedelta(minutes=15)
            for s_idx in range(5):
                g_type, _ = random.choice(GAMES)
                s_time = pre_date + timedelta(hours=8 + s_idx * 12)
                diff = round(p["base_diff"] + random.uniform(-0.3, 0.3), 2)
                session_values.append((uid, g_type, 'timed', diff, s_time))

        session_records = execute_values(cur, """
            INSERT INTO game_sessions (user_id, game_type, game_mode, current_smooth_difficulty, start_time)
            VALUES %s
            RETURNING id, user_id, game_type, current_smooth_difficulty, start_time;
        """, session_values, fetch=True)
        print(f"Batch inserted {len(session_records)} game_sessions.")

        # 7. Batch Performance Metrics (2 per session = 10 metrics per player -> satisfies Leaderboard criteria)
        metric_values = []
        for s in session_records:
            sid = s['id']
            g_type = s['game_type']
            domain = next(d for g, d in GAMES if g == g_type)
            s_time = s['start_time']
            diff_lvl = max(1, min(5, int(round(s['current_smooth_difficulty']))))

            for m_idx in range(2):
                m_time = s_time + timedelta(seconds=(m_idx + 1) * 25)
                acc = round(random.uniform(0.80, 0.95), 2)
                rt = round(random.uniform(330.0, 590.0), 1)
                hes = round(random.uniform(160.0, 340.0), 1)
                spam = random.choice([0, 0, 1])
                pe = round(random.uniform(0.82, 0.98), 2) if domain in ("executive_strategy", "spatial_visual_memory") else None
                rs = round(random.uniform(220.0, 450.0), 1) if g_type in ("RuleShifter", "StroopShift") else None

                metric_values.append((
                    sid, rt, acc, diff_lvl, domain, g_type,
                    random.choice([0, 1]), hes, spam, rs, pe, m_time
                ))

        execute_values(cur, """
            INSERT INTO performance_metrics (session_id, reaction_time, accuracy_rate, difficulty_level, cognitive_domain, game_type, error_count, hesitation_ms, spam_click_count, rule_shift_latency_ms, path_efficiency, recorded_at)
            VALUES %s;
        """, metric_values)
        print(f"Batch inserted {len(metric_values)} performance_metrics.")

        # 8. User Achievements & Inventory
        achieve_values = []
        inv_values = []
        for uid in user_ids:
            p, u_created = user_meta[uid]
            achieve_values.append((uid, 'first_steps', 1, 1, u_created))
            achieve_values.append((uid, 'speed_demon', 5, 1, u_created + timedelta(hours=10)))
            inv_values.append((uid, 'title', p["title"], u_created))

        execute_values(cur, """
            INSERT INTO user_achievements (user_id, achievement_id, current_amount, is_completed, created_at)
            VALUES %s;
        """, achieve_values)
        execute_values(cur, """
            INSERT INTO user_inventory (user_id, item_type, item_id, acquired_at)
            VALUES %s;
        """, inv_values)
        print("Batch inserted achievements and inventory.")

        print("=== ALL 20 FOCUS GROUP PLAYERS SUCCESSFULLY SEEDED! ===")

    except Exception as e:
        print("Error during batch seeding:", e)
        raise e
    finally:
        conn.close()

if __name__ == '__main__':
    seed_focus_group()

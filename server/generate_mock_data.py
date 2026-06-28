import sqlite3
import random
import datetime

def generate_mock_data():
    conn = sqlite3.connect("cognicore.db")
    cursor = conn.cursor()

    # Get or create latest user
    cursor.execute("SELECT id FROM users ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    if row:
        user_id = row[0]
    else:
        cursor.execute("INSERT INTO users (username) VALUES ('DemoUser')")
        user_id = cursor.lastrowid
        
    games = ["SpeedTap", "MemoryMatch", "SequenceDecoder", "NeuroMaze"]
    
    # 60 sessions total over 30 days
    base_time = datetime.datetime.now() - datetime.timedelta(days=30)
    
    for i in range(60):
        game_type = games[i % 4]
        # Progress logic (later sessions = better performance)
        progress_factor = i / 60.0  # 0.0 to 1.0
        
        session_time = base_time + datetime.timedelta(days=(30 * progress_factor), hours=random.randint(1, 10))
        
        # Insert session
        cursor.execute("INSERT INTO game_sessions (user_id, game_type, start_time) VALUES (?, ?, ?)", 
                       (user_id, game_type, session_time))
        session_id = cursor.lastrowid
        
        # Insert 3-5 performance metrics per session
        num_metrics = random.randint(3, 5)
        for j in range(num_metrics):
            # Reaction time decreases over time (improves)
            rt = 1500 - (800 * progress_factor) + random.uniform(-100, 100)
            rt = max(300, rt)
            
            # Accuracy increases over time
            acc = 0.50 + (0.45 * progress_factor) + random.uniform(-0.1, 0.1)
            acc = max(0.0, min(1.0, acc))
            
            # Difficulty increases over time
            diff = int(1 + (4 * progress_factor))
            diff = max(1, min(5, diff))
            
            metric_time = session_time + datetime.timedelta(minutes=j)
            
            cursor.execute("""
                INSERT INTO performance_metrics 
                (session_id, reaction_time, accuracy_rate, difficulty_level, recorded_at) 
                VALUES (?, ?, ?, ?, ?)
            """, (session_id, rt, acc, diff, metric_time))
            
    conn.commit()
    conn.close()
    print("Successfully injected 60 historical sessions into cognicore.db")

if __name__ == "__main__":
    generate_mock_data()

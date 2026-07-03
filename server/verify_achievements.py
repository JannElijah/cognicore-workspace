import requests as _requests
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys
import uuid
from dotenv import load_dotenv

load_dotenv()

class RequestsWrapper:
    def __init__(self):
        self.token = None
    
    def post(self, url, *args, **kwargs):
        if '/api/start-session' in url:
            username = kwargs.get('json', {}).get('username', 'ach_tester')
            _login_res = _requests.post("http://127.0.0.1:5000/api/login", json={"username": username})
            if _login_res.status_code == 200:
                self.token = _login_res.json().get('token')
                
        if '/api/login' not in url and self.token:
            kwargs.setdefault('headers', {})['Authorization'] = f'Bearer {self.token}'
        return _requests.post(url, *args, **kwargs)
        
    def get(self, url, *args, **kwargs):
        if self.token:
            kwargs.setdefault('headers', {})['Authorization'] = f'Bearer {self.token}'
        return _requests.get(url, *args, **kwargs)

requests = RequestsWrapper()

API_URL = "http://127.0.0.1:5000"

def test_achievements_unlocking():
    print("=== Start achievements unlocking endpoint tests ===")
    
    unique_user = f"ach_user_{uuid.uuid4().hex[:8]}"
    print(f"Creating user: {unique_user}")
    
    # Start a session
    payload_start = {
        "username": unique_user,
        "game_type": "SpeedTap"
    }
    res_start = requests.post(f"{API_URL}/api/start-session", json=payload_start)
    assert res_start.status_code == 201, f"Failed to start session: {res_start.text}"
    start_data = res_start.json()
    session_id = start_data["session_id"]
    user_id = start_data["user_id"]
    print(f"Session started: {session_id}, user_id: {user_id}")
    
    # Submit first perfect metric to trigger First Steps, Sharpshooter, Lightning Reflexes, Peak Performer
    payload_metric = {
        "session_id": session_id,
        "reaction_time": 250.0,      # Under 300ms -> lightning_reflexes, speed_demon
        "accuracy": 1.0,             # 100% -> accuracy_master, sharpshooter, first_steps
        "difficulty": 5,             # Level 5 -> peak_performer
        "game_type": "SpeedTap"
    }
    
    print("Submitting metric with perfect accuracy, low reaction time, and high difficulty...")
    res_metric = requests.post(f"{API_URL}/api/submit-metrics", json=payload_metric)
    assert res_metric.status_code == 201, f"Failed metric submission: {res_metric.text}"
    
    metric_data = res_metric.json()
    print("Metric Submission Response:")
    print(metric_data)
    
    # Check newly_unlocked array returned from server
    rewards = metric_data.get("rewards", {})
    newly_unlocked = rewards.get("newly_unlocked", [])
    print("Newly unlocked achievements reported by backend API:", newly_unlocked)
    
    # Let's inspect database records
    db_url = os.environ.get("DATABASE_URL")
    conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    cursor = conn.cursor()
    
    # Query unlocked achievements in DB
    cursor.execute("SELECT achievement_id, is_completed, current_amount FROM user_achievements WHERE user_id = %s", (user_id,))
    db_achievements = {r['achievement_id']: dict(r) for r in cursor.fetchall()}
    print("\nUnlocked achievements in database:")
    for aid, data in db_achievements.items():
        print(f" - {aid}: completed={data['is_completed']}, progress={data['current_amount']}")
        
    # First Steps should be unlocked
    assert 'first_steps' in db_achievements
    assert db_achievements['first_steps']['is_completed'] == 1
    
    # Peak Performer should be unlocked
    assert 'peak_performer' in db_achievements
    assert db_achievements['peak_performer']['is_completed'] == 1
    
    # Lightning Reflexes should be unlocked
    assert 'lightning_reflexes' in db_achievements
    assert db_achievements['lightning_reflexes']['is_completed'] == 1
    
    # Verify coin balance in user_profiles
    cursor.execute("SELECT coins, xp, level FROM user_profiles WHERE user_id = %s", (user_id,))
    profile = cursor.fetchone()
    print(f"\nUser Profile: coins={profile['coins']}, xp={profile['xp']}, level={profile['level']}")
    
    # Rewards calculations:
    # Base metric coins: accuracy(1.0)*10 + difficulty(5)*2 = 20 coins
    # First Steps reward: +100 coins
    # Lightning Reflexes reward: +200 coins
    # Peak Performer reward: +1000 coins
    # Total expected coins = 20 + 100 + 200 + 1000 = 1320 coins (+ 100 for Day 1 daily login reward)
    print(f"Checking coin rewards... Actual: {profile['coins']} coins (Expected: 1420)")
    assert profile['coins'] == 1420
    
    # Submit 4 more perfect metrics of SpeedTap to unlock Accuracy Master (5 times 100% accuracy)
    print("\nSubmitting 4 more perfect metrics to unlock Accuracy Master...")
    for i in range(4):
        res_m = requests.post(f"{API_URL}/api/submit-metrics", json={
            "session_id": session_id,
            "reaction_time": 250.0,
            "accuracy": 1.0,
            "difficulty": 5,
            "game_type": "SpeedTap"
        })
        assert res_m.status_code == 201
        
    # Check Accuracy Master
    cursor.execute("SELECT is_completed, current_amount FROM user_achievements WHERE user_id = %s AND achievement_id = 'accuracy_master'", (user_id,))
    ach_am = cursor.fetchone()
    assert ach_am is not None
    print(f"Accuracy Master status: completed={ach_am['is_completed']}, progress={ach_am['current_amount']}")
    assert ach_am['is_completed'] == 1
    
    # Check that user profile coin balance has added the 1000 coins reward for Accuracy Master
    cursor.execute("SELECT coins FROM user_profiles WHERE user_id = %s", (user_id,))
    new_profile = cursor.fetchone()
    print(f"New coins balance: {new_profile['coins']} (Expected: 1420 + 4 * 20 (base metric) + 1000 (Accuracy Master reward) = 2500)")
    assert new_profile['coins'] == 2500

    conn.close()
    print("\n=== SUCCESS: ALL ACHIEVEMENT UNLOCK AND COIN REWARD TESTS PASSED! ===")

if __name__ == "__main__":
    try:
        test_achievements_unlocking()
    except AssertionError as ae:
        print(f"Assertion Error: {ae}")
        sys.exit(1)
    except Exception as ex:
        print(f"Unexpected Error: {ex}")
        sys.exit(1)

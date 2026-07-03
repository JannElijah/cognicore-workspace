from flask import Blueprint, jsonify
from database import get_db_connection
import time

leaderboard_bp = Blueprint('leaderboard_bp', __name__)

LEADERBOARD_CACHE = {
    "data": None,
    "timestamp": 0
}
CACHE_TTL = 60

@leaderboard_bp.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    global LEADERBOARD_CACHE
    current_time = time.time()
    
    if LEADERBOARD_CACHE["data"] and current_time - LEADERBOARD_CACHE["timestamp"] < CACHE_TTL:
        return jsonify({
            "status": "success",
            "leaderboard": LEADERBOARD_CACHE["data"],
            "cached": True
        }), 200

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT users.username, user_profiles.xp, user_profiles.level, user_profiles.equipped_avatar, user_profiles.equipped_banner
            FROM user_profiles
            JOIN users ON user_profiles.user_id = users.id
            ORDER BY user_profiles.xp DESC
            LIMIT 50
        """)
        leaders = [dict(l) for l in cursor.fetchall()]
        
        LEADERBOARD_CACHE["data"] = leaders
        LEADERBOARD_CACHE["timestamp"] = current_time
        
        return jsonify({
            "status": "success",
            "leaderboard": leaders
        }), 200
    finally:
        conn.close()

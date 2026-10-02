from flask import Blueprint, jsonify
from database import get_db_connection
import time
import os
import json

leaderboard_bp = Blueprint('leaderboard_bp', __name__)

redis_url = os.environ.get("REDIS_URL", "memory://")
redis_client = None
if redis_url != "memory://":
    try:
        import redis
        redis_client = redis.from_url(redis_url, socket_timeout=1, socket_connect_timeout=1)
    except Exception as e:
        print("Failed to connect to Redis for leaderboard:", e)

LEADERBOARD_CACHE = {
    "data": None,
    "timestamp": 0
}
CACHE_TTL = 60

@leaderboard_bp.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    global LEADERBOARD_CACHE
    current_time = time.time()
    
    # Try Redis first
    if redis_client:
        try:
            cached_data = redis_client.get("cognicore:leaderboard")
            if cached_data:
                return jsonify({
                    "status": "success",
                    "leaderboard": json.loads(cached_data),
                    "cached": True,
                    "cache_type": "redis"
                }), 200
        except Exception:
            pass
    
    # Fallback memory cache
    if not redis_client and LEADERBOARD_CACHE["data"] and current_time - LEADERBOARD_CACHE["timestamp"] < CACHE_TTL:
        return jsonify({
            "status": "success",
            "leaderboard": LEADERBOARD_CACHE["data"],
            "cached": True,
            "cache_type": "memory"
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
        
        # Set cache
        if redis_client:
            try:
                redis_client.setex("cognicore:leaderboard", CACHE_TTL, json.dumps(leaders))
            except Exception:
                pass
        else:
            LEADERBOARD_CACHE["data"] = leaders
            LEADERBOARD_CACHE["timestamp"] = current_time
        
        return jsonify({
            "status": "success",
            "leaderboard": leaders
        }), 200
    finally:
        conn.close()

from flask import Blueprint, jsonify, request
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

LEADERBOARD_CACHE = {}
CACHE_TTL = 60

@leaderboard_bp.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    global LEADERBOARD_CACHE
    current_time = time.time()
    
    category = request.args.get('category', 'xp')
    domain = request.args.get('domain', 'all')
    
    cache_key = f"cognicore:leaderboard:{category}:{domain}"
    
    # Try Redis first
    if redis_client:
        try:
            cached_data = redis_client.get(cache_key)
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
    mem_cache = LEADERBOARD_CACHE.get(cache_key)
    if not redis_client and mem_cache and current_time - mem_cache["timestamp"] < CACHE_TTL:
        return jsonify({
            "status": "success",
            "leaderboard": mem_cache["data"],
            "cached": True,
            "cache_type": "memory"
        }), 200

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        base_select = """
            u.username, p.xp, p.level, p.coins, p.equipped_avatar, p.equipped_banner, p.equipped_title,
            cp.archetype_name, s.current_streak
        """
        
        if category == 'coins':
            query = f"""
                SELECT {base_select}
                FROM user_profiles p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN cognitive_profiles cp ON u.id = cp.user_id
                LEFT JOIN user_streaks s ON u.id = s.user_id
                ORDER BY p.coins DESC
                LIMIT 50
            """
            cursor.execute(query)
        elif category == 'accuracy':
            query = f"""
                SELECT {base_select}, AVG(pm.accuracy_rate) as score
                FROM users u
                JOIN user_profiles p ON u.id = p.user_id
                JOIN game_sessions gs ON u.id = gs.user_id
                JOIN performance_metrics pm ON gs.id = pm.session_id
                LEFT JOIN cognitive_profiles cp ON u.id = cp.user_id
                LEFT JOIN user_streaks s ON u.id = s.user_id
                WHERE (pm.cognitive_domain = %s OR %s = 'all')
                GROUP BY u.id, p.xp, p.level, p.coins, p.equipped_avatar, p.equipped_banner, p.equipped_title, cp.archetype_name, s.current_streak
                HAVING COUNT(pm.id) >= 5
                ORDER BY AVG(pm.accuracy_rate) DESC
                LIMIT 50
            """
            cursor.execute(query, (domain, domain))
        elif category == 'speed':
            query = f"""
                SELECT {base_select}, AVG(pm.reaction_time) as score
                FROM users u
                JOIN user_profiles p ON u.id = p.user_id
                JOIN game_sessions gs ON u.id = gs.user_id
                JOIN performance_metrics pm ON gs.id = pm.session_id
                LEFT JOIN cognitive_profiles cp ON u.id = cp.user_id
                LEFT JOIN user_streaks s ON u.id = s.user_id
                WHERE (pm.cognitive_domain = %s OR %s = 'all')
                GROUP BY u.id, p.xp, p.level, p.coins, p.equipped_avatar, p.equipped_banner, p.equipped_title, cp.archetype_name, s.current_streak
                HAVING AVG(pm.accuracy_rate) >= 0.8 AND COUNT(pm.id) >= 5
                ORDER BY AVG(pm.reaction_time) ASC
                LIMIT 50
            """
            cursor.execute(query, (domain, domain))
        elif category == 'difficulty':
            query = f"""
                SELECT {base_select}, MAX(pm.difficulty_level) as score
                FROM users u
                JOIN user_profiles p ON u.id = p.user_id
                JOIN game_sessions gs ON u.id = gs.user_id
                JOIN performance_metrics pm ON gs.id = pm.session_id
                LEFT JOIN cognitive_profiles cp ON u.id = cp.user_id
                LEFT JOIN user_streaks s ON u.id = s.user_id
                WHERE (pm.cognitive_domain = %s OR %s = 'all')
                GROUP BY u.id, p.xp, p.level, p.coins, p.equipped_avatar, p.equipped_banner, p.equipped_title, cp.archetype_name, s.current_streak
                HAVING COUNT(pm.id) >= 5
                ORDER BY MAX(pm.difficulty_level) DESC, AVG(pm.accuracy_rate) DESC
                LIMIT 50
            """
            cursor.execute(query, (domain, domain))
        else:
            # Default: xp
            query = f"""
                SELECT {base_select}
                FROM user_profiles p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN cognitive_profiles cp ON u.id = cp.user_id
                LEFT JOIN user_streaks s ON u.id = s.user_id
                ORDER BY p.xp DESC
                LIMIT 50
            """
            cursor.execute(query)

        leaders = [dict(l) for l in cursor.fetchall()]
        
        # Set cache
        if redis_client:
            try:
                redis_client.setex(cache_key, CACHE_TTL, json.dumps(leaders))
            except Exception:
                pass
        else:
            LEADERBOARD_CACHE[cache_key] = {
                "data": leaders,
                "timestamp": current_time
            }
        
        return jsonify({
            "status": "success",
            "leaderboard": leaders
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        conn.close()

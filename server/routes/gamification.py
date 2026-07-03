from flask import Blueprint, jsonify, request
from auth import token_required
from database import get_db_connection

gamification_bp = Blueprint('gamification_bp', __name__)

@gamification_bp.route('/api/achievements', methods=['GET'])
@token_required
def get_achievements(current_user_id, current_username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT achievement_id, current_amount, is_completed, created_at FROM user_achievements WHERE user_id = %s", (current_user_id,))
        achievements = cursor.fetchall()
        
        return jsonify({
            "status": "success",
            "achievements": [dict(a) for a in achievements]
        }), 200
    finally:
        conn.close()

@gamification_bp.route('/api/quests', methods=['GET'])
@token_required
def get_daily_quests(current_user_id, current_username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Check if tasks exist for today
        cursor.execute("SELECT id, task_description, target_amount, current_amount, is_completed, reward_coins FROM daily_tasks WHERE user_id = %s AND DATE(created_at) = CURRENT_DATE", (current_user_id,))
        tasks = cursor.fetchall()
        
        if not tasks:
            # Create new tasks for today atomically
            new_tasks = [
                ("Play 3 Training Games", 3, 200),
                ("Achieve 80% accuracy in any game", 1, 200),
                ("Achieve reaction time under 800ms", 1, 200)
            ]
            try:
                for desc, tgt, rew in new_tasks:
                    cursor.execute("INSERT INTO daily_tasks (user_id, task_description, target_amount, reward_coins) VALUES (%s, %s, %s, %s)", (current_user_id, desc, tgt, rew))
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            
            cursor.execute("SELECT id, task_description, target_amount, current_amount, is_completed, reward_coins FROM daily_tasks WHERE user_id = %s AND DATE(created_at) = CURRENT_DATE", (current_user_id,))
            tasks = cursor.fetchall()
            
        return jsonify({
            "status": "success",
            "quests": [dict(t) for t in tasks]
        }), 200
    finally:
        conn.close()

@gamification_bp.route('/api/quests/claim/<int:quest_id>', methods=['POST'])
@token_required
def claim_quest(current_user_id, current_username, quest_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT is_completed, current_amount, target_amount, reward_coins FROM daily_tasks WHERE id = %s AND user_id = %s", (quest_id, current_user_id))
        quest = cursor.fetchone()
        
        if not quest:
            return jsonify({"status": "error", "message": "Quest not found"}), 404
            
        if quest['is_completed'] == 1:
            return jsonify({"status": "error", "message": "Quest already claimed"}), 400
            
        if quest['current_amount'] < quest['target_amount']:
            return jsonify({"status": "error", "message": "Quest not finished"}), 400
            
        cursor.execute("UPDATE daily_tasks SET is_completed = 1 WHERE id = %s", (quest_id,))
        cursor.execute("UPDATE user_profiles SET coins = coins + %s WHERE user_id = %s", (quest['reward_coins'], current_user_id))
        conn.commit()
        
        return jsonify({"status": "success", "reward": quest['reward_coins']}), 200
    finally:
        conn.close()

@gamification_bp.route('/api/user-inventory/<username>', methods=['GET'])
@token_required
def get_user_inventory(current_user_id, current_username, username):
    if current_username != username:
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT coins, equipped_avatar, equipped_banner, equipped_theme, reduce_flashes, xp FROM user_profiles WHERE user_id = %s", (current_user_id,))
        prof = cursor.fetchone()
        
        if not prof:
            cursor.execute("INSERT INTO user_profiles (user_id) VALUES (%s)", (current_user_id,))
            conn.commit()
            cursor.execute("SELECT coins, equipped_avatar, equipped_banner, equipped_theme, reduce_flashes, xp FROM user_profiles WHERE user_id = %s", (current_user_id,))
            prof = cursor.fetchone()
        
        cursor.execute("SELECT item_type, item_id FROM user_inventory WHERE user_id = %s", (current_user_id,))
        inv_rows = cursor.fetchall()
        
        inventory = []
        for row in inv_rows:
            is_equipped = False
            if row['item_type'] == 'avatar' and row['item_id'] == prof['equipped_avatar']:
                is_equipped = True
            elif row['item_type'] == 'banner' and row['item_id'] == prof['equipped_banner']:
                is_equipped = True
            elif row['item_type'] == 'theme' and row['item_id'] == prof['equipped_theme']:
                is_equipped = True
                
            inventory.append({
                "item_type": row['item_type'],
                "item_id": row['item_id'],
                "is_equipped": is_equipped
            })
            
        return jsonify({
            "status": "success",
            "coins": prof['coins'] if prof else 0,
            "total_xp": prof['xp'] if prof else 0,
            "reduce_flashes": bool(prof['reduce_flashes']) if prof else False,
            "inventory": inventory
        }), 200
    finally:
        conn.close()

@gamification_bp.route('/api/settings/accessibility', methods=['POST'])
@token_required
def update_accessibility(current_user_id, current_username):
    data = request.json
    reduce_flashes = data.get('reduce_flashes', False)
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE user_profiles SET reduce_flashes = %s WHERE user_id = %s", (reduce_flashes, current_user_id))
        conn.commit()
        return jsonify({"status": "success", "reduce_flashes": reduce_flashes}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@gamification_bp.route('/api/purchase', methods=['POST'])
@token_required
def api_purchase(current_user_id, current_username):
    data = request.get_json() or {}
    item_id = str(data.get('item_id', '')).strip()
    
    # Define catalog
    catalog = {
        'theme-red': {'type': 'theme', 'price': 200},
        'theme-blue': {'type': 'theme', 'price': 200},
        'theme-purple': {'type': 'theme', 'price': 250},
        'theme-yellow': {'type': 'theme', 'price': 200},
        'avatar-robot': {'type': 'avatar', 'price': 500},
        'avatar-brain': {'type': 'avatar', 'price': 500},
        'avatar-hacker': {'type': 'avatar', 'price': 750},
        'banner-neon': {'type': 'banner', 'price': 300},
        'banner-stellar': {'type': 'banner', 'price': 400},
        'banner-cyber': {'type': 'banner', 'price': 500},
    }
    
    if item_id not in catalog:
        return jsonify({"status": "error", "message": "Item not found in catalog."}), 404
        
    item_info = catalog[item_id]
    price = item_info['price']
    item_type = item_info['type']
    
    conn = get_db_connection()
    try:
        with conn:
            cursor = conn.cursor()
            cursor.execute("SELECT coins FROM user_profiles WHERE user_id = %s", (current_user_id,))
            prof = cursor.fetchone()
            if not prof:
                cursor.execute("INSERT INTO user_profiles (user_id) VALUES (%s)", (current_user_id,))
                prof = {'coins': 0}
                
            current_coins = prof['coins']
            if current_coins < price:
                return jsonify({"status": "error", "message": "Insufficient coins."}), 400
                
            cursor.execute("UPDATE user_profiles SET coins = coins - %s WHERE user_id = %s", (price, current_user_id))
            
            try:
                cursor.execute(
                    "INSERT INTO user_inventory (user_id, item_type, item_id) ON CONFLICT DO NOTHING VALUES (%s, %s, %s)",
                    (current_user_id, item_type, item_id)
                )
            except Exception as e:
                # Likely already owned
                return jsonify({"status": "error", "message": "Item already owned."}), 400
                
            return jsonify({
                "status": "success", 
                "message": f"Successfully purchased {item_id}", 
                "coins": current_coins - price,
                "item": {
                    "item_id": item_id,
                    "item_type": item_type,
                    "is_equipped": False
                }
            }), 200
    finally:
        conn.close()

@gamification_bp.route('/api/equip', methods=['POST'])
@token_required
def api_equip(current_user_id, current_username):
    data = request.get_json() or {}
    item_id = str(data.get('item_id', '')).strip()
    
    conn = get_db_connection()
    try:
        with conn:
            cursor = conn.cursor()
            # Verify ownership
            cursor.execute("SELECT item_type FROM user_inventory WHERE user_id = %s AND item_id = %s", (current_user_id, item_id))
            item_row = cursor.fetchone()
            if not item_row:
                return jsonify({"status": "error", "message": "Item not owned."}), 400
                
            item_type = item_row['item_type']
            
            if item_type == 'avatar':
                cursor.execute("UPDATE user_profiles SET equipped_avatar = %s WHERE user_id = %s", (item_id, current_user_id))
            elif item_type == 'banner':
                cursor.execute("UPDATE user_profiles SET equipped_banner = %s WHERE user_id = %s", (item_id, current_user_id))
            elif item_type == 'theme':
                cursor.execute("UPDATE user_profiles SET equipped_theme = %s WHERE user_id = %s", (item_id, current_user_id))
                
            return jsonify({
                "status": "success", 
                "message": f"Successfully equipped {item_id}",
                "item_type": item_type
            }), 200
    finally:
        conn.close()

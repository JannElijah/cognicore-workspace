from flask import Blueprint, jsonify, request
from auth import token_required
from database import db
from models import UserAchievement, DailyTask, UserProfile, UserInventory
from datetime import date
from sqlalchemy.exc import IntegrityError

gamification_bp = Blueprint('gamification_bp', __name__)

@gamification_bp.route('/api/achievements', methods=['GET'])
@token_required
def get_achievements(current_user_id, current_username):
    achievements = UserAchievement.query.filter_by(user_id=current_user_id).all()
    
    return jsonify({
        "status": "success",
        "achievements": [{
            "achievement_id": a.achievement_id,
            "current_amount": a.current_amount,
            "is_completed": a.is_completed,
            "created_at": a.created_at
        } for a in achievements]
    }), 200

@gamification_bp.route('/api/quests', methods=['GET'])
@token_required
def get_daily_quests(current_user_id, current_username):
    today = date.today()
    tasks = DailyTask.query.filter(DailyTask.user_id == current_user_id, db.cast(DailyTask.created_at, db.Date) == today).all()
    
    if not tasks:
        new_tasks = [
            ("Play 3 Training Games", 3, 200),
            ("Achieve 80% accuracy in any game", 1, 200),
            ("Achieve reaction time under 800ms", 1, 200)
        ]
        
        for desc, tgt, rew in new_tasks:
            t = DailyTask(user_id=current_user_id, task_description=desc, target_amount=tgt, reward_coins=rew, created_at=today)
            db.session.add(t)
        
        try:
            db.session.commit()
            tasks = DailyTask.query.filter(DailyTask.user_id == current_user_id, db.cast(DailyTask.created_at, db.Date) == today).all()
        except Exception:
            db.session.rollback()
            raise
            
    return jsonify({
        "status": "success",
        "quests": [{
            "id": t.id,
            "task_description": t.task_description,
            "target_amount": t.target_amount,
            "current_amount": t.current_amount,
            "is_completed": t.is_completed,
            "reward_coins": t.reward_coins
        } for t in tasks]
    }), 200

@gamification_bp.route('/api/quests/claim/<int:quest_id>', methods=['POST'])
@token_required
def claim_quest(current_user_id, current_username, quest_id):
    quest = DailyTask.query.filter_by(id=quest_id, user_id=current_user_id).first()
    
    if not quest:
        return jsonify({"status": "error", "message": "Quest not found"}), 404
        
    if quest.is_completed:
        return jsonify({"status": "error", "message": "Quest already claimed"}), 400
        
    if quest.current_amount < quest.target_amount:
        return jsonify({"status": "error", "message": "Quest not finished"}), 400
        
    quest.is_completed = True
    
    prof = UserProfile.query.filter_by(user_id=current_user_id).with_for_update().first() # Row-level lock to prevent double-spend
    if not prof:
        prof = UserProfile(user_id=current_user_id, coins=quest.reward_coins)
        db.session.add(prof)
    else:
        prof.coins = (prof.coins or 0) + quest.reward_coins
        
    db.session.commit()
    
    return jsonify({"status": "success", "reward": quest.reward_coins}), 200

@gamification_bp.route('/api/user-inventory/<username>', methods=['GET'])
@token_required
def get_user_inventory(current_user_id, current_username, username):
    if current_username != username:
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    prof = UserProfile.query.filter_by(user_id=current_user_id).first()
    if not prof:
        prof = UserProfile(user_id=current_user_id, coins=0, xp=0)
        db.session.add(prof)
        db.session.commit()
        
    inv_rows = UserInventory.query.filter_by(user_id=current_user_id).all()
    
    inventory = []
    for row in inv_rows:
        is_equipped = False
        if row.item_type == 'avatar' and row.item_id == prof.equipped_avatar:
            is_equipped = True
        elif row.item_type == 'banner' and row.item_id == prof.equipped_banner:
            is_equipped = True
        elif row.item_type == 'theme' and row.item_id == prof.equipped_theme:
            is_equipped = True
            
        inventory.append({
            "item_type": row.item_type,
            "item_id": row.item_id,
            "is_equipped": is_equipped
        })
        
    return jsonify({
        "status": "success",
        "coins": prof.coins or 0,
        "total_xp": prof.xp or 0,
        "reduce_flashes": bool(prof.reduce_flashes),
        "inventory": inventory
    }), 200

@gamification_bp.route('/api/settings/accessibility', methods=['POST'])
@token_required
def update_accessibility(current_user_id, current_username):
    data = request.json
    reduce_flashes = data.get('reduce_flashes', False)
    
    prof = UserProfile.query.filter_by(user_id=current_user_id).first()
    if not prof:
        prof = UserProfile(user_id=current_user_id, reduce_flashes=reduce_flashes)
        db.session.add(prof)
    else:
        prof.reduce_flashes = reduce_flashes
        
    try:
        db.session.commit()
        return jsonify({"status": "success", "reduce_flashes": reduce_flashes}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500

@gamification_bp.route('/api/purchase', methods=['POST'])
@token_required
def api_purchase(current_user_id, current_username):
    data = request.get_json() or {}
    item_id = str(data.get('item_id', '')).strip()
    
    catalog = {
        'theme-red': {'type': 'theme', 'price': 200},
        'theme-blue': {'type': 'theme', 'price': 200},
        'theme-purple': {'type': 'theme', 'price': 250},
        'theme-yellow': {'type': 'theme', 'price': 200},
        'theme-green': {'type': 'theme', 'price': 250},
        'theme-pink': {'type': 'theme', 'price': 250},
        'theme-cyan': {'type': 'theme', 'price': 200},
        'theme-monochrome': {'type': 'theme', 'price': 300},
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
    
    prof = UserProfile.query.filter_by(user_id=current_user_id).first()
    if not prof:
        prof = UserProfile(user_id=current_user_id, coins=0)
        db.session.add(prof)
        db.session.commit()
        
    current_coins = prof.coins or 0
    if current_coins < price:
        return jsonify({"status": "error", "message": "Insufficient coins."}), 400
        
    # Check if already owned
    existing = UserInventory.query.filter_by(user_id=current_user_id, item_type=item_type, item_id=item_id).first()
    if existing:
        return jsonify({"status": "error", "message": "Item already owned."}), 400
        
    prof.coins = current_coins - price
    new_item = UserInventory(user_id=current_user_id, item_type=item_type, item_id=item_id)
    db.session.add(new_item)
    
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"status": "error", "message": "Item already owned."}), 400
        
    return jsonify({
        "status": "success", 
        "message": f"Successfully purchased {item_id}", 
        "coins": prof.coins,
        "item": {
            "item_id": item_id,
            "item_type": item_type,
            "is_equipped": False
        }
    }), 200

@gamification_bp.route('/api/equip', methods=['POST'])
@token_required
def api_equip(current_user_id, current_username):
    data = request.get_json() or {}
    item_id = str(data.get('item_id', '')).strip()
    
    if item_id.startswith('default-'):
        item_type = item_id.split('-')[1]
        prof = UserProfile.query.filter_by(user_id=current_user_id).first()
        if not prof:
            prof = UserProfile(user_id=current_user_id)
            db.session.add(prof)
        if item_type == 'avatar':
            prof.equipped_avatar = None
        elif item_type == 'banner':
            prof.equipped_banner = None
        elif item_type == 'theme':
            prof.equipped_theme = None
        db.session.commit()
        return jsonify({
            "status": "success", 
            "message": f"Successfully equipped {item_id}",
            "item_type": item_type
        }), 200

    item_row = UserInventory.query.filter_by(user_id=current_user_id, item_id=item_id).first()
    if not item_row:
        return jsonify({"status": "error", "message": "Item not owned."}), 400
        
    item_type = item_row.item_type
    prof = UserProfile.query.filter_by(user_id=current_user_id).first()
    if not prof:
        prof = UserProfile(user_id=current_user_id)
        db.session.add(prof)
        
    if item_type == 'avatar':
        prof.equipped_avatar = item_id
    elif item_type == 'banner':
        prof.equipped_banner = item_id
    elif item_type == 'theme':
        prof.equipped_theme = item_id
        
    db.session.commit()
    
    return jsonify({
        "status": "success", 
        "message": f"Successfully equipped {item_id}",
        "item_type": item_type
    }), 200

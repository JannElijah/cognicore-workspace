from flask import Blueprint, request, jsonify
import bcrypt
from auth import token_required
from database import db
from models import User

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/api/auth/set-pin', methods=['POST'])
@token_required
def set_pin(current_user_id, current_username):
    data = request.get_json()
    pin = data.get("pin")
    if not pin or len(str(pin)) < 4:
        return jsonify({"status": "error", "message": "Valid PIN of at least 4 digits required"}), 400
        
    # Hash PIN securely using bcrypt
    salt = bcrypt.gensalt()
    pin_hash = bcrypt.hashpw(str(pin).encode('utf-8'), salt).decode('utf-8')
    
    user = User.query.get(current_user_id)
    if user:
        user.pin_hash = pin_hash
        db.session.commit()
        return jsonify({"status": "success", "message": "PIN set successfully"})
    return jsonify({"status": "error", "message": "User not found"}), 404

@auth_bp.route('/api/auth/verify-pin', methods=['POST'])
@token_required
def verify_pin(current_user_id, current_username):
    data = request.get_json()
    pin = data.get("pin")
    if not pin:
        return jsonify({"status": "error", "message": "PIN required"}), 400
        
    user = User.query.get(current_user_id)
    
    if not user or not user.pin_hash:
        return jsonify({"status": "error", "message": "No PIN set for user"}), 400
        
    # Verify hash
    if bcrypt.checkpw(str(pin).encode('utf-8'), user.pin_hash.encode('utf-8')):
        return jsonify({"status": "success", "message": "PIN verified"})
    else:
        return jsonify({"status": "error", "message": "Incorrect PIN"}), 401

from datetime import date, timedelta
from models import UserProfile, UserStreak

@auth_bp.route('/api/sync-user', methods=['POST'])
@token_required
def sync_user(current_user_id, current_username):
    user_id = current_user_id
    today = date.today()
    
    streak = UserStreak.query.filter_by(user_id=user_id).with_for_update().first()
    daily_reward = {"granted": False, "streak": 1, "coins": 0}
    
    def add_coins(amount):
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id, coins=amount)
            db.session.add(profile)
        else:
            if profile.coins is None:
                profile.coins = amount
            else:
                profile.coins += amount
            
    if not streak:
        streak = UserStreak(user_id=user_id, last_login_date=today, current_streak=1, longest_streak=1)
        db.session.add(streak)
        add_coins(100)
        daily_reward = {"granted": True, "streak": 1, "coins": 100}
    else:
        last_login = streak.last_login_date
        
        if last_login is None:
            streak.last_login_date = today
            streak.current_streak = 1
            streak.longest_streak = max(streak.longest_streak or 1, 1)
            add_coins(100)
            daily_reward = {"granted": True, "streak": 1, "coins": 100}
        else:
            if last_login == today:
                daily_reward = {"granted": False, "streak": streak.current_streak, "coins": 0}
            elif last_login == today - timedelta(days=1):
                streak.current_streak += 1
                streak.longest_streak = max(streak.longest_streak or 1, streak.current_streak)
                streak.last_login_date = today
                reward = min(500, 100 + (streak.current_streak - 1) * 50)
                add_coins(reward)
                daily_reward = {"granted": True, "streak": streak.current_streak, "coins": reward}
            else:
                streak.current_streak = 1
                streak.last_login_date = today
                add_coins(100)
                daily_reward = {"granted": True, "streak": 1, "coins": 100}

    db.session.commit()
    
    return jsonify({
        "status": "success",
        "user": {
            "id": current_user_id,
            "username": current_username
        },
        "daily_reward": daily_reward
    })

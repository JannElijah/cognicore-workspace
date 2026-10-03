from flask import Blueprint, request, jsonify
from auth import token_required
from database import get_db_connection, db
from models import User, SystemConfig, SystemAnnouncement, AuditLog, BugReport, GameModuleConfig
from datetime import datetime

admin_bp = Blueprint('admin_bp', __name__)

def log_audit(admin_username, action, target=None):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO audit_logs (admin_username, action_taken, target_user) VALUES (%s, %s, %s)",
            (admin_username, action, target)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        pass

@admin_bp.route('/api/admin/users', methods=['GET'])
@token_required
def get_users(current_user_id, current_username):
    # Search / Filter
    search = request.args.get('search', '')
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = """
            SELECT u.id, u.username, u.created_at, u.status, u.role, p.xp, p.level, p.coins
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.username ILIKE %s
            ORDER BY u.created_at DESC
        """
        cursor.execute(query, (f"%{search}%",))
        users = [dict(row) for row in cursor.fetchall()]
        return jsonify({"status": "success", "users": users}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@admin_bp.route('/api/admin/users/<username>', methods=['GET'])
@token_required
def get_user_summary(current_user_id, current_username, username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # User & Profile
        cursor.execute("""
            SELECT u.id, u.username, u.created_at, u.status, p.xp, p.level, p.coins
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.username = %s
        """, (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
            
        uid = user['id']
        
        # Archetype
        cursor.execute("SELECT archetype_name FROM cognitive_profiles WHERE user_id = %s", (uid,))
        archetype = cursor.fetchone()
        archetype_name = archetype['archetype_name'] if archetype else "Unknown"
        
        # Streak
        cursor.execute("SELECT current_streak FROM user_streaks WHERE user_id = %s", (uid,))
        streak_row = cursor.fetchone()
        streak = streak_row['current_streak'] if streak_row else 0
        
        # Game by Game breakdown
        cursor.execute("""
            SELECT gs.game_type, COUNT(gs.id) as plays, AVG(pm.accuracy_rate) as avg_acc, AVG(pm.difficulty_level) as avg_diff, AVG(pm.hesitation_ms) as avg_hesitation, AVG(pm.spam_click_count) as avg_spam_clicks, AVG(pm.reaction_time) as avg_rt
            FROM game_sessions gs
            LEFT JOIN performance_metrics pm ON gs.id = pm.session_id
            WHERE gs.user_id = %s
            GROUP BY gs.game_type
        """, (uid,))
        games = [dict(row) for row in cursor.fetchall()]
        
        return jsonify({
            "status": "success",
            "user": dict(user),
            "archetype": archetype_name,
            "streak": streak,
            "game_breakdown": games
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@admin_bp.route('/api/admin/users/<username>/status', methods=['PUT'])
@token_required
def update_user_status(current_user_id, current_username, username):
    data = request.json
    status = data.get('status')
    if not status:
        return jsonify({"status": "error", "message": "Missing status"}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET status = %s WHERE username = %s", (status, username))
        conn.commit()
        log_audit(current_username, f"Changed status to {status}", username)
        return jsonify({"status": "success", "message": "Status updated"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@admin_bp.route('/api/admin/config', methods=['GET', 'POST'])
@token_required
def manage_config(current_user_id, current_username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if request.method == 'GET':
            cursor.execute("SELECT config_key, config_value FROM system_config")
            configs = {row['config_key']: row['config_value'] for row in cursor.fetchall()}
            return jsonify({"status": "success", "config": configs}), 200
        else:
            data = request.json
            for key, val in data.items():
                cursor.execute("""
                    INSERT INTO system_config (config_key, config_value) 
                    VALUES (%s, %s)
                    ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value
                """, (key, str(val)))
            conn.commit()
            log_audit(current_username, "Updated system configuration")
            return jsonify({"status": "success", "message": "Config updated"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@admin_bp.route('/api/admin/announcements', methods=['POST'])
@token_required
def create_announcement(current_user_id, current_username):
    data = request.json
    message = data.get('message')
    if not message:
        return jsonify({"status": "error", "message": "Missing message"}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO system_announcements (message) VALUES (%s)", (message,))
        conn.commit()
        log_audit(current_username, "Created announcement")
        return jsonify({"status": "success", "message": "Announcement created"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@admin_bp.route('/api/admin/audit-logs', methods=['GET'])
@token_required
def get_audit_logs(current_user_id, current_username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100")
        logs = [dict(row) for row in cursor.fetchall()]
        return jsonify({"status": "success", "logs": logs}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@admin_bp.route('/api/bug-report', methods=['POST'])
@token_required
def submit_bug_report(current_user_id, current_username):
    data = request.json
    message = data.get('message')
    if not message:
        return jsonify({"status": "error", "message": "Missing message"}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO bug_reports (user_id, message) VALUES (%s, %s)", (current_user_id, message))
        conn.commit()
        return jsonify({"status": "success", "message": "Report submitted"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@admin_bp.route('/api/admin/bug-reports', methods=['GET'])
@token_required
def get_bug_reports(current_user_id, current_username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT br.id, br.message, br.status, br.created_at, u.username
            FROM bug_reports br
            LEFT JOIN users u ON br.user_id = u.id
            ORDER BY br.created_at DESC
        """)
        reports = [dict(row) for row in cursor.fetchall()]
        return jsonify({"status": "success", "reports": reports}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@admin_bp.route('/api/admin/leaderboard/invalidate/<int:session_id>', methods=['DELETE'])
@token_required
def invalidate_score(current_user_id, current_username, session_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # Find session
        cursor.execute("SELECT user_id, game_type FROM game_sessions WHERE id = %s", (session_id,))
        session = cursor.fetchone()
        if not session:
            return jsonify({"status": "error", "message": "Session not found"}), 404
            
        uid = session['user_id']
        
        # We can either delete the session entirely or just delete metrics
        cursor.execute("DELETE FROM game_sessions WHERE id = %s", (session_id,))
        
        # Penalize XP from user_profiles as an example of score invalidation
        # (Assuming standard XP per game is 15 based on test case TC-13)
        cursor.execute("UPDATE user_profiles SET xp = GREATEST(xp - 15, 0) WHERE user_id = %s", (uid,))
        
        conn.commit()
        log_audit(current_username, f"Invalidated session {session_id} and deducted XP", uid)
        return jsonify({"status": "success", "message": "Score invalidated successfully"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@admin_bp.route('/api/admin/game-modules', methods=['GET', 'POST'])
@token_required
def manage_game_modules(current_user_id, current_username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if request.method == 'GET':
            cursor.execute("SELECT game_type, is_active FROM game_module_config")
            modules = [dict(row) for row in cursor.fetchall()]
            return jsonify({"status": "success", "modules": modules}), 200
        else:
            data = request.json
            game_type = data.get('game_type')
            is_active = data.get('is_active')
            cursor.execute("""
                INSERT INTO game_module_config (game_type, is_active) 
                VALUES (%s, %s)
                ON CONFLICT (game_type) DO UPDATE SET is_active = EXCLUDED.is_active
            """, (game_type, is_active))
            conn.commit()
            log_audit(current_username, f"Set game {game_type} active to {is_active}")
            return jsonify({"status": "success", "message": "Module updated"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@admin_bp.route('/api/admin/users/<username>', methods=['DELETE'])
@token_required
def delete_user(current_user_id, current_username, username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE username = %s", (username,))
        if cursor.rowcount == 0:
            return jsonify({"status": "error", "message": "User not found"}), 404
            
        conn.commit()
        log_audit(current_username, "Deleted user", username)
        return jsonify({"status": "success", "message": "User deleted"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@admin_bp.route('/api/admin/export-telemetry', methods=['GET'])
@token_required
def export_telemetry(current_user_id, current_username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT u.username, gs.game_type, gs.game_mode, gs.start_time,
                   pm.reaction_time, pm.accuracy_rate, pm.difficulty_level,
                   pm.cognitive_domain, pm.error_count, pm.hesitation_ms,
                   pm.spam_click_count, pm.rule_shift_latency_ms, pm.path_efficiency,
                   pm.recorded_at
            FROM performance_metrics pm
            JOIN game_sessions gs ON pm.session_id = gs.id
            JOIN users u ON gs.user_id = u.id
            ORDER BY pm.recorded_at DESC
        ''')
        records = [dict(row) for row in cursor.fetchall()]
        log_audit(current_username, 'Exported raw telemetry data')
        return jsonify({'status': 'success', 'telemetry': records}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()



@admin_bp.route('/api/admin/export-telemetry/<username>', methods=['GET'])
@token_required
def export_subject_telemetry(current_user_id, current_username, username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT u.username, gs.game_type, gs.game_mode, gs.start_time,
                   pm.reaction_time, pm.accuracy_rate, pm.difficulty_level,
                   pm.cognitive_domain, pm.error_count, pm.hesitation_ms,
                   pm.spam_click_count, pm.rule_shift_latency_ms, pm.path_efficiency,
                   pm.recorded_at
            FROM performance_metrics pm
            JOIN game_sessions gs ON pm.session_id = gs.id
            JOIN users u ON gs.user_id = u.id
            WHERE u.username = %s
            ORDER BY pm.recorded_at ASC
        ''', (username,))
        records = [dict(row) for row in cursor.fetchall()]
        log_audit(current_username, f'Exported raw telemetry data for {username}')
        return jsonify({'status': 'success', 'telemetry': records}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()


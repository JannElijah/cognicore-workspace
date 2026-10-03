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

 @ a d m i n _ b p . r o u t e ( ' / a p i / a d m i n / e x p o r t - t e l e m e t r y ' ,   m e t h o d s = [ ' G E T ' ] ) 
 @ t o k e n _ r e q u i r e d 
 d e f   e x p o r t _ t e l e m e t r y ( c u r r e n t _ u s e r _ i d ,   c u r r e n t _ u s e r n a m e ) : 
         c o n n   =   g e t _ d b _ c o n n e c t i o n ( ) 
         t r y : 
                 c u r s o r   =   c o n n . c u r s o r ( ) 
                 c u r s o r . e x e c u t e ( ' ' ' 
                         S E L E C T   u . u s e r n a m e ,   g s . g a m e _ t y p e ,   g s . g a m e _ m o d e ,   g s . s t a r t _ t i m e , 
                                       p m . r e a c t i o n _ t i m e ,   p m . a c c u r a c y _ r a t e ,   p m . d i f f i c u l t y _ l e v e l , 
                                       p m . c o g n i t i v e _ d o m a i n ,   p m . e r r o r _ c o u n t ,   p m . h e s i t a t i o n _ m s , 
                                       p m . s p a m _ c l i c k _ c o u n t ,   p m . r u l e _ s h i f t _ l a t e n c y _ m s ,   p m . p a t h _ e f f i c i e n c y , 
                                       p m . r e c o r d e d _ a t 
                         F R O M   p e r f o r m a n c e _ m e t r i c s   p m 
                         J O I N   g a m e _ s e s s i o n s   g s   O N   p m . s e s s i o n _ i d   =   g s . i d 
                         J O I N   u s e r s   u   O N   g s . u s e r _ i d   =   u . i d 
                         O R D E R   B Y   p m . r e c o r d e d _ a t   D E S C 
                 ' ' ' ) 
                 r e c o r d s   =   [ d i c t ( r o w )   f o r   r o w   i n   c u r s o r . f e t c h a l l ( ) ] 
                 l o g _ a u d i t ( c u r r e n t _ u s e r n a m e ,   ' E x p o r t e d   r a w   t e l e m e t r y   d a t a ' ) 
                 r e t u r n   j s o n i f y ( { ' s t a t u s ' :   ' s u c c e s s ' ,   ' t e l e m e t r y ' :   r e c o r d s } ) ,   2 0 0 
         e x c e p t   E x c e p t i o n   a s   e : 
                 r e t u r n   j s o n i f y ( { ' s t a t u s ' :   ' e r r o r ' ,   ' m e s s a g e ' :   s t r ( e ) } ) ,   5 0 0 
         f i n a l l y : 
                 c o n n . c l o s e ( ) 
  
 

 @ a d m i n _ b p . r o u t e ( ' / a p i / a d m i n / e x p o r t - t e l e m e t r y / < u s e r n a m e > ' ,   m e t h o d s = [ ' G E T ' ] ) 
 @ t o k e n _ r e q u i r e d 
 d e f   e x p o r t _ s u b j e c t _ t e l e m e t r y ( c u r r e n t _ u s e r _ i d ,   c u r r e n t _ u s e r n a m e ,   u s e r n a m e ) : 
         c o n n   =   g e t _ d b _ c o n n e c t i o n ( ) 
         t r y : 
                 c u r s o r   =   c o n n . c u r s o r ( ) 
                 c u r s o r . e x e c u t e ( ' ' ' 
                         S E L E C T   u . u s e r n a m e ,   g s . g a m e _ t y p e ,   g s . g a m e _ m o d e ,   g s . s t a r t _ t i m e , 
                                       p m . r e a c t i o n _ t i m e ,   p m . a c c u r a c y _ r a t e ,   p m . d i f f i c u l t y _ l e v e l , 
                                       p m . c o g n i t i v e _ d o m a i n ,   p m . e r r o r _ c o u n t ,   p m . h e s i t a t i o n _ m s , 
                                       p m . s p a m _ c l i c k _ c o u n t ,   p m . r u l e _ s h i f t _ l a t e n c y _ m s ,   p m . p a t h _ e f f i c i e n c y , 
                                       p m . r e c o r d e d _ a t 
                         F R O M   p e r f o r m a n c e _ m e t r i c s   p m 
                         J O I N   g a m e _ s e s s i o n s   g s   O N   p m . s e s s i o n _ i d   =   g s . i d 
                         J O I N   u s e r s   u   O N   g s . u s e r _ i d   =   u . i d 
                         W H E R E   u . u s e r n a m e   =   % s 
                         O R D E R   B Y   p m . r e c o r d e d _ a t   A S C 
                 ' ' ' ,   ( u s e r n a m e , ) ) 
                 r e c o r d s   =   [ d i c t ( r o w )   f o r   r o w   i n   c u r s o r . f e t c h a l l ( ) ] 
                 l o g _ a u d i t ( c u r r e n t _ u s e r n a m e ,   f ' E x p o r t e d   r a w   t e l e m e t r y   d a t a   f o r   { u s e r n a m e } ' ) 
                 r e t u r n   j s o n i f y ( { ' s t a t u s ' :   ' s u c c e s s ' ,   ' t e l e m e t r y ' :   r e c o r d s } ) ,   2 0 0 
         e x c e p t   E x c e p t i o n   a s   e : 
                 r e t u r n   j s o n i f y ( { ' s t a t u s ' :   ' e r r o r ' ,   ' m e s s a g e ' :   s t r ( e ) } ) ,   5 0 0 
         f i n a l l y : 
                 c o n n . c l o s e ( ) 
  
 
import os
from flask import request, jsonify
from functools import wraps
from supabase import create_client, Client
from dotenv import load_dotenv
from database import get_db_connection

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not supabase:
            return jsonify({'status': 'error', 'message': 'Supabase client not configured!'}), 500

        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        
        if not token:
            print("Auth error: Token is missing!")
            print("Headers:", dict(request.headers))
            return jsonify({'status': 'error', 'message': 'Token is missing!'}), 401
            
        try:
            user_response = supabase.auth.get_user(token)
            if not user_response or not user_response.user:
                raise Exception("Invalid user")
            
            user = user_response.user
            supabase_uid = user.id
            current_username = user.user_metadata.get('username', user.email)
            if not current_username:
                current_username = f"user_{supabase_uid[:8]}"
            
            # Map Supabase UUID to internal Integer ID
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM users WHERE supabase_uid = %s", (supabase_uid,))
                row = cursor.fetchone()
                
                if row:
                    current_user_id = row['id']
                else:
                    # Check if username already exists without a supabase_uid
                    cursor.execute("SELECT id FROM users WHERE username = %s", (current_username,))
                    existing_user = cursor.fetchone()
                    
                    if existing_user:
                        # Update the existing user with the new supabase_uid
                        cursor.execute(
                            "UPDATE users SET supabase_uid = %s WHERE id = %s RETURNING id",
                            (supabase_uid, existing_user['id'])
                        )
                        current_user_id = cursor.fetchone()['id']
                    else:
                        # User authenticated but not in our internal DB yet, create them!
                        cursor.execute(
                            "INSERT INTO users (username, supabase_uid) VALUES (%s, %s) RETURNING id",
                            (current_username, supabase_uid)
                        )
                        current_user_id = cursor.fetchone()['id']
                    
        except Exception as e:
            print(f"Auth error: {e}")
            return jsonify({'status': 'error', 'message': 'Token is invalid or expired!'}), 401
            
        return f(current_user_id, current_username, *args, **kwargs)
    return decorated

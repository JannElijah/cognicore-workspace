import os
from flask import request, jsonify
from functools import wraps
from supabase import create_client, Client
from dotenv import load_dotenv
from database import db
from models import User

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
            user_record = User.query.filter_by(supabase_uid=supabase_uid).first()
            
            meta = user.user_metadata or {}
            course = meta.get('course')
            age = meta.get('age')
            if age is not None:
                try:
                    age = int(age)
                except:
                    age = None
            gender = meta.get('gender')
            
            if user_record:
                # Update existing user demographics if they are empty
                updated = False
                if course and not user_record.course:
                    user_record.course = course
                    updated = True
                if age and not user_record.age:
                    user_record.age = age
                    updated = True
                if gender and not user_record.gender:
                    user_record.gender = gender
                    updated = True
                if updated:
                    db.session.commit()
                current_user_id = user_record.id
            else:
                existing_user = User.query.filter_by(username=current_username).first()
                if existing_user:
                    existing_user.supabase_uid = supabase_uid
                    if course and not existing_user.course: existing_user.course = course
                    if age and not existing_user.age: existing_user.age = age
                    if gender and not existing_user.gender: existing_user.gender = gender
                    db.session.commit()
                    current_user_id = existing_user.id
                else:
                    new_user = User(
                        username=current_username, 
                        supabase_uid=supabase_uid,
                        course=course,
                        age=age,
                        gender=gender
                    )
                    db.session.add(new_user)
                    db.session.commit()
                    current_user_id = new_user.id
                    
        except Exception as e:
            print(f"Auth error: {e}")
            return jsonify({'status': 'error', 'message': 'Token is invalid or expired!'}), 401
            
        return f(current_user_id, current_username, *args, **kwargs)
    return decorated

import os
import jwt
from flask import request, jsonify
from functools import wraps

SECRET_KEY = os.environ.get("JWT_SECRET", "cognicore_super_secret_key_123")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        
        if not token:
            return jsonify({'status': 'error', 'message': 'Token is missing!'}), 401
            
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user_id = data['user_id']
            current_username = data['username']
        except jwt.ExpiredSignatureError:
            return jsonify({'status': 'error', 'message': 'Token has expired!'}), 401
        except Exception as e:
            return jsonify({'status': 'error', 'message': 'Token is invalid!'}), 401
            
        return f(current_user_id, current_username, *args, **kwargs)
    return decorated

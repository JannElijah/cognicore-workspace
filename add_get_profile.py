import os

file_path = 'server/routes/auth.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_route = '''@auth_bp.route('/api/auth/profile', methods=['GET'])
@token_required
def get_profile(current_user_id, current_username):
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
        
    return jsonify({
        "status": "success",
        "profile": {
            "course": user.course or "",
            "age": user.age or "",
            "gender": user.gender or "",
            "pwd_status": user.pwd_status or ""
        }
    })

@auth_bp.route('/api/auth/update-profile', methods=['POST'])'''

content = content.replace("@auth_bp.route('/api/auth/update-profile', methods=['POST'])", new_route)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

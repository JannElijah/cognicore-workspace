import os

file_path = 'server/routes/auth.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_route = '''@auth_bp.route('/api/auth/update-profile', methods=['POST'])
@token_required
def update_profile(current_user_id, current_username):
    data = request.get_json()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
        
    if "course" in data: user.course = data["course"]
    if "age" in data: user.age = data["age"]
    if "gender" in data: user.gender = data["gender"]
    if "pwd_status" in data: user.pwd_status = data["pwd_status"]
    
    db.session.commit()
    return jsonify({"status": "success", "message": "Profile updated successfully"})

from datetime import date, timedelta'''

content = content.replace("from datetime import date, timedelta", new_route)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added update-profile route to auth.py")

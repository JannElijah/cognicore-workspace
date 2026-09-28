import os

filepath = r'd:\cognicore-workspace\server\routes\auth.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'profile = UserProfile.query.filter_by(user_id=user_id).first()',
    'profile = UserProfile.query.filter_by(user_id=user_id).with_for_update().first()'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

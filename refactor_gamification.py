import os

filepath = r'd:\cognicore-workspace\server\routes\gamification.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_query = "prof = UserProfile.query.filter_by(user_id=current_user_id).first()"
new_query = "prof = UserProfile.query.filter_by(user_id=current_user_id).with_for_update().first() # Row-level lock to prevent double-spend"

content = content.replace(old_query, new_query, 1) # Only replace the first one in api_purchase

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

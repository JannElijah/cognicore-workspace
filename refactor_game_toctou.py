import os

filepath = r'd:\cognicore-workspace\server\routes\game.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix execute_gamification
content = content.replace(
    'prof = UserProfile.query.filter_by(user_id=uid).first()',
    'prof = UserProfile.query.filter_by(user_id=uid).with_for_update().first()'
)

# Fix execute_gamification_batch task querying
content = content.replace(
    'tasks = DailyTask.query.filter(DailyTask.user_id == uid, db.cast(DailyTask.created_at, db.Date) == today).all()',
    'tasks = DailyTask.query.filter(DailyTask.user_id == uid, db.cast(DailyTask.created_at, db.Date) == today).with_for_update().all()'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

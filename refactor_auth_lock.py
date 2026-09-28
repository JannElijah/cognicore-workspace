import os

# Fix gamification.py claim_quest double-claim
gamification_path = r'd:\cognicore-workspace\server\routes\gamification.py'
with open(gamification_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("quest = DailyTask.query.filter_by(id=quest_id, user_id=current_user_id).first()", "quest = DailyTask.query.filter_by(id=quest_id, user_id=current_user_id).with_for_update().first()")

with open(gamification_path, 'w', encoding='utf-8') as f:
    f.write(content)


# Fix auth.py streak double-claim
auth_path = r'd:\cognicore-workspace\server\routes\auth.py'
with open(auth_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("streak = UserStreak.query.filter_by(user_id=user_id).first()", "streak = UserStreak.query.filter_by(user_id=user_id).with_for_update().first()")

add_coins_old = '''    def add_coins(amount):
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        if profile:
            profile.coins = (profile.coins or 0) + amount
        else:
            profile = UserProfile(user_id=user_id, coins=amount)
            db.session.add(profile)'''
add_coins_new = '''    def add_coins(amount):
        profile = UserProfile.query.filter_by(user_id=user_id).with_for_update().first()
        if profile:
            profile.coins = (profile.coins or 0) + amount
        else:
            profile = UserProfile(user_id=user_id, coins=amount)
            db.session.add(profile)'''

content = content.replace(add_coins_old, add_coins_new)

with open(auth_path, 'w', encoding='utf-8') as f:
    f.write(content)


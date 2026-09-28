import os
import re

filepath = r'd:\cognicore-workspace\server\routes\game.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace execute_gamification
new_execute = '''def execute_gamification(uid, reaction_time, accuracy, difficulty, game_type):
    xp_gained = difficulty * 15
    coins_gained = int(accuracy * 10) + (difficulty * 2)
    leveled_up = False
    newly_unlocked = []

    prof = UserProfile.query.filter_by(user_id=uid).first()
    if not prof:
        prof = UserProfile(user_id=uid, xp=xp_gained, coins=coins_gained, level=1)
        db.session.add(prof)
    else:
        prof.xp = (prof.xp or 0) + xp_gained
        prof.coins = (prof.coins or 0) + coins_gained
        new_level = (prof.xp // 500) + 1
        if new_level > (prof.level or 1):
            leveled_up = True
            prof.coins += 500
            prof.level = new_level

    # Update daily tasks
    from datetime import date
    today = date.today()
    tasks = DailyTask.query.filter(DailyTask.user_id == uid, db.cast(DailyTask.created_at, db.Date) == today).all()
    for task in tasks:
        if task.task_description == 'Play 3 Training Games':
            task.current_amount += 1
        elif task.task_description == 'Achieve 80% accuracy in any game' and accuracy >= 0.8:
            task.current_amount += 1
        elif task.task_description == 'Achieve reaction time under 800ms' and reaction_time < 800:
            task.current_amount += 1

    # Fetch all achievements and inventory ONCE to fix N+1
    user_achievements = {a.achievement_id: a for a in UserAchievement.query.filter_by(user_id=uid).all()}
    user_inventory = {inv.item_id: inv for inv in UserInventory.query.filter_by(user_id=uid).all()}
    
    def unlock_achievement(ach_id, current_amount, target_amount, reward_coins, reward_item=None, reward_item_type=None):
        nonlocal coins_gained
        ach = user_achievements.get(ach_id)
        if not ach:
            ach = UserAchievement(user_id=uid, achievement_id=ach_id, current_amount=0)
            db.session.add(ach)
            user_achievements[ach_id] = ach
        
        if ach.is_completed:
            return
            
        ach.current_amount = current_amount
        if ach.current_amount >= target_amount:
            ach.is_completed = 1
            if reward_coins:
                prof.coins += reward_coins
                coins_gained += reward_coins
            if reward_item and reward_item not in user_inventory:
                inv = UserInventory(user_id=uid, item_id=reward_item, item_type=reward_item_type)
                db.session.add(inv)
                user_inventory[reward_item] = inv
            newly_unlocked.append(ach_id)

    if reaction_time < 400:
        ach = user_achievements.get('speed_demon')
        amt = ach.current_amount + 1 if ach else 1
        unlock_achievement('speed_demon', amt, 10, 0, 'avatar-speed-demon', 'avatar')
        
    if prof.level >= 10:
        unlock_achievement('scholar', 1, 1, 0, 'banner-scholar', 'banner')

    unlock_achievement('first_steps', 1, 1, 100)

    ach_con = user_achievements.get('consistency')
    unlock_achievement('consistency', (ach_con.current_amount + 1 if ach_con else 1), 50, 500)

    if accuracy >= 1.0:
        ach_am = user_achievements.get('accuracy_master')
        unlock_achievement('accuracy_master', (ach_am.current_amount + 1 if ach_am else 1), 5, 1000)

    if accuracy >= 0.9:
        ach_ss = user_achievements.get('sharpshooter')
        unlock_achievement('sharpshooter', (ach_ss.current_amount + 1 if ach_ss else 1), 20, 500)

    if reaction_time < 300:
        unlock_achievement('lightning_reflexes', 1, 1, 200, 'banner-lightning', 'banner')

    if difficulty >= 5:
        unlock_achievement('peak_performer', 1, 1, 1000)

    if game_type:
        sess_types = db.session.query(GameSession.game_type).filter(GameSession.user_id == uid, GameSession.game_type.isnot(None)).distinct().count()
        unlock_achievement('versatile_mind', sess_types, 5, 400)

    games_today = GameSession.query.filter(GameSession.user_id == uid, db.cast(GameSession.start_time, db.Date) == today).count()
    unlock_achievement('brain_marathon', games_today, 10, 300)

    streak = UserStreak.query.filter_by(user_id=uid).first()
    if streak:
        unlock_achievement('on_fire', streak.current_streak, 7, 750)

    return xp_gained, coins_gained, leveled_up, newly_unlocked'''

content = re.sub(
    r'def execute_gamification\(uid, reaction_time, accuracy, difficulty, game_type\):.*?return xp_gained, coins_gained, leveled_up, newly_unlocked',
    new_execute,
    content,
    flags=re.DOTALL
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)


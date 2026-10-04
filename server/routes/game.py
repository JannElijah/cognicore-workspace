from flask import Blueprint, jsonify, request
from auth import token_required
from database import db
from models import (User, GameSession, PerformanceMetric, CognitiveProfile, 
                    UserStreak, UserProfile, DailyTask, UserAchievement, UserInventory, 
                    CognitiveAssessment, ArchetypeHistory)
from game_utils import (GAME_TO_DOMAIN, calculate_dda_parameters, 
                        calculate_ols_slope, archetype_classifier, 
                        ml_history_cache, generate_pros_cons)
from ai_engine import generate_post_test_ai_feedback
from utils import safe_float
import logging

game_bp = Blueprint('game_bp', __name__)
logger = logging.getLogger(__name__)



def safe_int(val, default=0):
    try:
        return int(val) if val is not None else default
    except (ValueError, TypeError):
        return default

def execute_gamification(uid, reaction_time, accuracy, difficulty, game_type):
    xp_gained = difficulty * 15
    coins_gained = int(accuracy * 10) + (difficulty * 2)
    leveled_up = False
    newly_unlocked = []

    prof = UserProfile.query.filter_by(user_id=uid).with_for_update().first()
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
    tasks = DailyTask.query.filter(DailyTask.user_id == uid, db.cast(DailyTask.created_at, db.Date) == today).with_for_update().all()
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

    return xp_gained, coins_gained, leveled_up, newly_unlocked


def execute_gamification_batch(uid, metrics_data):
    total_xp = 0
    total_coins = 0
    leveled_up = False
    newly_unlocked = set()

    for item in metrics_data:
        total_xp += item['difficulty'] * 15
        total_coins += int(item['accuracy'] * 10) + (item['difficulty'] * 2)

    prof = UserProfile.query.filter_by(user_id=uid).with_for_update().first()
    if not prof:
        prof = UserProfile(user_id=uid, xp=total_xp, coins=total_coins, level=1)
        db.session.add(prof)
    else:
        prof.xp = (prof.xp or 0) + total_xp
        prof.coins = (prof.coins or 0) + total_coins
        new_level = (prof.xp // 500) + 1
        if new_level > (prof.level or 1):
            leveled_up = True
            prof.coins += 500
            prof.level = new_level

    from datetime import date
    today = date.today()
    tasks = DailyTask.query.filter(DailyTask.user_id == uid, db.cast(DailyTask.created_at, db.Date) == today).with_for_update().all()
    for task in tasks:
        if task.task_description == 'Play 3 Training Games':
            task.current_amount += len(metrics_data)
        elif task.task_description == 'Achieve 80% accuracy in any game':
            meets = sum(1 for m in metrics_data if m['accuracy'] >= 0.8)
            task.current_amount += meets
        elif task.task_description == 'Achieve reaction time under 800ms':
            meets = sum(1 for m in metrics_data if m['reaction_time'] < 800)
            task.current_amount += meets

    user_achievements = {a.achievement_id: a for a in UserAchievement.query.filter_by(user_id=uid).all()}
    user_inventory = {inv.item_id: inv for inv in UserInventory.query.filter_by(user_id=uid).all()}
    
    def unlock_achievement(ach_id, current_amount, target_amount, reward_coins, reward_item=None, reward_item_type=None):
        nonlocal total_coins
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
                total_coins += reward_coins
            if reward_item and reward_item not in user_inventory:
                inv = UserInventory(user_id=uid, item_id=reward_item, item_type=reward_item_type)
                db.session.add(inv)
                user_inventory[reward_item] = inv
            newly_unlocked.add(ach_id)

    min_rt = min((m['reaction_time'] for m in metrics_data), default=9999)
    max_acc = max((m['accuracy'] for m in metrics_data), default=0.0)
    max_diff = max((m['difficulty'] for m in metrics_data), default=1)

    if min_rt < 400:
        ach = user_achievements.get('speed_demon')
        amt = ach.current_amount + sum(1 for m in metrics_data if m['reaction_time'] < 400) if ach else sum(1 for m in metrics_data if m['reaction_time'] < 400)
        unlock_achievement('speed_demon', amt, 10, 0, 'avatar-speed-demon', 'avatar')
        
    if prof.level >= 10:
        unlock_achievement('scholar', 1, 1, 0, 'banner-scholar', 'banner')

    unlock_achievement('first_steps', 1, 1, 100)

    ach_con = user_achievements.get('consistency')
    unlock_achievement('consistency', (ach_con.current_amount + len(metrics_data) if ach_con else len(metrics_data)), 50, 500)

    if max_acc >= 1.0:
        ach_am = user_achievements.get('accuracy_master')
        amt = ach_am.current_amount + sum(1 for m in metrics_data if m['accuracy'] >= 1.0) if ach_am else sum(1 for m in metrics_data if m['accuracy'] >= 1.0)
        unlock_achievement('accuracy_master', amt, 5, 1000)

    if max_acc >= 0.9:
        ach_ss = user_achievements.get('sharpshooter')
        amt = ach_ss.current_amount + sum(1 for m in metrics_data if m['accuracy'] >= 0.9) if ach_ss else sum(1 for m in metrics_data if m['accuracy'] >= 0.9)
        unlock_achievement('sharpshooter', amt, 20, 500)

    if min_rt < 300:
        unlock_achievement('lightning_reflexes', 1, 1, 200, 'banner-lightning', 'banner')

    if max_diff >= 5:
        unlock_achievement('peak_performer', 1, 1, 1000)

    sess_types = db.session.query(GameSession.game_type).filter(GameSession.user_id == uid, GameSession.game_type.isnot(None)).distinct().count()
    unlock_achievement('versatile_mind', sess_types, 5, 400)

    games_today = GameSession.query.filter(GameSession.user_id == uid, db.cast(GameSession.start_time, db.Date) == today).count()
    unlock_achievement('brain_marathon', games_today, 10, 300)

    streak = UserStreak.query.filter_by(user_id=uid).first()
    if streak:
        unlock_achievement('on_fire', streak.current_streak, 7, 750)

    return total_xp, total_coins, leveled_up, list(newly_unlocked)

@game_bp.route('/api/start-session', methods=['POST'])
@token_required
def start_session(current_user_id, current_username):
    try:
        data = request.get_json() or {}
        game_type = str(data.get('game_type', 'SpeedTap')).strip()
        game_mode = str(data.get('game_mode', 'timed')).strip().lower()
        
        session_obj = GameSession(user_id=current_user_id, game_type=game_type, game_mode=game_mode)
        db.session.add(session_obj)
        db.session.flush()
        
        domain = GAME_TO_DOMAIN.get(game_type, "reflexes_and_focus")
        domain_games = [g for g, d in GAME_TO_DOMAIN.items() if d == domain]
        
        last_metric = PerformanceMetric.query.join(GameSession).filter(
            GameSession.user_id == current_user_id,
            db.or_(PerformanceMetric.cognitive_domain == domain, GameSession.game_type.in_(domain_games))
        ).order_by(PerformanceMetric.recorded_at.desc(), PerformanceMetric.id.desc()).first()
        
        initial_difficulty = last_metric.difficulty_level if last_metric else 1
        
        if game_mode in ('daily_challenge', 'pre-test', 'post-test'):
            initial_difficulty = 3
            
        session_obj.current_smooth_difficulty = float(initial_difficulty)
        
        prof = CognitiveProfile.query.filter_by(user_id=current_user_id).first()
        if prof:
            arch_name = prof.archetype_name
            if arch_name == "Plateauing":
                arch_name = "Steady Improver"
                prof.archetype_name = "Steady Improver" # Auto-heal DB
                
            cognitive_profile = {
                "archetype": arch_name,
                "confidence_score": prof.confidence_score
            }
        else:
            cognitive_profile = {
                "archetype": "Initializing...",
                "confidence_score": 0.0
            }
            
        db.session.commit()
        
        initial_params = calculate_dda_parameters(initial_difficulty, game_type)
        
        return jsonify({
            "status": "success",
            "session_id": session_obj.id,
            "user_id": current_user_id,
            "game_mode": game_mode,
            "dda_parameters": initial_params,
            "cognitive_profile": cognitive_profile
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in start_session: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500

@game_bp.route('/api/dda', methods=['POST'])
@token_required
def dda(current_user_id, current_username):
    try:
        data = request.get_json() or {}
        session_id = safe_int(data.get('session_id'))
        
        session_obj = GameSession.query.get(session_id)
        if not session_obj:
            return jsonify({"status": "error", "message": "Invalid session_id"}), 404
            
        game_mode = session_obj.game_mode
        if game_mode in ('daily_challenge', 'pre-test', 'post-test'):
            return jsonify({
                "status": "success", "new_difficulty": 3,
                "is_level_up": False, "is_level_down": False,
                "classification": None, "advisor_message": None,
                "dda_parameters": calculate_dda_parameters(3, session_obj.game_type)
            })
            
        game_type = session_obj.game_type
        domain = GAME_TO_DOMAIN.get(game_type, "reflexes_and_focus")
        
        k = 10 if game_type in ("SpeedTap", "StroopShift", "speed_tap", "stroop_shift") else (3 if game_type in ("MazeEscape", "RouteOptimizer", "maze_escape", "route_optimizer", "PriorityQueue", "priority_queue") else 5)
        
        metrics = PerformanceMetric.query.join(GameSession).filter(
            PerformanceMetric.session_id == session_id,
            db.or_(PerformanceMetric.cognitive_domain == domain, GameSession.game_type == game_type)
        ).order_by(PerformanceMetric.recorded_at.desc(), PerformanceMetric.id.desc()).limit(k).all()
        
        if not metrics:
            metrics = PerformanceMetric.query.filter_by(session_id=session_id).order_by(PerformanceMetric.recorded_at.desc(), PerformanceMetric.id.desc()).limit(k).all()
            
        if not metrics:
            return jsonify({"status": "success", "dda_parameters": calculate_dda_parameters(1, game_type)}), 200
            
        avg_rt = sum(m.reaction_time for m in metrics) / len(metrics)
        avg_accuracy = sum(m.accuracy_rate for m in metrics) / len(metrics)
        avg_hesitation = sum((m.hesitation_ms or 0.0) for m in metrics) / len(metrics)
        avg_spam = sum((m.spam_click_count or 0) for m in metrics) / len(metrics)
        avg_path_eff = sum((m.path_efficiency or 1.0) for m in metrics) / len(metrics)
        current_difficulty = metrics[0].difficulty_level
        
        alpha = max(0.1, min(1.0, safe_float(data.get('smoothing_alpha'), 0.3)))
        current_smooth_difficulty = session_obj.current_smooth_difficulty if session_obj.current_smooth_difficulty is not None else float(current_difficulty)
        
        # --- Upgraded Item Response Theory (IRT) / Elo DDA Algorithm ---
        import math
        theta = current_smooth_difficulty
        discrimination = 2.0
        # Flow-state offset: we want expected accuracy to be ~80% when skill == difficulty
        # 1 / (1 + exp(-2(0 + 1.386))) = 0.80
        expected_accuracy = 1.0 / (1.0 + math.exp(-discrimination * (theta - float(current_difficulty) + 1.386)))
        
        learning_rate = 1.5
        theta_update = learning_rate * (avg_accuracy - expected_accuracy)
        
        if avg_rt > 1200:
            theta_update -= 0.15
        elif avg_rt < 400:
            theta_update += 0.15
            
        new_theta = max(1.0, min(5.0, theta + theta_update))
        new_difficulty = max(1, min(5, int(round(new_theta))))
        session_obj.current_smooth_difficulty = new_theta
        # -------------------------------------------------------------
        
        dda_params = calculate_dda_parameters(new_difficulty, game_type, user_avg_rt=avg_rt)
        
        cache_key = str(current_user_id)
        if cache_key in ml_history_cache and len(ml_history_cache[cache_key]['acc']) >= 20:
            history_acc = ml_history_cache[cache_key]['acc'][-19:]
            history_rt = ml_history_cache[cache_key]['rt'][-19:]
            history_acc.append(avg_accuracy)
            history_rt.append(avg_rt)
        else:
            recent_sessions = GameSession.query.filter(
                GameSession.user_id == current_user_id, 
                GameSession.id <= session_id
            ).order_by(GameSession.id.desc()).limit(20).all()
            
            recent_sessions = sorted(recent_sessions, key=lambda x: x.id)
            history_acc = []
            history_rt = []
            found_current = False
            for s in recent_sessions:
                if s.id == session_id:
                    found_current = True
                    history_acc.append(avg_accuracy)
                    history_rt.append(avg_rt)
                else:
                    s_metrics = PerformanceMetric.query.filter_by(session_id=s.id).all()
                    if s_metrics:
                        history_acc.append(sum(m.accuracy_rate for m in s_metrics) / len(s_metrics))
                        history_rt.append(sum(m.reaction_time for m in s_metrics) / len(s_metrics))
            if not found_current:
                history_acc.append(avg_accuracy)
                history_rt.append(avg_rt)
                
        ml_history_cache[cache_key] = {'acc': history_acc.copy(), 'rt': history_rt.copy()}
        
        acc_slope = calculate_ols_slope(history_acc)
        rt_slope = calculate_ols_slope(history_rt)
        
        pred_res = archetype_classifier.predict(avg_accuracy, avg_rt, acc_slope, rt_slope, avg_hesitation, avg_spam, avg_path_eff)
        archetype = pred_res["archetype"]
        confidence = pred_res["confidence_score"]
        trajectory_msg = archetype_classifier.predict_trajectory(new_difficulty, acc_slope, rt_slope)
        
        profile = CognitiveProfile.query.filter_by(user_id=current_user_id).first()
        if profile:
            profile.archetype_name = archetype
            profile.confidence_score = confidence
        else:
            profile = CognitiveProfile(user_id=current_user_id, archetype_name=archetype, confidence_score=confidence)
            db.session.add(profile)
            
        arch_hist = ArchetypeHistory(user_id=current_user_id, session_id=session_id, archetype_name=archetype, confidence_score=confidence)
        db.session.add(arch_hist)
        
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "dda_parameters": dda_params,
            "cognitive_profile": {
                "archetype": archetype, "confidence_score": confidence,
                "accuracy_slope": acc_slope, "reaction_time_slope": rt_slope,
                "trajectory_prediction": trajectory_msg,
                "history_accuracy": history_acc, "history_reaction_time": history_rt
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in dda: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500

@game_bp.route('/api/submit-metrics', methods=['POST'])
@token_required
def submit_metrics(current_user_id, current_username):
    try:
        data = request.get_json() or {}
        session_id = safe_int(data.get('session_id'))
        rt_val = data.get('reaction_time') if data.get('reaction_time') is not None else data.get('reaction_time_ms')
        reaction_time = safe_float(rt_val)
        acc_val = data.get('accuracy_rate') if data.get('accuracy_rate') is not None else data.get('accuracy')
        accuracy = safe_float(acc_val)
        diff_val = data.get('difficulty') if data.get('difficulty') is not None else data.get('difficulty_level')
        difficulty = safe_int(diff_val)
        
        if not session_id or reaction_time is None or accuracy is None or not difficulty:
            return jsonify({"status": "error", "message": "Missing required fields"}), 400
            
        session_obj = GameSession.query.get(session_id)
        game_type = data.get('game_type', session_obj.game_type if session_obj else None)
        cognitive_domain = data.get('cognitive_domain', GAME_TO_DOMAIN.get(game_type))
        
        pm = PerformanceMetric(
            session_id=session_id,
            reaction_time=reaction_time,
            accuracy_rate=accuracy,
            difficulty_level=difficulty,
            cognitive_domain=cognitive_domain,
            game_type=game_type,
            error_count=safe_int(data.get('error_count'), 0),
            hesitation_ms=safe_float(data.get('hesitation_ms'), 0.0),
            spam_click_count=safe_int(data.get('spam_click_count'), 0),
            rule_shift_latency_ms=safe_float(data.get('rule_shift_latency_ms')),
            path_efficiency=safe_float(data.get('path_efficiency'))
        )
        db.session.add(pm)
        
        xp_gained, coins_gained, leveled_up, newly_unlocked = execute_gamification(current_user_id, reaction_time, accuracy, difficulty, game_type)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "rewards": {
                "xp": xp_gained, "coins": coins_gained,
                "leveled_up": leveled_up, "newly_unlocked": newly_unlocked
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in submit_metrics: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500

@game_bp.route('/api/submit-assessment', methods=['POST'])
@token_required
def submit_assessment(current_user_id, current_username):
    try:
        data = request.get_json() or {}
        assessment_type = data.get('assessment_type')
        if assessment_type not in ('pre-test', 'post-test'):
            return jsonify({"status": "error", "message": "Invalid type"}), 400
            
        answers = data.get('answers') or {}
        sv = safe_float(answers.get('spatial_visual_score'), 50.0)
        lm = safe_float(answers.get('logical_math_score'), 50.0)
        at = safe_float(answers.get('attention_score'), 50.0)
        ex = safe_float(answers.get('executive_score'), 50.0)
        
        ca = CognitiveAssessment(
            user_id=current_user_id, 
            assessment_type=assessment_type, 
            spatial_visual_score=sv, 
            logical_math_score=lm, 
            attention_score=at, 
            executive_score=ex,
            item_metadata=data.get('metadata')
        )
        
        scores_map = {"spatial_visual_memory": sv, "logical_mathematical": lm, "reflexes_and_focus": at, "executive_strategy": ex}
        
        # Generate AI Feedback if it's a post-test
        ai_feedback_string = None
        if assessment_type == 'post-test':
            pre_test = CognitiveAssessment.query.filter_by(user_id=current_user_id, assessment_type='pre-test').order_by(CognitiveAssessment.completed_at.asc()).first()
            if pre_test:
                pre_scores = {
                    "spatial_visual_memory": pre_test.spatial_visual_score,
                    "logical_mathematical": pre_test.logical_math_score,
                    "reflexes_and_focus": pre_test.attention_score,
                    "executive_strategy": pre_test.executive_score
                }
                ai_feedback_string = generate_post_test_ai_feedback(pre_scores, scores_map, data.get('metadata'))
                ca.ai_feedback = ai_feedback_string

        db.session.add(ca)
        db.session.commit()
        
        weakest_domain = min(scores_map, key=scores_map.get)
        domain_to_game = {"spatial_visual_memory": "MatrixRecall", "logical_mathematical": "LogicLink", "reflexes_and_focus": "SpeedTap", "executive_strategy": "PriorityQueue"}
        
        return jsonify({
            "status": "success", "user_id": current_user_id, "assessment_type": assessment_type,
            "scores": {"spatial_visual_memory": round(sv, 2), "logical_mathematical": round(lm, 2), "reflexes_and_focus": round(at, 2), "executive_strategy": round(ex, 2)},
            "weakest_domain": weakest_domain, "prescribed_game": domain_to_game.get(weakest_domain),
            "personalized_report": generate_pros_cons(scores_map),
            "ai_feedback": ai_feedback_string
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in submit_assessment: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500

@game_bp.route('/api/assessment-status/<username>', methods=['GET'])
def get_assessment_status(username):
    try:
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"status": "success", "exists": False, "pre_test": None, "post_test": None, "prescribed_game": None}), 200
            
        pre = CognitiveAssessment.query.filter_by(user_id=user.id, assessment_type='pre-test').order_by(CognitiveAssessment.completed_at.desc(), CognitiveAssessment.id.desc()).first()
        post = CognitiveAssessment.query.filter_by(user_id=user.id, assessment_type='post-test').order_by(CognitiveAssessment.completed_at.desc(), CognitiveAssessment.id.desc()).first()
        
        pre_data = None
        prescribed_game = None
        weakest_domain = None
        if pre:
            pre_data = {"spatial_visual_memory": pre.spatial_visual_score, "logical_mathematical": pre.logical_math_score, "reflexes_and_focus": pre.attention_score, "executive_strategy": pre.executive_score}
            weakest_domain = min(pre_data, key=pre_data.get)
            domain_to_game = {"spatial_visual_memory": "MatrixRecall", "logical_mathematical": "LogicLink", "reflexes_and_focus": "SpeedTap", "executive_strategy": "PriorityQueue"}
            prescribed_game = domain_to_game.get(weakest_domain)
            
        post_data = None
        if post:
            post_data = {"spatial_visual_memory": post.spatial_visual_score, "logical_mathematical": post.logical_math_score, "reflexes_and_focus": post.attention_score, "executive_strategy": post.executive_score}
            
        return jsonify({
            "status": "success", "exists": True, "pre_test": pre_data, "post_test": post_data,
            "weakest_domain": weakest_domain, "prescribed_game": prescribed_game,
            "personalized_report": generate_pros_cons(pre_data) if pre_data else None,
            "ai_feedback": post.ai_feedback if post else None
        }), 200
    except Exception as e:
        logger.error(f"Error in assessment_status: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500

@game_bp.route('/api/submit-metrics/batch', methods=['POST'])
@token_required
def submit_metrics_batch(current_user_id, current_username):
    try:
        data = request.get_json() or {}
        metrics_list = data.get("telemetry", data.get("metrics", []))
        
        if not metrics_list:
            return jsonify({"status": "success", "message": "No metrics"}), 201
            
        recorded_count = 0
        total_xp = 0
        total_coins = 0
        leveled_up_flag = False
        newly_unlocked_set = set()
        
        session_ids = list(set(safe_int(item.get('session_id')) for item in metrics_list if safe_int(item.get('session_id'))))
        sessions_map = {s.id: s for s in GameSession.query.filter(GameSession.id.in_(session_ids)).all()}
        
        valid_metrics_data = []
        metrics_to_add = []
        
        for item in metrics_list:
            session_id = safe_int(item.get('session_id'))
            reaction_time = safe_float(item.get('reaction_time') if item.get('reaction_time') is not None else item.get('reaction_time_ms'))
            accuracy = safe_float(item.get('accuracy_rate') if item.get('accuracy_rate') is not None else item.get('accuracy'))
            difficulty = safe_int(item.get('difficulty') if item.get('difficulty') is not None else item.get('difficulty_level'))
            
            if not session_id or reaction_time is None or accuracy is None or not difficulty:
                continue
                
            session_obj = sessions_map.get(session_id)
            if not session_obj:
                continue
                
            game_type = item.get('game_type', session_obj.game_type)
            cognitive_domain = item.get('cognitive_domain', GAME_TO_DOMAIN.get(game_type))
            
            pm = PerformanceMetric(
                session_id=session_id,
                reaction_time=reaction_time,
                accuracy_rate=accuracy,
                difficulty_level=difficulty,
                cognitive_domain=cognitive_domain,
                game_type=game_type,
                error_count=safe_int(item.get('error_count'), 0),
                hesitation_ms=safe_float(item.get('hesitation_ms'), 0.0),
                spam_click_count=safe_int(item.get('spam_click_count'), 0),
                rule_shift_latency_ms=safe_float(item.get('rule_shift_latency_ms')),
                path_efficiency=safe_float(item.get('path_efficiency'))
            )
            metrics_to_add.append(pm)
            
            valid_metrics_data.append({
                'reaction_time': reaction_time,
                'accuracy': accuracy,
                'difficulty': difficulty,
                'game_type': game_type
            })
            
            recorded_count += 1
            
        if metrics_to_add:
            db.session.add_all(metrics_to_add)
            
        if valid_metrics_data:
            total_xp, total_coins, leveled_up_flag, newly_unlocked_list = execute_gamification_batch(current_user_id, valid_metrics_data)
            newly_unlocked_set.update(newly_unlocked_list)
            
        db.session.commit()
        return jsonify({
            "status": "success",
            "message": f"Batched {recorded_count} metrics",
            "rewards": {
                "xp": total_xp,
                "coins": total_coins,
                "leveled_up": leveled_up_flag,
                "newly_unlocked": list(newly_unlocked_set)
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in submit_metrics_batch: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500

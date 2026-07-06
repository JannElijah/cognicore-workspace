from flask import Blueprint, jsonify, request
from auth import token_required
from database import db
from models import (User, GameSession, PerformanceMetric, CognitiveProfile, 
                    UserStreak, UserProfile, DailyTask, UserAchievement, UserInventory, 
                    CognitiveAssessment, ArchetypeHistory)
from game_utils import (GAME_TO_DOMAIN, calculate_dda_parameters, 
                        calculate_ols_slope, archetype_classifier, 
                        ml_history_cache, generate_pros_cons)
import logging

game_bp = Blueprint('game_bp', __name__)
logger = logging.getLogger(__name__)

def safe_float(val, default=0.0):
    try:
        return float(val) if val is not None else default
    except (ValueError, TypeError):
        return default

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

    prof = UserProfile.query.get(uid)
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

    # Achievements (Simplified logic to fit, will use helper)
    def unlock_achievement(ach_id, current_amount, target_amount, reward_coins, reward_item=None, reward_item_type=None):
        nonlocal coins_gained
        ach = UserAchievement.query.filter_by(user_id=uid, achievement_id=ach_id).first()
        if not ach:
            ach = UserAchievement(user_id=uid, achievement_id=ach_id, current_amount=0)
            db.session.add(ach)
        
        if ach.is_completed:
            return
            
        ach.current_amount = current_amount
        if ach.current_amount >= target_amount:
            ach.is_completed = True
            if reward_coins:
                prof.coins += reward_coins
                coins_gained += reward_coins
            if reward_item:
                inv = UserInventory.query.filter_by(user_id=uid, item_id=reward_item).first()
                if not inv:
                    db.session.add(UserInventory(user_id=uid, item_id=reward_item, item_type=reward_item_type))
            newly_unlocked.append(ach_id)

    if reaction_time < 400:
        ach = UserAchievement.query.filter_by(user_id=uid, achievement_id='speed_demon').first()
        amt = ach.current_amount + 1 if ach else 1
        unlock_achievement('speed_demon', amt, 10, 0, 'avatar-speed-demon', 'avatar')
        
    if prof.level >= 10:
        unlock_achievement('scholar', 1, 1, 0, 'banner-scholar', 'banner')

    unlock_achievement('first_steps', 1, 1, 100)

    ach_con = UserAchievement.query.filter_by(user_id=uid, achievement_id='consistency').first()
    unlock_achievement('consistency', (ach_con.current_amount + 1 if ach_con else 1), 50, 500)

    if accuracy >= 1.0:
        ach_am = UserAchievement.query.filter_by(user_id=uid, achievement_id='accuracy_master').first()
        unlock_achievement('accuracy_master', (ach_am.current_amount + 1 if ach_am else 1), 5, 1000)

    if accuracy >= 0.9:
        ach_ss = UserAchievement.query.filter_by(user_id=uid, achievement_id='sharpshooter').first()
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
        
        if game_mode == 'daily_challenge':
            initial_difficulty = 3
            
        session_obj.current_smooth_difficulty = float(initial_difficulty)
        
        prof = CognitiveProfile.query.filter_by(user_id=current_user_id).first()
        if prof:
            cognitive_profile = {
                "archetype": prof.archetype_name,
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
        return jsonify({"status": "error", "message": str(e)}), 500

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
        if game_mode == 'daily_challenge':
            return jsonify({
                "status": "success", "new_difficulty": 3,
                "is_level_up": False, "is_level_down": False,
                "classification": None, "advisor_message": None
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
        current_difficulty = metrics[0].difficulty_level
        
        alpha = max(0.1, min(1.0, safe_float(data.get('smoothing_alpha'), 0.3)))
        current_smooth_difficulty = session_obj.current_smooth_difficulty if session_obj.current_smooth_difficulty is not None else float(current_difficulty)
        
        raw_diff = float(current_difficulty)
        if avg_accuracy > 0.90:
            raw_diff = min(5.0, current_difficulty + 1.0)
        elif avg_accuracy < 0.70:
            raw_diff = max(1.0, current_difficulty - 1.0)
            
        smooth_diff = alpha * raw_diff + (1.0 - alpha) * current_smooth_difficulty
        new_difficulty = max(1, min(5, int(round(smooth_diff))))
        session_obj.current_smooth_difficulty = smooth_diff
        
        dda_params = calculate_dda_parameters(new_difficulty, game_type, user_avg_rt=avg_rt)
        
        cache_key = str(current_user_id)
        if cache_key in ml_history_cache and len(ml_history_cache[cache_key]['acc']) >= 20:
            history_acc = ml_history_cache[cache_key]['acc'][-19:]
            history_rt = ml_history_cache[cache_key]['rt'][-19:]
            history_acc.append(avg_accuracy)
            history_rt.append(avg_rt)
        else:
            sessions = db.session.query(
                GameSession.id, 
                db.func.avg(PerformanceMetric.accuracy_rate).label('avg_accuracy'),
                db.func.avg(PerformanceMetric.reaction_time).label('avg_rt')
            ).join(PerformanceMetric).filter(GameSession.user_id == current_user_id, GameSession.id <= session_id).group_by(GameSession.id).order_by(GameSession.id.desc()).limit(20).all()
            
            sessions = sorted(sessions, key=lambda x: x.id)
            history_acc = []
            history_rt = []
            found_current = False
            for s in sessions:
                if s.id == session_id:
                    found_current = True
                    history_acc.append(avg_accuracy)
                    history_rt.append(avg_rt)
                else:
                    history_acc.append(s.avg_accuracy)
                    history_rt.append(s.avg_rt)
            if not found_current:
                history_acc.append(avg_accuracy)
                history_rt.append(avg_rt)
                
        ml_history_cache[cache_key] = {'acc': history_acc.copy(), 'rt': history_rt.copy()}
        
        acc_slope = calculate_ols_slope(history_acc)
        rt_slope = calculate_ols_slope(history_rt)
        
        pred_res = archetype_classifier.predict(avg_accuracy, avg_rt, acc_slope, rt_slope)
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
        return jsonify({"status": "error", "message": str(e)}), 500

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
        return jsonify({"status": "error", "message": str(e)}), 500

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
        
        ca = CognitiveAssessment(user_id=current_user_id, assessment_type=assessment_type, spatial_visual_score=sv, logical_math_score=lm, attention_score=at, executive_score=ex)
        db.session.add(ca)
        db.session.commit()
        
        scores_map = {"spatial_visual_memory": sv, "logical_mathematical": lm, "reflexes_and_focus": at, "executive_strategy": ex}
        weakest_domain = min(scores_map, key=scores_map.get)
        domain_to_game = {"spatial_visual_memory": "MatrixRecall", "logical_mathematical": "LogicLink", "reflexes_and_focus": "SpeedTap", "executive_strategy": "PriorityQueue"}
        
        return jsonify({
            "status": "success", "user_id": current_user_id, "assessment_type": assessment_type,
            "scores": {"spatial_visual_memory": round(sv, 2), "logical_mathematical": round(lm, 2), "reflexes_and_focus": round(at, 2), "executive_strategy": round(ex, 2)},
            "weakest_domain": weakest_domain, "prescribed_game": domain_to_game.get(weakest_domain),
            "personalized_report": generate_pros_cons(scores_map)
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in submit_assessment: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

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
            "personalized_report": generate_pros_cons(pre_data) if pre_data else None
        }), 200
    except Exception as e:
        logger.error(f"Error in assessment_status: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@game_bp.route('/api/submit-metrics/batch', methods=['POST'])
@token_required
def submit_metrics_batch(current_user_id, current_username):
    try:
        data = request.get_json() or {}
        metrics_list = data.get("telemetry", [])
        
        if not metrics_list:
            return jsonify({"status": "success", "message": "No metrics"}), 201
            
        recorded_count = 0
        total_xp = 0
        total_coins = 0
        leveled_up_flag = False
        newly_unlocked_set = set()
        
        for item in metrics_list:
            session_id = safe_int(item.get('session_id'))
            reaction_time = safe_float(item.get('reaction_time') if item.get('reaction_time') is not None else item.get('reaction_time_ms'))
            accuracy = safe_float(item.get('accuracy_rate') if item.get('accuracy_rate') is not None else item.get('accuracy'))
            difficulty = safe_int(item.get('difficulty') if item.get('difficulty') is not None else item.get('difficulty_level'))
            
            if not session_id or reaction_time is None or accuracy is None or not difficulty:
                continue
                
            session_obj = GameSession.query.get(session_id)
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
            db.session.add(pm)
            
            xp_gained, coins_gained, leveled_up, newly_unlocked = execute_gamification(current_user_id, reaction_time, accuracy, difficulty, game_type)
            total_xp += xp_gained
            total_coins += coins_gained
            if leveled_up:
                leveled_up_flag = True
            for ul in newly_unlocked:
                newly_unlocked_set.add(ul)
                
            recorded_count += 1
            
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
        return jsonify({"status": "error", "message": str(e)}), 500

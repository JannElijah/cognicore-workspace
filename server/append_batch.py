
batch_code = """
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
"""
with open('routes/game.py', 'a') as f:
    f.write(batch_code)

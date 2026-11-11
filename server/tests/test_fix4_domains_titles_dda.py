import pytest
from unittest.mock import patch

from models import User, GameSession, PerformanceMetric, CognitiveProfile, UserInventory
from game_utils import GAME_TO_DOMAIN, DOMAIN_TITLE_MAP, get_domain_for_game, calculate_dda_parameters
from routes.analytics import DOMAIN_GAME_MAP


def _ensure_testuser(db):
    user = User.query.filter_by(username="testuser").first()
    if not user:
        user = User(username="testuser", supabase_uid="123e4567-e89b-12d3-a456-426614174000")
        db.session.add(user)
        db.session.commit()
    return user


def test_four_games_domain_and_dda_configs():
    expected = {
        "SequenceDecoder": "logical_mathematical",
        "sequence_decoder": "logical_mathematical",
        "EquationBalance": "logical_mathematical",
        "equation_balance": "logical_mathematical",
        "RouteOptimizer": "logical_mathematical",
        "route_optimizer": "logical_mathematical",
        "RuleShifter": "executive_strategy",
        "rule_shifter": "executive_strategy",
    }
    for game, domain in expected.items():
        assert GAME_TO_DOMAIN[game] == domain
        assert get_domain_for_game(game) == domain

    rs_params = calculate_dda_parameters(3, "RuleShifter")
    assert rs_params["difficulty_level"] == 3
    assert "rule_switch_interval" in rs_params
    assert "choice_count" in rs_params
    assert "spawn_delay" not in rs_params

    sd_params = calculate_dda_parameters(2, "SequenceDecoder")
    assert "pattern_types" in sd_params

    eb_params = calculate_dda_parameters(2, "EquationBalance")
    assert "operators" in eb_params

    ro_params = calculate_dda_parameters(2, "RouteOptimizer")
    assert "node_count" in ro_params
    assert DOMAIN_TITLE_MAP["executive_strategy"] == "title-strategist"


def test_analytics_domain_game_map_and_null_domain_recovery(client, db):
    assert DOMAIN_GAME_MAP == {
        "reflexes_and_focus": "Speed Tap",
        "spatial_visual_memory": "Matrix Recall",
        "executive_strategy": "Priority Queue",
        "logical_mathematical": "Equation Balance",
    }

    user = _ensure_testuser(db)
    sess = GameSession(user_id=user.id, game_type="RuleShifter", game_mode="timed")
    db.session.add(sess)
    db.session.flush()
    pm = PerformanceMetric(
        session_id=sess.id,
        reaction_time=900.0,
        accuracy_rate=0.85,
        difficulty_level=2,
        cognitive_domain=None,
        game_type="RuleShifter",
    )
    db.session.add(pm)
    db.session.commit()

    res = client.get(
        "/api/user-analytics/testuser",
        headers={"Authorization": "Bearer dummy_token"},
    )
    assert res.status_code == 200
    data = res.get_json()
    domains = {row["cognitive_domain"] for row in data["domain_stats"]}
    assert "executive_strategy" in domains
    assert None not in domains
    assert data["cognitive_profile"]["recommended_game"] in DOMAIN_GAME_MAP.values()


@pytest.mark.parametrize(
    "game_type,expected_title",
    [
        ("SpeedTap", "title-reflex-demon"),
        ("MatrixRecall", "title-zen-architect"),
        ("SequenceDecoder", "title-logic-weaver"),
        ("RuleShifter", "title-strategist"),
    ],
)
def test_dda_unlocks_domain_titles_for_real_archetypes(client, db, game_type, expected_title):
    user = _ensure_testuser(db)
    UserInventory.query.filter_by(user_id=user.id, item_type="title").delete()
    db.session.commit()

    start_res = client.post(
        "/api/start-session",
        json={"username": "testuser", "game_type": game_type},
        headers={"Authorization": "Bearer dummy_token"},
    )
    assert start_res.status_code == 201
    sid = start_res.get_json()["session_id"]

    m_res = client.post(
        "/api/submit-metrics",
        json={"session_id": sid, "reaction_time": 450.0, "accuracy_rate": 0.90, "difficulty": 1},
        headers={"Authorization": "Bearer dummy_token"},
    )
    assert m_res.status_code == 201

    with patch("routes.game.archetype_classifier.predict", return_value={"archetype": "Steady Improver", "confidence_score": 0.91}):
        dda_res = client.post(
            "/api/dda",
            json={"session_id": sid, "smoothing_alpha": 1.0},
            headers={"Authorization": "Bearer dummy_token"},
        )
    assert dda_res.status_code == 200

    owned = UserInventory.query.filter_by(user_id=user.id, item_type="title", item_id=expected_title).first()
    assert owned is not None


def test_high_fatigue_does_not_unlock_title_and_purchase_enforces_real_archetypes(client, db):
    user = _ensure_testuser(db)
    UserInventory.query.filter_by(user_id=user.id, item_type="title").delete()
    CognitiveProfile.query.filter_by(user_id=user.id).delete()
    db.session.commit()

    start_res = client.post(
        "/api/start-session",
        json={"username": "testuser", "game_type": "RouteOptimizer"},
        headers={"Authorization": "Bearer dummy_token"},
    )
    sid = start_res.get_json()["session_id"]
    client.post(
        "/api/submit-metrics",
        json={"session_id": sid, "reaction_time": 3200.0, "accuracy_rate": 0.40, "difficulty": 2},
        headers={"Authorization": "Bearer dummy_token"},
    )

    with patch("routes.game.archetype_classifier.predict", return_value={"archetype": "High Fatigue", "confidence_score": 0.88}):
        dda_res = client.post(
            "/api/dda",
            json={"session_id": sid, "smoothing_alpha": 1.0},
            headers={"Authorization": "Bearer dummy_token"},
        )
    assert dda_res.status_code == 200
    assert dda_res.get_json()["dda_parameters"]["difficulty_level"] == 1
    assert UserInventory.query.filter_by(user_id=user.id, item_type="title", item_id="title-logic-weaver").first() is None

    # Purchase must reject High Fatigue cleanly using real archetype criteria
    p_fail = client.post(
        "/api/purchase",
        json={"item_id": "title-logic-weaver"},
        headers={"Authorization": "Bearer dummy_token"},
    )
    assert p_fail.status_code == 403

    inv_res = client.get(
        "/api/user-inventory/testuser",
        headers={"Authorization": "Bearer dummy_token"},
    )
    assert inv_res.status_code == 200
    stats = inv_res.get_json()["stats"]
    assert stats["archetype"] == "High Fatigue"
    assert "domain_max_accuracy" in stats


def test_purchase_archetype_title_join_and_validation(client, db):
    user = _ensure_testuser(db)
    UserInventory.query.filter_by(user_id=user.id, item_type="title").delete()
    CognitiveProfile.query.filter_by(user_id=user.id).delete()
    # Wipe prior metrics for isolated purchase validation
    for s in GameSession.query.filter_by(user_id=user.id).all():
        PerformanceMetric.query.filter_by(session_id=s.id).delete()
    db.session.add(CognitiveProfile(user_id=user.id, archetype_name="Steady Improver", confidence_score=0.9))
    sess = GameSession(user_id=user.id, game_type="EquationBalance", game_mode="timed")
    db.session.add(sess)
    db.session.flush()
    db.session.add(
        PerformanceMetric(
            session_id=sess.id,
            reaction_time=1200.0,
            accuracy_rate=0.90,
            difficulty_level=2,
            cognitive_domain="logical_mathematical",
            game_type="EquationBalance",
        )
    )
    db.session.commit()

    # Different domain (executive_strategy) without metrics must return 403, not 500
    p_wrong_domain = client.post(
        "/api/purchase",
        json={"item_id": "title-strategist"},
        headers={"Authorization": "Bearer dummy_token"},
    )
    assert p_wrong_domain.status_code == 403

    # Qualifying domain (logical_mathematical) with Steady Improver and 0.90 acc succeeds (200)
    p_ok = client.post(
        "/api/purchase",
        json={"item_id": "title-logic-weaver"},
        headers={"Authorization": "Bearer dummy_token"},
    )
    assert p_ok.status_code == 200
    assert p_ok.get_json()["item"]["item_id"] == "title-logic-weaver"


def test_irt_dda_respects_expected_flow_target_no_blind_step_at_70_pct(client, db):
    # At Level 2, 0.70 accuracy is below the 0.80 IRT flow target so DDA should not force +1 step up
    start_res = client.post(
        "/api/start-session",
        json={"username": "testuser", "game_type": "EquationBalance"},
        headers={"Authorization": "Bearer dummy_token"},
    )
    sid = start_res.get_json()["session_id"]
    client.post(
        "/api/submit-metrics",
        json={"session_id": sid, "reaction_time": 2000.0, "accuracy_rate": 0.70, "difficulty": 2},
        headers={"Authorization": "Bearer dummy_token"},
    )
    dda_res = client.post(
        "/api/dda",
        json={"session_id": sid, "smoothing_alpha": 1.0},
        headers={"Authorization": "Bearer dummy_token"},
    )
    assert dda_res.status_code == 200
    assert dda_res.get_json()["dda_parameters"]["difficulty_level"] == 2

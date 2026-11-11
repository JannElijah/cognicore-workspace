from datetime import datetime, timedelta

from models import CognitiveAssessment, GameSession, PerformanceMetric, User
from utils import compute_pearson_correlation


def test_pearson_correlation_helper_edge_cases():
    assert compute_pearson_correlation([], []) == (0.0, 1.0)
    assert compute_pearson_correlation([1.0], [2.0]) == (0.0, 1.0)
    # Zero variance -> safe 0 correlation
    assert compute_pearson_correlation([5.0, 5.0, 5.0], [1.0, 2.0, 3.0]) == (0.0, 1.0)

    r_pos, p_pos = compute_pearson_correlation([1.0, 2.0], [2.0, 4.0])
    assert round(r_pos, 6) == 1.0
    assert p_pos == 0.0

    r_neg, p_neg = compute_pearson_correlation([1.0, 2.0, 3.0, 4.0], [10.0, 8.0, 5.0, 2.0])
    assert r_neg < -0.99
    assert 0.0 <= p_neg < 0.01


def test_cohort_analytics_runs_on_sqlite_with_latest_pair_per_user(client, db):
    orig_assessments = [
        {
            col.name: getattr(row, col.name)
            for col in CognitiveAssessment.__table__.columns
            if col.name != "id"
        }
        for row in CognitiveAssessment.query.all()
    ]

    try:
        CognitiveAssessment.query.delete()
        db.session.commit()

        res_empty = client.get(
            "/api/cohort-analytics",
            headers={"Authorization": "Bearer dummy_token"},
        )
        assert res_empty.status_code == 404

        base_time = datetime(2026, 2, 1, 9, 0, 0)
        for idx, (pre_v, post_v) in enumerate([(50.0, 70.0), (55.0, 78.0), (60.0, 84.0)]):
            uname = f"fix8_cohort_u{idx}"
            u = User.query.filter_by(username=uname).first()
            if not u:
                u = User(username=uname)
                db.session.add(u)
                db.session.flush()

            # Older post-test superseded by newer post-test
            db.session.add(
                CognitiveAssessment(
                    user_id=u.id,
                    assessment_type="post-test",
                    spatial_visual_score=10.0,
                    logical_math_score=10.0,
                    attention_score=10.0,
                    executive_score=10.0,
                    completed_at=base_time + timedelta(days=1),
                )
            )
            db.session.add(
                CognitiveAssessment(
                    user_id=u.id,
                    assessment_type="pre-test",
                    spatial_visual_score=pre_v,
                    logical_math_score=pre_v,
                    attention_score=pre_v,
                    executive_score=pre_v,
                    completed_at=base_time,
                )
            )
            db.session.add(
                CognitiveAssessment(
                    user_id=u.id,
                    assessment_type="post-test",
                    spatial_visual_score=post_v,
                    logical_math_score=post_v,
                    attention_score=post_v,
                    executive_score=post_v,
                    completed_at=base_time + timedelta(days=3),
                )
            )
        db.session.commit()

        res = client.get(
            "/api/cohort-analytics",
            headers={"Authorization": "Bearer dummy_token"},
        )
        assert res.status_code == 200
        body = res.get_json()
        assert body["status"] == "success"
        assert body["sample_size"] == 3
        assert body["overall_pre_mean"] == 55.0
        assert body["overall_post_mean"] == 77.33
        assert body["cohort_t_statistic"] > 0
        assert body["cohort_p_value"] < 0.05
        assert body["statistically_significant"] is True
    finally:
        CognitiveAssessment.query.delete()
        db.session.flush()
        for row_data in orig_assessments:
            db.session.add(CognitiveAssessment(**row_data))
        db.session.commit()


def test_research_correlations_runs_on_sqlite(client, db):
    u = User.query.filter_by(username="fix8_corr_user").first()
    if not u:
        u = User(username="fix8_corr_user")
        db.session.add(u)
        db.session.flush()

    sess = GameSession(user_id=u.id, game_type="SpeedTap")
    db.session.add(sess)
    db.session.flush()

    for acc, rt in [(0.6, 800.0), (0.7, 650.0), (0.85, 450.0), (0.95, 300.0)]:
        db.session.add(
            PerformanceMetric(
                session_id=sess.id,
                accuracy_rate=acc,
                reaction_time=rt,
                difficulty_level=2,
            )
        )
    db.session.commit()

    res = client.get(
        "/api/research/correlations?var1=accuracy_rate&var2=reaction_time&cohort=active&username=fix8_corr_user",
        headers={"Authorization": "Bearer dummy_token"},
    )
    # Non-admin requesting another username receives 403; requesting cohort=all succeeds
    assert res.status_code == 403

    res_all = client.get(
        "/api/research/correlations?var1=accuracy_rate&var2=reaction_time&cohort=all",
        headers={"Authorization": "Bearer dummy_token"},
    )
    assert res_all.status_code == 200
    body = res_all.get_json()
    assert body["status"] == "success"
    assert isinstance(body["r"], float)
    assert isinstance(body["r_squared"], float)
    assert isinstance(body["p_value"], float)
    assert len(body["data_points"]) >= 4

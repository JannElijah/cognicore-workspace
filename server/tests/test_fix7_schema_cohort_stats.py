from datetime import datetime, timedelta
import os
import re

from models import CognitiveAssessment, IsoEvaluation, User
from utils import compute_paired_ttest_stats


def _snapshot_rows(model_cls):
    rows = model_cls.query.all()
    snapshots = []
    for row in rows:
        data = {
            col.name: getattr(row, col.name)
            for col in model_cls.__table__.columns
            if col.name != "id"
        }
        snapshots.append(data)
    return snapshots


def _restore_rows(db, model_cls, snapshots):
    model_cls.query.delete()
    db.session.flush()
    for data in snapshots:
        db.session.add(model_cls(**data))
    db.session.commit()


def test_cohort_data_returns_live_paired_stats_and_iso_summary(client, db):
    orig_assessments = _snapshot_rows(CognitiveAssessment)
    orig_iso = _snapshot_rows(IsoEvaluation)

    try:
        CognitiveAssessment.query.delete()
        IsoEvaluation.query.delete()
        db.session.commit()

        base_time = datetime(2026, 1, 1, 10, 0, 0)
        users = []
        for idx in range(4):
            uname = f"fix7_cohort_user_{idx}"
            u = User.query.filter_by(username=uname).first()
            if not u:
                u = User(username=uname)
                db.session.add(u)
                db.session.flush()
            users.append(u)

        # 3 paired users (users 0..2), where user 0 has 2 post-tests (latest should be paired)
        paired_specs = [
            (users[0].id, 55.0, 75.0),
            (users[1].id, 60.0, 82.0),
            (users[2].id, 62.0, 78.0),
        ]
        # Older superseded post-test for user 0 (included in all-assessment avg, superseded in pairing)
        db.session.add(
            CognitiveAssessment(
                user_id=users[0].id,
                assessment_type="post-test",
                spatial_visual_score=60.0,
                logical_math_score=60.0,
                attention_score=60.0,
                executive_score=60.0,
                completed_at=base_time + timedelta(days=1),
            )
        )
        for idx, (uid, pre_val, post_val) in enumerate(paired_specs):
            db.session.add(
                CognitiveAssessment(
                    user_id=uid,
                    assessment_type="pre-test",
                    spatial_visual_score=pre_val,
                    logical_math_score=pre_val,
                    attention_score=pre_val,
                    executive_score=pre_val,
                    completed_at=base_time + timedelta(hours=idx),
                )
            )
            db.session.add(
                CognitiveAssessment(
                    user_id=uid,
                    assessment_type="post-test",
                    spatial_visual_score=post_val,
                    logical_math_score=post_val,
                    attention_score=post_val,
                    executive_score=post_val,
                    completed_at=base_time + timedelta(days=5, hours=idx),
                )
            )

        # 1 unpaired pre-test user (user 3)
        db.session.add(
            CognitiveAssessment(
                user_id=users[3].id,
                assessment_type="pre-test",
                spatial_visual_score=70.0,
                logical_math_score=70.0,
                attention_score=70.0,
                executive_score=70.0,
                completed_at=base_time,
            )
        )

        # 2 ISO evaluations -> average (21 + 23) / 10 = 4.4
        db.session.add(
            IsoEvaluation(
                functionality_score=4,
                usability_score=5,
                reliability_score=3,
                efficiency_score=4,
                ux_score=5,
            )
        )
        db.session.add(
            IsoEvaluation(
                functionality_score=5,
                usability_score=4,
                reliability_score=5,
                efficiency_score=5,
                ux_score=4,
            )
        )
        db.session.commit()

        res = client.get(
            "/api/research/cohort-data",
            headers={"Authorization": "Bearer dummy_token"},
        )
        assert res.status_code == 200
        payload = res.get_json()
        assert payload["status"] == "success"
        assert payload["pre_test_count"] == 4
        assert payload["post_test_count"] == 4

        expected_shift = round(
            payload["avg_post_scores"]["overall"] - payload["avg_pre_scores"]["overall"],
            2,
        )
        assert payload["mean_shift"] == expected_shift

        expected_paired = compute_paired_ttest_stats(
            [pre for _, pre, _ in paired_specs],
            [post for _, _, post in paired_specs],
        )
        stats_block = payload["statistics"]
        assert stats_block["paired_sample_size"] == 3
        assert stats_block["t_statistic"] == expected_paired["t_statistic"]
        assert stats_block["p_value"] == expected_paired["p_value"]
        assert stats_block["cohens_d"] == expected_paired["cohens_d"]
        assert stats_block["effect_size_magnitude"] == expected_paired["effect_size_magnitude"]
        assert stats_block["statistically_significant"] == expected_paired["statistically_significant"]

        assert payload["iso_summary"] == {"count": 2, "overall_mean": 4.4}
    finally:
        _restore_rows(db, CognitiveAssessment, orig_assessments)
        _restore_rows(db, IsoEvaluation, orig_iso)


def test_cohort_data_handles_empty_and_single_pair_gracefully(client, db):
    orig_assessments = _snapshot_rows(CognitiveAssessment)
    orig_iso = _snapshot_rows(IsoEvaluation)

    try:
        CognitiveAssessment.query.delete()
        IsoEvaluation.query.delete()
        db.session.commit()

        u = User.query.first()
        db.session.add(
            CognitiveAssessment(
                user_id=u.id,
                assessment_type="pre-test",
                spatial_visual_score=65.0,
                logical_math_score=65.0,
                attention_score=65.0,
                executive_score=65.0,
            )
        )
        db.session.commit()

        # Pre-test only -> mean_shift is None, no fabricated stats
        res_unpaired = client.get(
            "/api/research/cohort-data",
            headers={"Authorization": "Bearer dummy_token"},
        )
        assert res_unpaired.status_code == 200
        data_unpaired = res_unpaired.get_json()
        assert data_unpaired["mean_shift"] is None
        assert data_unpaired["statistics"]["paired_sample_size"] == 0
        assert data_unpaired["statistics"]["p_value"] is None
        assert data_unpaired["statistics"]["cohens_d"] is None
        assert data_unpaired["iso_summary"] == {"count": 0, "overall_mean": None}

        # Single pair (n = 1 < 2) -> inferential stats remain None
        db.session.add(
            CognitiveAssessment(
                user_id=u.id,
                assessment_type="post-test",
                spatial_visual_score=75.0,
                logical_math_score=75.0,
                attention_score=75.0,
                executive_score=75.0,
            )
        )
        db.session.commit()

        res_single = client.get(
            "/api/research/cohort-data",
            headers={"Authorization": "Bearer dummy_token"},
        )
        assert res_single.status_code == 200
        data_single = res_single.get_json()
        assert data_single["mean_shift"] == 10.0
        assert data_single["statistics"]["paired_sample_size"] == 1
        assert data_single["statistics"]["t_statistic"] is None
        assert data_single["statistics"]["p_value"] is None
        assert data_single["statistics"]["cohens_d"] is None
        assert data_single["statistics"]["statistically_significant"] is False
    finally:
        _restore_rows(db, CognitiveAssessment, orig_assessments)
        _restore_rows(db, IsoEvaluation, orig_iso)


def test_supabase_migration_sql_covers_all_models_and_drifted_columns(db):
    sql_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "supabase_migration.sql")
    )
    with open(sql_path, "r", encoding="utf-8") as f:
        sql_text = f.read()

    # Every canonical SQLAlchemy model table must have CREATE TABLE IF NOT EXISTS
    for table_name in db.metadata.tables.keys():
        pattern = rf"CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+{re.escape(table_name)}\b"
        assert re.search(pattern, sql_text, re.IGNORECASE), (
            f"Missing table {table_name} in supabase_migration.sql"
        )

    # Key columns and constraints that drifted historically
    required_fragments = [
        "item_metadata",
        "ai_feedback",
        "equipped_visualizer",
        "equipped_title",
        "reward_coins",
        "is_completed",
        "'visualizer'",
        "'title'",
        "user_achievements",
        "user_streaks",
        "system_config",
        "system_announcements",
        "audit_logs",
        "bug_reports",
        "game_module_config",
    ]
    for fragment in required_fragments:
        assert fragment in sql_text, f"Missing {fragment} in supabase_migration.sql"

from types import SimpleNamespace
from unittest.mock import patch

from models import GameSession, IsoEvaluation, PerformanceMetric, User


def _set_token_identity_router(mock_supabase_auth):
    identities = {
        "dummy_token": SimpleNamespace(
            id="123e4567-e89b-12d3-a456-426614174000",
            email="test@example.com",
            user_metadata={"username": "testuser"},
        ),
        "token_user_a": SimpleNamespace(
            id="11111111-1111-1111-1111-111111111111",
            email="usera@example.com",
            user_metadata={"username": "user_a_fix5"},
        ),
        "token_user_b": SimpleNamespace(
            id="22222222-2222-2222-2222-222222222222",
            email="userb@example.com",
            user_metadata={"username": "user_b_fix5"},
        ),
        "token_admin": SimpleNamespace(
            id="33333333-3333-3333-3333-333333333333",
            email="admin@example.com",
            user_metadata={"username": "admin_fix5"},
        ),
    }

    def _get_user(token):
        user_obj = identities.get(token)
        if not user_obj:
            raise Exception("Unknown test token")
        return SimpleNamespace(user=user_obj)

    mock_supabase_auth.auth.get_user.side_effect = _get_user


def _ensure_user(db, username, supabase_uid, role="student"):
    user = User.query.filter_by(username=username).first()
    if not user:
        user = User(username=username, supabase_uid=supabase_uid, role=role)
        db.session.add(user)
    else:
        user.supabase_uid = supabase_uid
        user.role = role
    db.session.commit()
    return user


def test_game_session_ownership_enforced_across_telemetry_and_dda(client, db, mock_supabase_auth):
    _set_token_identity_router(mock_supabase_auth)
    user_a = _ensure_user(db, "user_a_fix5", "11111111-1111-1111-1111-111111111111")
    user_b = _ensure_user(db, "user_b_fix5", "22222222-2222-2222-2222-222222222222")

    res_start_a = client.post(
        "/api/start-session",
        json={"game_type": "SpeedTap", "game_mode": "timed"},
        headers={"Authorization": "Bearer token_user_a"},
    )
    assert res_start_a.status_code == 201
    sid_a = res_start_a.get_json()["session_id"]

    res_start_b = client.post(
        "/api/start-session",
        json={"game_type": "SpeedTap", "game_mode": "timed"},
        headers={"Authorization": "Bearer token_user_b"},
    )
    assert res_start_b.status_code == 201
    sid_b = res_start_b.get_json()["session_id"]

    # Nonexistent session_id in /api/submit-metrics should return 404 (not DB integrity 500)
    res_missing = client.post(
        "/api/submit-metrics",
        json={"session_id": 9999999, "reaction_time": 420, "accuracy_rate": 0.9, "difficulty": 2},
        headers={"Authorization": "Bearer token_user_a"},
    )
    assert res_missing.status_code == 404

    # Cross-user /api/submit-metrics -> 403 and no metrics persisted
    res_cross_single = client.post(
        "/api/submit-metrics",
        json={"session_id": sid_a, "reaction_time": 420, "accuracy_rate": 0.9, "difficulty": 2},
        headers={"Authorization": "Bearer token_user_b"},
    )
    assert res_cross_single.status_code == 403
    assert PerformanceMetric.query.filter_by(session_id=sid_a).count() == 0

    # Mixed batch with one owned session + one foreign session -> 403 and entire batch aborted
    res_cross_batch = client.post(
        "/api/submit-metrics/batch",
        json={
            "metrics": [
                {"session_id": sid_b, "reaction_time": 410, "accuracy_rate": 0.9, "difficulty": 2},
                {"session_id": sid_a, "reaction_time": 430, "accuracy_rate": 0.8, "difficulty": 2},
            ]
        },
        headers={"Authorization": "Bearer token_user_b"},
    )
    assert res_cross_batch.status_code == 403
    assert PerformanceMetric.query.filter_by(session_id=sid_a).count() == 0
    assert PerformanceMetric.query.filter_by(session_id=sid_b).count() == 0

    # Cross-user /api/dda -> 403 and smooth difficulty untouched
    before_smooth = db.session.get(GameSession, sid_a).current_smooth_difficulty
    res_cross_dda = client.post(
        "/api/dda",
        json={"session_id": sid_a},
        headers={"Authorization": "Bearer token_user_b"},
    )
    assert res_cross_dda.status_code == 403
    db.session.expire_all()
    assert db.session.get(GameSession, sid_a).current_smooth_difficulty == before_smooth

    # Legitimate owner can submit metrics (single & batch) and step DDA
    res_own_single = client.post(
        "/api/submit-metrics",
        json={"session_id": sid_a, "reaction_time": 390, "accuracy_rate": 0.95, "difficulty": 1},
        headers={"Authorization": "Bearer token_user_a"},
    )
    assert res_own_single.status_code == 201
    res_own_batch = client.post(
        "/api/submit-metrics/batch",
        json={"metrics": [{"session_id": sid_a, "reaction_time": 380, "accuracy_rate": 1.0, "difficulty": 1}]},
        headers={"Authorization": "Bearer token_user_a"},
    )
    assert res_own_batch.status_code == 201
    assert PerformanceMetric.query.filter_by(session_id=sid_a).count() == 2

    res_own_dda = client.post(
        "/api/dda",
        json={"session_id": sid_a},
        headers={"Authorization": "Bearer token_user_a"},
    )
    assert res_own_dda.status_code == 200
    assert user_a.id != user_b.id


def test_assessment_status_and_learning_curves_require_auth_and_ownership(client, db, mock_supabase_auth):
    _set_token_identity_router(mock_supabase_auth)
    _ensure_user(db, "user_a_fix5", "11111111-1111-1111-1111-111111111111")
    _ensure_user(db, "user_b_fix5", "22222222-2222-2222-2222-222222222222")
    _ensure_user(db, "admin_fix5", "33333333-3333-3333-3333-333333333333", role="admin")

    # Unauthenticated calls rejected with 401
    for path in (
        "/api/assessment-status/user_a_fix5",
        "/api/research/learning-curves/user_a_fix5",
        "/api/research/cohort-data",
        "/api/research/correlations",
        "/api/cohort-db-scores",
        "/api/cohort-analytics",
        "/api/export-csv",
        "/api/iso-evaluations",
        "/api/iso-evaluations/summary",
    ):
        assert client.get(path).status_code == 401, f"Expected 401 on GET {path}"
    assert client.post("/api/iso-evaluations", json={}).status_code == 401

    # Cross-user access denied (403)
    assert (
        client.get(
            "/api/assessment-status/user_a_fix5",
            headers={"Authorization": "Bearer token_user_b"},
        ).status_code
        == 403
    )
    assert (
        client.get(
            "/api/research/learning-curves/user_a_fix5",
            headers={"Authorization": "Bearer token_user_b"},
        ).status_code
        == 403
    )

    # Owner and admin access succeed
    assert (
        client.get(
            "/api/assessment-status/user_a_fix5",
            headers={"Authorization": "Bearer token_user_a"},
        ).status_code
        == 200
    )
    assert (
        client.get(
            "/api/assessment-status/user_a_fix5",
            headers={"Authorization": "Bearer token_admin"},
        ).status_code
        == 200
    )
    assert (
        client.get(
            "/api/research/learning-curves/user_a_fix5",
            headers={"Authorization": "Bearer token_user_a"},
        ).status_code
        == 200
    )
    assert (
        client.get(
            "/api/research/learning-curves/user_a_fix5",
            headers={"Authorization": "Bearer token_admin"},
        ).status_code
        == 200
    )

    # Cohort aggregate endpoint works when signed in
    assert (
        client.get(
            "/api/research/cohort-data",
            headers={"Authorization": "Bearer token_user_a"},
        ).status_code
        == 200
    )


def test_correlations_privacy_and_cohort_active_authorization(client, db, mock_supabase_auth):
    _set_token_identity_router(mock_supabase_auth)
    _ensure_user(db, "user_a_fix5", "11111111-1111-1111-1111-111111111111")
    _ensure_user(db, "user_b_fix5", "22222222-2222-2222-2222-222222222222")
    _ensure_user(db, "admin_fix5", "33333333-3333-3333-3333-333333333333", role="admin")

    # Student cannot inspect another named user's 'active' correlation cohort
    res_forbidden = client.get(
        "/api/research/correlations?cohort=active&username=user_a_fix5",
        headers={"Authorization": "Bearer token_user_b"},
    )
    assert res_forbidden.status_code == 403

    class FakeCursor:
        def execute(self, *args, **kwargs):
            return None

        def fetchall(self):
            return [
                {"val1": 100.0, "val2": 1.0, "username": "user_a_fix5", "r_coeff": 0.5, "n_points": 2},
                {"val1": 200.0, "val2": 2.0, "username": "user_b_fix5", "r_coeff": 0.5, "n_points": 2},
            ]

    class FakeConn:
        def cursor(self):
            return FakeCursor()

        def close(self):
            return None

    with patch("routes.research.get_db_connection", side_effect=lambda: FakeConn()):
        res_student = client.get(
            "/api/research/correlations?cohort=all",
            headers={"Authorization": "Bearer token_user_b"},
        )
        assert res_student.status_code == 200
        pts_student = res_student.get_json()["data_points"]
        assert pts_student[0]["username"] == "participant"
        assert pts_student[1]["username"] == "user_b_fix5"

        res_admin = client.get(
            "/api/research/correlations?cohort=all",
            headers={"Authorization": "Bearer token_admin"},
        )
        assert res_admin.status_code == 200
        pts_admin = res_admin.get_json()["data_points"]
        assert [p["username"] for p in pts_admin] == ["user_a_fix5", "user_b_fix5"]


def test_export_csv_admin_only_and_safe_named_cursor_cleanup(client, db, mock_supabase_auth):
    _set_token_identity_router(mock_supabase_auth)
    _ensure_user(db, "user_a_fix5", "11111111-1111-1111-1111-111111111111")
    _ensure_user(db, "admin_fix5", "33333333-3333-3333-3333-333333333333", role="admin")

    # Non-admin student rejected with 403
    res_student = client.get(
        "/api/export-csv",
        headers={"Authorization": "Bearer token_user_a"},
    )
    assert res_student.status_code == 403

    # Test named server-side cursor transaction toggle + streaming as admin
    events = {"closed_cursor": False, "closed_conn": False, "committed": False, "named_arg": None}

    class NamedFakeCursor:
        def execute(self, *args, **kwargs):
            return None

        def fetchmany(self, size):
            if not getattr(self, "_done", False):
                self._done = True
                return [
                    {
                        "metric_id": 1,
                        "session_id": 10,
                        "user_id": 2,
                        "username": "user_a_fix5",
                        "cognitive_domain": "reflexes_and_focus",
                        "game_type": "SpeedTap",
                        "reaction_time": 350.0,
                        "accuracy_rate": 0.92,
                        "difficulty_level": 2,
                        "error_count": 0,
                        "hesitation_ms": 12.0,
                        "spam_click_count": 0,
                        "rule_shift_latency_ms": None,
                        "path_efficiency": None,
                        "recorded_at": "2026-01-01T00:00:00",
                    }
                ]
            return []

        def close(self):
            events["closed_cursor"] = True

    class FakePgConn:
        def __init__(self):
            self.autocommit = True

        def cursor(self, *args, **kwargs):
            assert self.autocommit is False
            events["named_arg"] = kwargs.get("name")
            return NamedFakeCursor()

        def commit(self):
            events["committed"] = True

        def rollback(self):
            return None

        def close(self):
            events["closed_conn"] = True

    fake_conn = FakePgConn()
    with patch("routes.research.get_db_connection", return_value=fake_conn):
        res_admin = client.get(
            "/api/export-csv",
            headers={"Authorization": "Bearer token_admin"},
        )
        assert res_admin.status_code == 200
        csv_body = res_admin.get_data(as_text=True)

    assert "Metric ID,Session ID,User ID,Username" in csv_body
    assert "user_a_fix5" in csv_body
    assert events["named_arg"] == "csv_export_cursor"
    assert events["closed_cursor"] is True
    assert events["committed"] is True
    assert events["closed_conn"] is True
    assert fake_conn.autocommit is True

    # Test cursor() failure before assignment does NOT raise UnboundLocalError
    error_events = {"closed_conn": False, "rolled_back": False}

    class BrokenCursorConn:
        def __init__(self):
            self.autocommit = True

        def cursor(self, *args, **kwargs):
            raise RuntimeError("cursor initialization failed")

        def rollback(self):
            error_events["rolled_back"] = True

        def commit(self):
            raise AssertionError("commit should not run after error")

        def close(self):
            error_events["closed_conn"] = True

    broken_conn = BrokenCursorConn()
    with patch("routes.research.get_db_connection", return_value=broken_conn):
        res_err = client.get(
            "/api/export-csv",
            headers={"Authorization": "Bearer token_admin"},
        )
        assert res_err.status_code == 200
        _ = res_err.get_data(as_text=True)

    assert error_events["rolled_back"] is True
    assert error_events["closed_conn"] is True
    assert broken_conn.autocommit is True


def test_iso_evaluations_post_get_and_summary(client, db, mock_supabase_auth):
    _set_token_identity_router(mock_supabase_auth)
    _ensure_user(db, "user_a_fix5", "11111111-1111-1111-1111-111111111111")

    IsoEvaluation.query.delete()
    db.session.commit()

    # Invalid payloads rejected with 400
    assert (
        client.post(
            "/api/iso-evaluations",
            json={"functionality_score": 4, "usability_score": 5},
            headers={"Authorization": "Bearer token_user_a"},
        ).status_code
        == 400
    )
    assert (
        client.post(
            "/api/iso-evaluations",
            json={
                "functionality_score": 6,
                "usability_score": 5,
                "reliability_score": 3,
                "efficiency_score": 4,
                "ux_score": 5,
            },
            headers={"Authorization": "Bearer token_user_a"},
        ).status_code
        == 400
    )
    assert (
        client.post(
            "/api/iso-evaluations",
            json={
                "functionality_score": True,
                "usability_score": 5,
                "reliability_score": 3,
                "efficiency_score": 4,
                "ux_score": 4.5,
            },
            headers={"Authorization": "Bearer token_user_a"},
        ).status_code
        == 400
    )

    # Valid submissions accepted with 201
    res_p1 = client.post(
        "/api/iso-evaluations",
        json={
            "functionality_score": 4,
            "usability_score": 5,
            "reliability_score": 3,
            "efficiency_score": 4,
            "ux_score": 5,
        },
        headers={"Authorization": "Bearer token_user_a"},
    )
    assert res_p1.status_code == 201

    res_p2 = client.post(
        "/api/iso-evaluations",
        json={
            "functionality_score": 5,
            "usability_score": 4,
            "reliability_score": 5,
            "efficiency_score": 5,
            "ux_score": 4,
        },
        headers={"Authorization": "Bearer token_user_a"},
    )
    assert res_p2.status_code == 201

    res_get = client.get(
        "/api/iso-evaluations?limit=10&offset=0",
        headers={"Authorization": "Bearer token_user_a"},
    )
    assert res_get.status_code == 200
    evaluations = res_get.get_json()["evaluations"]
    assert len(evaluations) == 2

    res_sum = client.get(
        "/api/iso-evaluations/summary",
        headers={"Authorization": "Bearer token_user_a"},
    )
    assert res_sum.status_code == 200
    summary = res_sum.get_json()["summary"]
    assert summary == {
        "avg_functionality": 4.5,
        "avg_usability": 4.5,
        "avg_reliability": 4.0,
        "avg_efficiency": 4.5,
        "avg_ux": 4.5,
        "count": 2,
    }

from decimal import Decimal
from unittest.mock import patch

import app as app_module
import database
from database import PooledConnectionWrapper


def test_create_app_exposes_root_and_metrics_with_decimal_safety(client):
    res_root = client.get("/")
    assert res_root.status_code == 200
    root_data = res_root.get_json()
    assert root_data["status"] == "online"
    assert "/api/start-session" in root_data["endpoints"]

    closed_flag = {"closed": False}

    class FakeMetricsCursor:
        def __init__(self):
            self.step = 0

        def execute(self, sql, params=()):
            self.sql = sql
            self.step += 1

        def fetchone(self):
            if "FROM game_sessions" in self.sql:
                return {"cnt": 12}
            if "FROM users" in self.sql:
                return {"cnt": 4}
            if "FROM user_streaks" in self.sql:
                return {"cnt": 3}
            if "AVG(accuracy_rate) as avg_val" in self.sql:
                return {"avg_val": Decimal("0.855")}
            return {}

        def fetchall(self):
            if "GROUP BY cognitive_domain" in self.sql:
                return [
                    {"cognitive_domain": "reflexes_and_focus", "avg_acc": Decimal("0.9"), "cnt": 8}
                ]
            if "GROUP BY archetype_name" in self.sql:
                return [{"archetype_name": "Fast Learner", "cnt": 2}]
            return []

    class FakeMetricsConn:
        def cursor(self):
            return FakeMetricsCursor()

        def close(self):
            closed_flag["closed"] = True

    with patch("app.get_db_connection", return_value=FakeMetricsConn()):
        res_metrics = client.get("/metrics")
        assert res_metrics.status_code == 200
        data = res_metrics.get_json()
        assert data["status"] == "success"
        assert data["total_sessions"] == 12
        assert data["total_registered_users"] == 4
        assert data["active_users"] == 3
        assert data["average_score"] == 85.5
        assert data["domain_breakdown"]["reflexes_and_focus"] == {
            "average_accuracy": 90.0,
            "total_records": 8,
        }
        assert data["archetype_distribution"] == {"Fast Learner": 2}
        assert closed_flag["closed"] is True


def test_metrics_closes_connection_on_error(client):
    closed_flag = {"closed": False}

    class BrokenMetricsConn:
        def cursor(self):
            raise RuntimeError("db boom")

        def close(self):
            closed_flag["closed"] = True

    with patch("app.get_db_connection", return_value=BrokenMetricsConn()):
        res = client.get("/metrics")
        assert res.status_code == 500
        assert res.get_json()["status"] == "error"
        assert closed_flag["closed"] is True


def test_pooled_connection_wrapper_exit_closes_idempotently_and_honors_env_bounds():
    class FakeRawConn:
        def __init__(self):
            self.autocommit = False
            self.committed = 0
            self.rolled_back = 0

        def commit(self):
            self.committed += 1

        def rollback(self):
            self.rolled_back += 1

    class FakePool:
        def __init__(self):
            self.returned = []

        def putconn(self, conn):
            self.returned.append(conn)

    # Normal context exit commits and returns conn exactly once even with extra close()
    pool1 = FakePool()
    raw1 = FakeRawConn()
    wrapper1 = PooledConnectionWrapper(pool1, raw1)
    with wrapper1:
        pass
    wrapper1.close()
    assert raw1.committed == 1
    assert raw1.autocommit is True
    assert pool1.returned == [raw1]

    # Exception context exit rolls back and returns conn exactly once
    pool2 = FakePool()
    raw2 = FakeRawConn()
    wrapper2 = PooledConnectionWrapper(pool2, raw2)
    try:
        with wrapper2:
            raise ValueError("fail tx")
    except ValueError:
        pass
    wrapper2.close()
    assert raw2.rolled_back == 1
    assert raw2.autocommit is True
    assert pool2.returned == [raw2]

    # Pool bounds accept docker-compose DB_MIN_CONN / DB_MAX_CONN fallback names
    captured = {}

    def fake_pool_ctor(minconn, maxconn, dsn=None, cursor_factory=None):
        captured["min"] = minconn
        captured["max"] = maxconn
        return object()

    orig_pool = database.db_pool
    try:
        database.db_pool = None
        env_patch = {
            "DATABASE_URL": "postgresql://postgres:password@localhost:5432/cognicore",
            "DB_POOL_MIN": "",
            "DB_POOL_MAX": "",
            "DB_MIN_CONN": "2",
            "DB_MAX_CONN": "10",
        }
        with patch.dict("os.environ", env_patch, clear=False), patch(
            "database.ThreadedConnectionPool", side_effect=fake_pool_ctor
        ):
            database.init_pool()
        assert captured == {"min": 2, "max": 10}
    finally:
        database.db_pool = orig_pool


def test_user_analytics_uses_single_db_connection_instead_of_thread_burst(client):
    stats = {"opens": 0, "closes": 0}

    class SingleConnCursor:
        def __init__(self):
            self.last_sql = ""

        def execute(self, sql, params=()):
            self.last_sql = sql

        def fetchone(self):
            if "FROM users" in self.last_sql:
                return {"id": 1}
            if "FROM archetype_history" in self.last_sql:
                return None
            if "total_games" in self.last_sql:
                return {"total_games": 2, "highest_level": 3, "overall_accuracy": 0.9}
            if "FROM user_profiles" in self.last_sql:
                return {"xp": 150, "level": 1, "coins": 50}
            if "FROM user_streaks" in self.last_sql:
                return {"current_streak": 2, "longest_streak": 4}
            return None

        def fetchall(self):
            return []

    class SingleConn:
        def cursor(self):
            return SingleConnCursor()

        def close(self):
            stats["closes"] += 1

    def counting_get_db_connection():
        stats["opens"] += 1
        return SingleConn()

    with patch("routes.analytics.get_db_connection", side_effect=counting_get_db_connection):
        res = client.get(
            "/api/user-analytics/testuser",
            headers={"Authorization": "Bearer dummy_token"},
        )
        assert res.status_code == 200
        assert res.get_json()["status"] == "success"

    assert stats["opens"] == 1
    assert stats["closes"] == 1


def test_init_db_uses_postgres_advisory_lock_and_closes_on_error():
    events = {"sql": [], "committed": False, "closed": False}

    class FakeInitCursor:
        def execute(self, sql, params=()):
            events["sql"].append(" ".join(sql.split()))

        def fetchall(self):
            return []

    class FakeInitConn:
        autocommit = True

        def cursor(self):
            return FakeInitCursor()

        def commit(self):
            events["committed"] = True

        def rollback(self):
            return None

        def close(self):
            events["closed"] = True

    fake_conn = FakeInitConn()
    with patch("app.get_db_connection", return_value=fake_conn):
        app_module.init_db()

    assert events["committed"] is True
    assert events["closed"] is True
    assert fake_conn.autocommit is True
    assert events["sql"][0].startswith("SELECT pg_advisory_xact_lock(")
    assert any("ADD COLUMN IF NOT EXISTS pin_hash" in q for q in events["sql"])

    # Even if DDL raises, transaction rolls back, autocommit restores, and close MUST execute
    err_events = {"rolled_back": False, "closed": False}

    class FailingInitCursor:
        def execute(self, sql, params=()):
            if "pg_advisory_xact_lock" in sql:
                return None
            raise RuntimeError("ddl error")

    class FailingInitConn:
        autocommit = True

        def cursor(self):
            return FailingInitCursor()

        def commit(self):
            return None

        def rollback(self):
            err_events["rolled_back"] = True

        def close(self):
            err_events["closed"] = True

    failing_conn = FailingInitConn()
    with patch("app.get_db_connection", return_value=failing_conn):
        try:
            app_module.init_db()
            raise AssertionError("Expected RuntimeError from init_db")
        except RuntimeError:
            pass

    assert err_events["rolled_back"] is True
    assert failing_conn.autocommit is True
    assert err_events["closed"] is True

    with patch.dict("os.environ", {"FLASK_ENV": "development", "SKIP_DB_INIT": "true"}, clear=False):
        assert app_module._should_auto_init_db() is False
    with patch.dict("os.environ", {"FLASK_ENV": "development", "SKIP_DB_INIT": "false"}, clear=False):
        assert app_module._should_auto_init_db() is True


def test_rate_limiter_enforced_with_health_exempt(client):
    from extensions import limiter

    isolated_app = app_module.create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "RATELIMIT_STORAGE_URI": "memory://",
            "RATELIMIT_DEFAULT": "2 per minute",
        }
    )
    try:
        isolated_client = isolated_app.test_client()

        # /api/health is exempt and should never return 429
        for _ in range(5):
            assert isolated_client.get("/api/health").status_code == 200

        # Default-limited route returns structured JSON 429 once limit exceeded
        assert isolated_client.get("/").status_code == 200
        assert isolated_client.get("/").status_code == 200
        res_429 = isolated_client.get("/")
        assert res_429.status_code == 429
        assert res_429.get_json()["status"] == "error"

        # Dedicated PIN verification limit (10 per minute) triggers 429 before 300/min global cap
        pin_app = app_module.create_app(
            {
                "TESTING": True,
                "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
                "RATELIMIT_STORAGE_URI": "memory://",
                "RATELIMIT_DEFAULT": "300 per minute",
            }
        )
        pin_client = pin_app.test_client()
        statuses = [
            pin_client.post("/api/auth/verify-pin", json={"pin": "0000"}).status_code
            for _ in range(11)
        ]
        # First 10 reach token_required (401 without token), 11th is throttled at 429
        assert statuses[:10] == [401] * 10
        assert statuses[10] == 429
    finally:
        # Restore shared test app binding on global limiter
        limiter.enabled = bool(client.application.config.get("RATELIMIT_ENABLED", True))
        limiter.limit_manager.set_default_limits([])
        limiter.init_app(client.application)

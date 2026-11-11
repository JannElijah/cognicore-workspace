import os
import threading
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool

db_pool = None
_pool_lock = threading.Lock()


def _get_pool_bound(primary_env, fallback_env, default):
    raw = os.environ.get(primary_env) or os.environ.get(fallback_env)
    if raw is None or not str(raw).strip():
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def init_pool():
    global db_pool
    if db_pool is not None:
        return
    with _pool_lock:
        if db_pool is not None:
            return
        db_url = os.environ.get("DATABASE_URL")
        if not db_url:
            raise ValueError("No DATABASE_URL found in .env")
        min_conn = max(1, _get_pool_bound("DB_POOL_MIN", "DB_MIN_CONN", 1))
        max_conn = max(min_conn, _get_pool_bound("DB_POOL_MAX", "DB_MAX_CONN", 20))
        db_pool = ThreadedConnectionPool(min_conn, max_conn, dsn=db_url, cursor_factory=RealDictCursor)


class PooledConnectionWrapper:
    def __init__(self, pool, conn):
        self._pool = pool
        self._conn = conn
        self._closed = False

    def cursor(self, *args, **kwargs):
        return self._conn.cursor(*args, **kwargs)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        if self._closed or self._conn is None:
            return
        self._closed = True
        conn = self._conn
        self._conn = None
        try:
            if not conn.autocommit:
                try:
                    conn.rollback()
                except Exception:
                    pass
                try:
                    conn.autocommit = True
                except Exception:
                    pass
            self._pool.putconn(conn)
        except Exception:
            pass

    @property
    def autocommit(self):
        return self._conn.autocommit

    @autocommit.setter
    def autocommit(self, val):
        self._conn.autocommit = val

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            if exc_type is not None:
                self.rollback()
            else:
                self.commit()
            if self._conn is not None and not self._conn.autocommit:
                self._conn.autocommit = True
        finally:
            self.close()

def get_db_connection():
    if not db_pool:
        init_pool()
    conn = db_pool.getconn()
    conn.autocommit = True
    return PooledConnectionWrapper(db_pool, conn)

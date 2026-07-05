import os
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool

db_pool = None

def init_pool():
    global db_pool
    if db_pool is None:
        db_url = os.environ.get("DATABASE_URL")
        if not db_url:
            raise ValueError("No DATABASE_URL found in .env")
        min_conn = int(os.environ.get("DB_POOL_MIN", 1))
        max_conn = int(os.environ.get("DB_POOL_MAX", 20))
        db_pool = ThreadedConnectionPool(min_conn, max_conn, dsn=db_url, cursor_factory=RealDictCursor)

class PooledConnectionWrapper:
    def __init__(self, pool, conn):
        self._pool = pool
        self._conn = conn
        
    def cursor(self, *args, **kwargs):
        return self._conn.cursor(*args, **kwargs)
        
    def commit(self):
        self._conn.commit()
        
    def rollback(self):
        self._conn.rollback()
        
    def close(self):
        try:
            self._pool.putconn(self._conn)
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
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()

def get_db_connection():
    if not db_pool:
        init_pool()
    conn = db_pool.getconn()
    conn.autocommit = True
    return PooledConnectionWrapper(db_pool, conn)

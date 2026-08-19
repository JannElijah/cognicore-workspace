import sys
import os
os.environ["FLASK_ENV"] = "testing"  # Prevent init_db() in app.py from running
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from app import create_app
from database import db as _db
from unittest.mock import patch, MagicMock

@pytest.fixture(scope="session")
def app():
    """Create and configure a new app instance for each test session."""
    test_db_path = os.path.join(os.path.dirname(__file__), 'test_cognicore.db')
    if os.path.exists(test_db_path):
        os.remove(test_db_path)
        
    flask_app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{test_db_path}"
    })
    
    with flask_app.app_context():
        _db.create_all()
        # Seed test database with required legacy data
        import seed_clinical_data
        import seed_research_cohort
        seed_clinical_data.DB_PATH = test_db_path
        seed_research_cohort.DB_PATH = test_db_path
        seed_clinical_data.seed_clinical_data()
        seed_research_cohort.seed_research_cohort()
        yield flask_app
        
    # Teardown
    if os.path.exists(test_db_path):
        try:
            os.remove(test_db_path)
        except:
            pass

@pytest.fixture(scope="function")
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture(scope="function")
def db(app):
    """Provide a fresh database session for each test."""
    with app.app_context():
        yield _db

@pytest.fixture(autouse=True)
def mock_supabase_auth():
    """Mock Supabase Auth to bypass token validation in tests."""
    with patch('auth.supabase') as mock_supabase:
        mock_user = MagicMock()
        mock_user.id = "123e4567-e89b-12d3-a456-426614174000"
        mock_user.email = "test@example.com"
        mock_user.user_metadata = {"username": "testuser"}
        
        mock_response = MagicMock()
        mock_response.user = mock_user
        
        mock_supabase.auth.get_user.return_value = mock_response
        yield mock_supabase

class MockRequestsResponse:
    def __init__(self, flask_response):
        self.status_code = flask_response.status_code
        self.text = flask_response.get_data(as_text=True)
        self._json = flask_response.get_json()
    def json(self):
        return self._json

@pytest.fixture(autouse=True)
def patch_requests(client):
    def mock_post(url, *args, **kwargs):
        if '/api/login' in url:
            class DummyLogin:
                status_code = 200
                text = "ok"
                def json(self): return {"token": "dummy_token"}
            return DummyLogin()
            
        headers = kwargs.get('headers', {})
        headers['Authorization'] = 'Bearer dummy_token'
        
        endpoint = url.replace("http://127.0.0.1:5000", "")
        res = client.post(endpoint, json=kwargs.get('json'), headers=headers)
        return MockRequestsResponse(res)

    def mock_get(url, *args, **kwargs):
        headers = kwargs.get('headers', {})
        headers['Authorization'] = 'Bearer dummy_token'
        endpoint = url.replace("http://127.0.0.1:5000", "")
        res = client.get(endpoint, headers=headers)
        return MockRequestsResponse(res)
        
    def mock_delete(url, *args, **kwargs):
        headers = kwargs.get('headers', {})
        headers['Authorization'] = 'Bearer dummy_token'
        endpoint = url.replace("http://127.0.0.1:5000", "")
        res = client.delete(endpoint, headers=headers)
        return MockRequestsResponse(res)

    def mock_get_db_connection():
        import sqlite3
        import os
        import re
        test_db_path = os.path.join(os.path.dirname(__file__), 'test_cognicore.db')
        conn = sqlite3.connect(test_db_path)
        # Emulate RealDictCursor by returning dicts instead of tuples
        conn.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        
        class SQLiteWrapperCursor:
            def __init__(self, cursor):
                self.cursor = cursor
                self.description = cursor.description
            def execute(self, query, params=()):
                query = re.sub(r'%s', '?', query)
                self.cursor.execute(query, params)
                self.description = self.cursor.description
                self.rowcount = self.cursor.rowcount
                return self
            def fetchone(self): return self.cursor.fetchone()
            def fetchall(self): return self.cursor.fetchall()
            def close(self): self.cursor.close()

        class SQLiteWrapperConnection:
            def __init__(self, conn):
                self.conn = conn
            def cursor(self):
                return SQLiteWrapperCursor(self.conn.cursor())
            def commit(self): self.conn.commit()
            def close(self): self.conn.close()
            def __enter__(self): return self
            def __exit__(self, exc_type, exc_val, exc_tb):
                if exc_type:
                    self.conn.rollback()
                else:
                    self.conn.commit()
                return False

        return SQLiteWrapperConnection(conn)

    with patch('requests.post', side_effect=mock_post), \
         patch('requests.get', side_effect=mock_get), \
         patch('requests.delete', side_effect=mock_delete), \
         patch('routes.analytics.get_db_connection', side_effect=mock_get_db_connection), \
         patch('routes.research.get_db_connection', side_effect=mock_get_db_connection), \
         patch('routes.ml.get_db_connection', side_effect=mock_get_db_connection):
        yield

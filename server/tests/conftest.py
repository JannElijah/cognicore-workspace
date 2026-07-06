import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from app import app as flask_app
from database import db as _db
from unittest.mock import patch, MagicMock

@pytest.fixture(scope="session")
def app():
    """Create and configure a new app instance for each test session."""
    flask_app.config.update({
        "TESTING": True,
    })
    
    with flask_app.app_context():
        yield flask_app

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

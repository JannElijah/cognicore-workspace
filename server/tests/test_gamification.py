import pytest
from app import app
from database import get_db_connection

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_leaderboard_status(client):
    # Test that the leaderboard endpoint returns a 200 OK and valid JSON
    response = client.get('/api/leaderboard')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'
    assert 'leaderboard' in data

def test_achievements_unauthorized(client):
    # Test that gamification endpoints require a token
    response = client.get('/api/achievements')
    assert response.status_code == 401
    data = response.get_json()
    assert data['message'] == 'Token is missing!'

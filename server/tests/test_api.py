import pytest

def test_health(client):
    """Test the health check endpoint."""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'ok'

def test_start_session_with_mock_token(client):
    """Test that starting a session with a valid (mocked) token works."""
    response = client.post('/api/start-session', json={
        "username": "testuser",
        "game_type": "SpeedTap"
    }, headers={"Authorization": "Bearer dummy_token"})
    
    assert response.status_code == 201
    data = response.get_json()
    assert data['status'] == 'success'
    assert 'session_id' in data
    assert 'dda_parameters' in data

def test_auth_set_pin(client):
    """Test setting a PIN for the user."""
    res_set = client.post('/api/auth/set-pin', json={
        "pin": "1234"
    }, headers={"Authorization": "Bearer dummy_token"})
    assert res_set.status_code == 200
    data = res_set.get_json()
    assert data['status'] == 'success'

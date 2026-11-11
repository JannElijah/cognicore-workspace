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


def test_sync_user_returns_server_derived_admin_role(client, db, mock_supabase_auth):
    """Verify /api/sync-user exposes role and is_admin derived from DB state."""
    from types import SimpleNamespace
    from models import User

    admin_user = User.query.filter_by(username="promoted_admin_sync").first()
    if not admin_user:
        admin_user = User(
            username="promoted_admin_sync",
            supabase_uid="44444444-4444-4444-4444-444444444444",
            role="admin",
        )
        db.session.add(admin_user)
    else:
        admin_user.supabase_uid = "44444444-4444-4444-4444-444444444444"
        admin_user.role = "admin"

    part_user = User.query.filter_by(username="regular_part_sync").first()
    if not part_user:
        part_user = User(
            username="regular_part_sync",
            supabase_uid="55555555-5555-5555-5555-555555555555",
            role="student",
        )
        db.session.add(part_user)
    else:
        part_user.supabase_uid = "55555555-5555-5555-5555-555555555555"
        part_user.role = "student"
    db.session.commit()

    orig_return = mock_supabase_auth.auth.get_user.return_value
    orig_side_effect = mock_supabase_auth.auth.get_user.side_effect
    try:
        identities = {
            "token_admin_sync": SimpleNamespace(
                id="44444444-4444-4444-4444-444444444444",
                email="promoted_admin@example.com",
                user_metadata={"username": "promoted_admin_sync"},
            ),
            "token_part_sync": SimpleNamespace(
                id="55555555-5555-5555-5555-555555555555",
                email="regular_part@example.com",
                user_metadata={"username": "regular_part_sync"},
            ),
        }
        mock_supabase_auth.auth.get_user.side_effect = lambda token: SimpleNamespace(
            user=identities[token]
        )

        res_part = client.post(
            "/api/sync-user",
            json={},
            headers={"Authorization": "Bearer token_part_sync"},
        )
        assert res_part.status_code == 200
        part_payload = res_part.get_json()["user"]
        assert part_payload["username"] == "regular_part_sync"
        assert part_payload["role"] == "participant"
        assert part_payload["is_admin"] is False

        res_admin = client.post(
            "/api/sync-user",
            json={},
            headers={"Authorization": "Bearer token_admin_sync"},
        )
        assert res_admin.status_code == 200
        admin_payload = res_admin.get_json()["user"]
        assert admin_payload["username"] == "promoted_admin_sync"
        assert admin_payload["role"] == "admin"
        assert admin_payload["is_admin"] is True
    finally:
        mock_supabase_auth.auth.get_user.side_effect = orig_side_effect
        mock_supabase_auth.auth.get_user.return_value = orig_return

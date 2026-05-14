from app import db, User, Follow, Message


def create_user(email, username, password="password123", phone="0412345678"):
    user = User(
        email=email,
        phone=phone,
        username=username
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    user_id = user.id
    return user_id


def login_as(client, user_id):
    with client.session_transaction() as session:
        session["user_id"] = user_id


def test_register_rejects_invalid_phone(client):
    response = client.post(
        "/register",
        data={
            "email": "test@example.com",
            "phone": "12345",
            "password": "password123",
            "confirm_password": "password123",
        },
        follow_redirects=True
    )

    assert response.status_code == 200
    assert b"Please enter a valid phone number." in response.data


def test_register_creates_user_with_valid_data(client, app):
    response = client.post(
        "/register",
        data={
            "email": "newuser@example.com",
            "phone": "0412345678",
            "password": "password123",
            "confirm_password": "password123",
        },
        follow_redirects=False
    )

    assert response.status_code == 302
    assert "/username" in response.headers["Location"]

    with app.app_context():
        user = User.query.filter_by(email="newuser@example.com").first()
        assert user is not None
        assert user.check_password("password123")


def test_login_rejects_invalid_password(client, app):
    with app.app_context():
        create_user("alice@example.com", "alice", password="correctpass")

    response = client.post(
        "/login",
        data={
            "identifier": "alice@example.com",
            "password": "wrongpass",
        },
        follow_redirects=True
    )

    assert response.status_code == 200
    assert b"Invalid credentials." in response.data


def test_search_finds_other_user_by_username(client, app):
    with app.app_context():
        alice_id = create_user("alice@example.com", "alice")
        create_user("bob@example.com", "bob")

    login_as(client, alice_id)

    response = client.get("/search?q=bob")

    assert response.status_code == 200
    assert b"@bob" in response.data


def test_follow_and_unfollow_user(client, app):
    with app.app_context():
        alice_id = create_user("alice@example.com", "alice")
        bob_id = create_user("bob@example.com", "bob")

    login_as(client, alice_id)

    follow_response = client.post(f"/api/follow/{bob_id}")
    follow_data = follow_response.get_json()

    assert follow_response.status_code == 200
    assert follow_data["following"] is True
    assert follow_data["follower_count"] == 1

    with app.app_context():
        follow_record = Follow.query.filter_by(
            follower_id=alice_id,
            following_id=bob_id
        ).first()
        assert follow_record is not None

    unfollow_response = client.post(f"/api/follow/{bob_id}")
    unfollow_data = unfollow_response.get_json()

    assert unfollow_response.status_code == 200
    assert unfollow_data["following"] is False
    assert unfollow_data["follower_count"] == 0


def test_send_and_get_message(client, app):
    with app.app_context():
        alice_id = create_user("alice@example.com", "alice")
        bob_id = create_user("bob@example.com", "bob")

    login_as(client, alice_id)

    send_response = client.post(
        "/api/messages",
        json={
            "receiver_id": bob_id,
            "text": "Hello Bob"
        }
    )

    assert send_response.status_code == 200
    assert send_response.get_json()["success"] is True

    get_response = client.get(f"/api/messages/{bob_id}")
    messages = get_response.get_json()

    assert get_response.status_code == 200
    assert len(messages) == 1
    assert messages[0]["text"] == "Hello Bob"
    assert messages[0]["is_mine"] is True

    with app.app_context():
        saved_message = Message.query.filter_by(text="Hello Bob").first()
        assert saved_message is not None
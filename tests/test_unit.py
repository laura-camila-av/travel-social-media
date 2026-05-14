from datetime import date

from app import (
    db,
    User,
    Follow,
    Message,
    Itinerary,
    ItineraryDay,
    Like,
    SavedItinerary,
)


def create_user(email, username=None, password="password123", phone="0412345678"):
    user = User(
        email=email,
        phone=phone,
        username=username
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return user.id


def create_itinerary(user_id):
    itinerary = Itinerary(
        title="Tokyo Test Trip",
        user_id=user_id,
        destination="Tokyo",
        travel_style="Solo",
        budget=1000.00,
        start_date=date(2026, 1, 1),
        end_date=date(2026, 1, 2)
    )

    db.session.add(itinerary)
    db.session.commit()

    return itinerary.id


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


def test_choose_username_rejects_short_username(client, app):
    with app.app_context():
        user_id = create_user("newuser@example.com", None)

    login_as(client, user_id)

    response = client.post(
        "/username",
        data={
            "username": "ab"
        },
        follow_redirects=True
    )

    assert response.status_code == 200
    assert b"Username must be at least 3 characters." in response.data


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


def test_create_itinerary_with_valid_data(client, app):
    with app.app_context():
        user_id = create_user("alice@example.com", "alice")

    login_as(client, user_id)

    response = client.post(
        "/create",
        data={
            "trip-title": "Melbourne Trip",
            "destination": "Melbourne",
            "travel-style": "Solo",
            "trip-budget": "500",
            "start-date": "2026-01-01",
            "end-date": "2026-01-02",
            "cost-day1": "100",
            "rented-items-day1": "Bike",
            "transport-day1": "Train",
            "accommodation-day1": "Hotel A",
            "caption-day1": "Day 1 caption",
            "activity-json-day1": "[]",
            "dining-json-day1": "[]",
            "cost-day2": "150",
            "rented-items-day2": "",
            "transport-day2": "Bus",
            "accommodation-day2": "Hotel B",
            "caption-day2": "Day 2 caption",
            "activity-json-day2": "[]",
            "dining-json-day2": "[]",
        },
        follow_redirects=False
    )

    assert response.status_code == 302

    with app.app_context():
        itinerary = Itinerary.query.filter_by(title="Melbourne Trip").first()
        assert itinerary is not None
        assert itinerary.destination == "Melbourne"

        days = ItineraryDay.query.filter_by(itinerary_id=itinerary.id).all()
        assert len(days) == 2


def test_create_itinerary_rejects_invalid_date(client, app):
    with app.app_context():
        user_id = create_user("alice@example.com", "alice")

    login_as(client, user_id)

    response = client.post(
        "/create",
        data={
            "trip-title": "Invalid Date Trip",
            "destination": "Sydney",
            "travel-style": "Solo",
            "trip-budget": "500",
            "start-date": "2026-01-05",
            "end-date": "2026-01-01",
        },
        follow_redirects=False
    )

    assert response.status_code == 302

    with app.app_context():
        itinerary = Itinerary.query.filter_by(title="Invalid Date Trip").first()
        assert itinerary is None


def test_toggle_like_and_save_itinerary(client, app):
    with app.app_context():
        user_id = create_user("alice@example.com", "alice")
        itinerary_id = create_itinerary(user_id)

    login_as(client, user_id)

    like_response = client.post(f"/api/like/{itinerary_id}")
    like_data = like_response.get_json()

    assert like_response.status_code == 200
    assert like_data["liked"] is True
    assert like_data["like_count"] == 1

    save_response = client.post(f"/api/save/{itinerary_id}")
    save_data = save_response.get_json()

    assert save_response.status_code == 200
    assert save_data["saved"] is True

    with app.app_context():
        like_record = Like.query.filter_by(
            user_id=user_id,
            itinerary_id=itinerary_id
        ).first()

        save_record = SavedItinerary.query.filter_by(
            user_id=user_id,
            itinerary_id=itinerary_id
        ).first()

        assert like_record is not None
        assert save_record is not None


def test_notifications_page_shows_follower(client, app):
    with app.app_context():
        alice_id = create_user("alice@example.com", "alice")
        bob_id = create_user("bob@example.com", "bob")

        follow = Follow(
            follower_id=bob_id,
            following_id=alice_id
        )
        db.session.add(follow)
        db.session.commit()

    login_as(client, alice_id)

    response = client.get("/notifications")

    assert response.status_code == 200
    assert b"bob" in response.data
    assert b"followed you" in response.data


def test_remove_follower_api_removes_follow_record(client, app):
    with app.app_context():
        alice_id = create_user("alice@example.com", "alice")
        bob_id = create_user("bob@example.com", "bob")

        follow = Follow(
            follower_id=bob_id,
            following_id=alice_id
        )
        db.session.add(follow)
        db.session.commit()

    login_as(client, alice_id)

    response = client.post(f"/api/remove-follower/{bob_id}")

    assert response.status_code == 200
    assert response.get_json()["success"] is True

    with app.app_context():
        follow_record = Follow.query.filter_by(
            follower_id=bob_id,
            following_id=alice_id
        ).first()

        assert follow_record is None
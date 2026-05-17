from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from app import db, User, Follow


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


def create_follow(follower_id, following_id):
    follow = Follow(
        follower_id=follower_id,
        following_id=following_id
    )

    db.session.add(follow)
    db.session.commit()


def login(browser, base_url, identifier, password):
    browser.get(f"{base_url}/login")

    browser.find_element(By.ID, "loginIdentifier").send_keys(identifier)
    browser.find_element(By.ID, "loginPassword").send_keys(password)
    browser.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']").click()

    WebDriverWait(browser, 5).until(
        lambda driver: "/feed" in driver.current_url
    )


def test_homepage_loads(browser, live_server):
    browser.get(f"{live_server}/")

    assert browser.title is not None


def test_login_page_shows_login_form(browser, live_server):
    browser.get(f"{live_server}/login")

    assert browser.find_element(By.ID, "loginForm").is_displayed()
    assert browser.find_element(By.ID, "loginIdentifier").is_displayed()
    assert browser.find_element(By.ID, "loginPassword").is_displayed()


def test_register_rejects_invalid_phone_in_browser(browser, live_server):
    browser.get(f"{live_server}/login")

    browser.find_element(
        By.CSS_SELECTOR,
        ".login-page-tabs .login-page-tab-btn:nth-child(2)"
    ).click()

    browser.find_element(By.ID, "registerEmail").send_keys("invalidphone@example.com")
    browser.find_element(By.ID, "registerPhone").send_keys("12345")
    browser.find_element(By.ID, "registerPassword").send_keys("password123")
    browser.find_element(By.ID, "confirmPassword").send_keys("password123")
    browser.find_element(By.CSS_SELECTOR, "#registerForm button[type='submit']").click()

    WebDriverWait(browser, 5).until(
        EC.text_to_be_present_in_element(
            (By.TAG_NAME, "body"),
            "Please enter a valid phone number."
        )
    )


def test_login_success_redirects_to_feed(browser, live_server, app):
    with app.app_context():
        create_user("alice@example.com", "alice")

    login(browser, live_server, "alice@example.com", "password123")

    assert "/feed" in browser.current_url


def test_search_username_after_login(browser, live_server, app):
    with app.app_context():
        create_user("alice@example.com", "alice")
        create_user("bob@example.com", "bob")

    login(browser, live_server, "alice@example.com", "password123")

    browser.get(f"{live_server}/search")

    search_input = browser.find_element(By.CLASS_NAME, "search-input")
    search_input.send_keys("bob")
    search_input.submit()

    WebDriverWait(browser, 5).until(
        EC.text_to_be_present_in_element(
            (By.TAG_NAME, "body"),
            "@bob"
        )
    )


def test_profile_page_shows_username_after_login(browser, live_server, app):
    with app.app_context():
        create_user("alice@example.com", "alice")

    login(browser, live_server, "alice@example.com", "password123")

    browser.get(f"{live_server}/profile")

    WebDriverWait(browser, 5).until(
        EC.text_to_be_present_in_element(
            (By.TAG_NAME, "body"),
            "alice"
        )
    )


def test_follow_button_changes_to_unfollow(browser, live_server, app):
    with app.app_context():
        create_user("alice@example.com", "alice")
        bob_id = create_user("bob@example.com", "bob")

    login(browser, live_server, "alice@example.com", "password123")

    browser.get(f"{live_server}/user/{bob_id}")

    follow_button = WebDriverWait(browser, 5).until(
        EC.element_to_be_clickable((By.ID, "follow-button"))
    )

    follow_button.click()

    WebDriverWait(browser, 5).until(
        EC.text_to_be_present_in_element(
            (By.ID, "follow-button"),
            "Unfollow"
        )
    )


def test_create_itinerary_page_generates_day_sections(browser, live_server, app):
    with app.app_context():
        create_user("alice@example.com", "alice")

    login(browser, live_server, "alice@example.com", "password123")

    browser.get(f"{live_server}/create")

    browser.find_element(By.ID, "trip-title").send_keys("Test Trip")
    browser.find_element(By.ID, "destination").send_keys("Melbourne")

    Select(browser.find_element(By.ID, "travel-style")).select_by_visible_text("Solo")

    browser.execute_script("document.getElementById('start-date').value = '2026-01-01';")
    browser.execute_script("document.getElementById('end-date').value = '2026-01-02';")

    generate_button = browser.find_element(By.CSS_SELECTOR, ".btn-generate")
    browser.execute_script(
        "arguments[0].scrollIntoView({block: 'center'});",
        generate_button
    )
    generate_button.click()

    WebDriverWait(browser, 5).until(
        EC.presence_of_element_located((By.ID, "day-nav-bar"))
    )

    day_buttons = browser.find_elements(By.CLASS_NAME, "day-nav-btn")
    assert len(day_buttons) == 2


def test_followers_page_shows_follower(browser, live_server, app):
    with app.app_context():
        alice_id = create_user("alice@example.com", "alice")
        bob_id = create_user("bob@example.com", "bob")
        create_follow(bob_id, alice_id)

    login(browser, live_server, "alice@example.com", "password123")

    browser.get(f"{live_server}/followers/{alice_id}")

    WebDriverWait(browser, 5).until(
        EC.text_to_be_present_in_element(
            (By.TAG_NAME, "body"),
            "@bob"
        )
    )


def test_notifications_page_shows_follower(browser, live_server, app):
    with app.app_context():
        alice_id = create_user("alice@example.com", "alice")
        bob_id = create_user("bob@example.com", "bob")
        create_follow(bob_id, alice_id)

    login(browser, live_server, "alice@example.com", "password123")

    browser.get(f"{live_server}/notifications")

    WebDriverWait(browser, 5).until(
        EC.text_to_be_present_in_element(
            (By.TAG_NAME, "body"),
            "bob"
        )
    )

    assert "followed you" in browser.find_element(By.TAG_NAME, "body").text

def test_register_tab_shows_register_form(browser, live_server):
    browser.get(f"{live_server}/login")

    browser.find_element(
        By.CSS_SELECTOR,
        ".login-page-tabs .login-page-tab-btn:nth-child(2)"
    ).click()

    assert browser.find_element(By.ID, "registerForm").is_displayed()
    assert browser.find_element(By.ID, "registerEmail").is_displayed()
    assert browser.find_element(By.ID, "registerPhone").is_displayed()
    assert browser.find_element(By.ID, "registerPassword").is_displayed()
    assert browser.find_element(By.ID, "confirmPassword").is_displayed()


def test_forgot_password_form_opens(browser, live_server):
    browser.get(f"{live_server}/login")

    browser.find_element(
        By.XPATH,
        "//button[contains(text(), 'Forgot Password')]"
    ).click()

    assert browser.find_element(By.ID, "forgotForm").is_displayed()
    assert browser.find_element(By.ID, "forgotEmail").is_displayed()
    assert browser.find_element(By.ID, "newPassword").is_displayed()
    assert browser.find_element(By.ID, "confirmNewPassword").is_displayed()


def test_homepage_signup_button_goes_to_register(browser, live_server):
    browser.get(f"{live_server}/")

    browser.find_element(By.LINK_TEXT, "Sign up").click()

    WebDriverWait(browser, 5).until(
        lambda driver: "/login?form=register" in driver.current_url
    )

    assert browser.find_element(By.ID, "registerForm").is_displayed()


def test_feed_page_shows_main_sections_after_login(browser, live_server, app):
    with app.app_context():
        create_user("feeduser@example.com", "feeduser")

    login(browser, live_server, "feeduser@example.com", "password123")

    browser.get(f"{live_server}/feed")

    WebDriverWait(browser, 5).until(
        EC.text_to_be_present_in_element((By.TAG_NAME, "body"), "Your Curated Feed")
    )

    assert "From People You Follow" in browser.find_element(By.TAG_NAME, "body").text
    assert "Based on Your Searches" in browser.find_element(By.TAG_NAME, "body").text
    assert "Explore More" in browser.find_element(By.TAG_NAME, "body").text


def test_notifications_page_loads_after_login(browser, live_server, app):
    with app.app_context():
        create_user("notifyuser@example.com", "notifyuser")

    login(browser, live_server, "notifyuser@example.com", "password123")

    browser.get(f"{live_server}/notifications")

    WebDriverWait(browser, 5).until(
        EC.text_to_be_present_in_element((By.TAG_NAME, "body"), "Notifications")
    )

    assert "See new follows, likes, and messages here." in browser.find_element(By.TAG_NAME, "body").text


def test_messages_page_loads_after_login(browser, live_server, app):
    with app.app_context():
        create_user("messageuser@example.com", "messageuser")

    login(browser, live_server, "messageuser@example.com", "password123")

    browser.get(f"{live_server}/messages")

    WebDriverWait(browser, 5).until(
        EC.presence_of_element_located((By.ID, "userList"))
    )

    assert browser.find_element(By.ID, "chatHeader").is_displayed()
    assert browser.find_element(By.ID, "messages").is_displayed()
    assert browser.find_element(By.ID, "messageInput").is_displayed()
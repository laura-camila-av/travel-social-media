from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from app import db, User


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
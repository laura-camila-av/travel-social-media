import threading

import pytest
from selenium import webdriver
from selenium.common.exceptions import WebDriverException
from werkzeug.serving import make_server

from app import app as flask_app, db


@pytest.fixture()
def app(tmp_path):
    """
    Create a Flask app using a separate temporary test database.
    This prevents tests from touching the real users.db database.
    """
    test_db_path = tmp_path / "test_users.db"

    flask_app.config.update(
        TESTING=True,
        WTF_CSRF_ENABLED=False,
        SECRET_KEY="test-secret-key",
        SQLALCHEMY_DATABASE_URI=f"sqlite:///{test_db_path}",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    with flask_app.app_context():
        db.session.remove()
        db.drop_all()
        db.create_all()

        yield flask_app

        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def live_server(app):
    """
    Start the Flask server automatically for Selenium tests.
    """
    server = make_server("127.0.0.1", 0, app)
    port = server.server_port

    thread = threading.Thread(target=server.serve_forever)
    thread.daemon = True
    thread.start()

    yield f"http://127.0.0.1:{port}"

    server.shutdown()
    thread.join(timeout=5)


@pytest.fixture()
def browser():
    """
    Start a headless Chrome browser for Selenium tests.
    """
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1280,900")

    try:
        driver = webdriver.Chrome(options=options)
    except WebDriverException as error:
        pytest.skip(f"Chrome WebDriver is not available: {error}")

    yield driver

    driver.quit()
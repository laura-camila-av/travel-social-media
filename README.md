# travel-social-media (Tripster)

Tripster is a Flask-based travel social media web application where users can document their trips as day-by-day itineraries and share them with the other users. Users can create itineraries with photos, activities, dining, transport, accommodation, costs, and rented items for each day, then post them to a feed where followers can like, save, and discuss them.

## Features

- User registration, login, and profile customisation
- Day-by-day itinerary creation, editing, and viewing with photo uploads
- Personalised feed showing itineraries from followed users and recommendations
- Following, direct messaging, likes, and saved itineraries
- Search by destination, travel style, or username with search history

## Design

The application is built with Flask and SQLAlchemy, using SQLite for storage and Flask-Migrate for schema management. The frontend uses vanilla JavaScript with Jinja templates and a maroon-themed CSS design. CSRF protection is handled via Flask-WTF.

## Group Members

| UWA ID   | Name                | GitHub Username   |
|----------|---------------------|-------------------|
| 23802255 | Laura Acosta Vargas | laura-camila-av   |
| 24912862 | Max Wong Ming Wei   | qwoefdvfjfnrer    |
| 24476651 | Prabhjot Kaur       | prabhjotkaurr39   |
| 24302384 | Boyu Shu            | BYu304            |

## Setup and Running

### 1. Clone the repository

```bash
git clone https://github.com/laura-camila-av/travel-social-media.git
cd travel-social-media
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Initialise the database

```bash
flask db upgrade
```

### 4. Run the application
```bash
python app.py
```

The app will be available at `http://127.0.0.1:5000`.

## Running Tests

This project uses pytest for backend tests and Selenium for browser workflow tests.
With the Flask app running in a separate terminal, run:

```bash
python -m pytest -q
```

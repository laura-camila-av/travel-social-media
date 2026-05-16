# travel-social-media

## Required Python Packages

Before running this website, users need to install the required Python packages.

You can install them with:

```bash
pip install -r requirements.txt
```
## Running Tests

This project uses pytest for backend tests and Selenium for browser workflow tests.

Install the required packages first:

```bash
pip install -r requirements.txt
```
## Database Setup

After pulling the latest code, run the database migrations:

```bash
flask db upgrade
```
## Local Database

The `instance/users.db` file is local only and should not be committed to GitHub.

If the database schema is outdated, run:

```bash
flask db upgrade
```
This updates the local database schema to match the latest models.
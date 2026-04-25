from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from sqlalchemy import or_, and_
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
app.config["SECRET_KEY"] = "change-this-to-a-random-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}


db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=True)
    bio = db.Column(db.Text, nullable=True)
    avatar_url = db.Column(db.String(255), nullable=True)
    interest_1 = db.Column(db.String(25), nullable=True)
    interest_2 = db.Column(db.String(25), nullable=True)
    interest_3 = db.Column(db.String(25), nullable=True)
    interest_4 = db.Column(db.String(25), nullable=True)
    interest_5 = db.Column(db.String(25), nullable=True)

    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

@app.route('/save-bio', methods=['POST'])
def save_bio():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401
    
    data = request.get_json()
    bio_text = data.get("bio", "").strip()
    
    user = User.query.get(user_id)
    user.bio = bio_text
    db.session.commit()
    
    return jsonify({"success": True})
@app.route('/save-interests', methods=['POST'])
def save_interests():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401
    
    data = request.get_json()
    interests = data.get("interests", [])
    
    user = User.query.get(user_id)
    user.interest_1 = interests[0] if len(interests) > 0 else None
    user.interest_2 = interests[1] if len(interests) > 1 else None
    user.interest_3 = interests[2] if len(interests) > 2 else None
    user.interest_4 = interests[3] if len(interests) > 3 else None
    user.interest_5 = interests[4] if len(interests) > 4 else None
    
    db.session.commit()
    
    return jsonify({"success": True})

@app.before_request
def create_tables():
    db.create_all()


@app.route('/')
def homepage():
    return render_template('homepage.html')


@app.route('/profile')
def user_profile():
    user_id = session.get("user_id")
    if not user_id:
        return redirect(url_for('login_page'))
    user = User.query.get(user_id)
    interests = [i for i in [user.interest_1, user.interest_2, user.interest_3, user.interest_4, user.interest_5] if i]
    return render_template('user-profile.html', user=user, interests=interests)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/upload-avatar', methods=['POST'])
def upload_avatar():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    if 'avatar' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['avatar']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if file and allowed_file(file.filename):
        filename = f"avatar_{user_id}.{file.filename.rsplit('.', 1)[1].lower()}"
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        
        user = User.query.get(user_id)
        user.avatar_url = filename
        db.session.commit()
        
        return jsonify({"success": True, "filename": filename})

    return jsonify({"error": "File type not allowed"}), 400

@app.route('/create')
def itinerary_create():
    return render_template('itinerary.html')

@app.route('/search')
def search():
    return render_template('search_page.html')


@app.route('/itinerary/<int:itinerary_id>')
def itinerary_display(itinerary_id):
    return render_template('itinerary-display.html')


@app.route('/feed')
def feed():
    return render_template('feed.html')


@app.route('/login', methods=['GET'])
def login_page():
    return render_template('loginpage.html')


@app.route('/register', methods=['POST'])
def register():
    email = request.form.get('email', '').strip()
    phone = request.form.get('phone', '').strip()
    password = request.form.get('password', '').strip()
    confirm_password = request.form.get('confirm_password', '').strip()

    if not email or not phone or not password or not confirm_password:
        flash("Please fill in all fields.", "register_error")
        return redirect(url_for('login_page'))

    if password != confirm_password:
        flash("Passwords do not match.", "register_error")
        return redirect(url_for('login_page'))

    if len(password) < 6:
        flash("Password must be at least 6 characters.", "register_error")
        return redirect(url_for('login_page'))

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        flash("An account with that email already exists.", "register_error")
        return redirect(url_for('login_page'))

    new_user = User(email=email, phone=phone)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    session["user_id"] = new_user.id

    # First time signup -> choose username
    return redirect(url_for('choose_username'))


@app.route('/login', methods=['POST'])
def login():
    identifier = request.form.get('identifier', '').strip()
    password = request.form.get('password', '').strip()

    if not identifier or not password:
        flash("Please fill in all fields.", "login_error")
        return redirect(url_for('login_page'))

    if "@" in identifier:
        user = User.query.filter_by(email=identifier).first()
    else:
        user = User.query.filter_by(username=identifier).first()

    if user is None or not user.check_password(password):
        flash("Invalid credentials.", "login_error")
        return redirect(url_for('login_page'))

    session["user_id"] = user.id

    if not user.username:
        return redirect(url_for('choose_username'))

    return redirect(url_for('feed'))


@app.route('/username', methods=['GET', 'POST'])
def choose_username():
    user_id = session.get("user_id")
    if not user_id:
        return redirect(url_for('login_page'))

    user = User.query.get(user_id)
    if not user:
        session.clear()
        return redirect(url_for('login_page'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()

        if not username:
            flash("Please enter a username.", "username_error")
            return redirect(url_for('choose_username'))

        if len(username) < 3:
            flash("Username must be at least 3 characters.", "username_error")
            return redirect(url_for('choose_username'))

        existing_username = User.query.filter_by(username=username).first()
        if existing_username and existing_username.id != user.id:
            flash("That username is already taken.", "username_error")
            return redirect(url_for('choose_username'))

        user.username = username
        db.session.commit()

        flash("Username saved successfully.", "success")
        return redirect(url_for('feed'))

    return render_template('username.html')


@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    email = request.form.get('email', '').strip()
    new_password = request.form.get('new_password', '').strip()
    confirm_new_password = request.form.get('confirm_new_password', '').strip()

    if not email or not new_password or not confirm_new_password:
        flash("Please fill in all forgot password fields.", "forgot_error")
        return redirect(url_for('login_page'))

    if new_password != confirm_new_password:
        flash("New passwords do not match.", "forgot_error")
        return redirect(url_for('login_page'))

    if len(new_password) < 6:
        flash("New password must be at least 6 characters.", "forgot_error")
        return redirect(url_for('login_page'))

    user = User.query.filter_by(email=email).first()
    if not user:
        flash("No account found with that email.", "forgot_error")
        return redirect(url_for('login_page'))

    user.set_password(new_password)
    db.session.commit()

    flash("Password reset successful. Please log in.", "success")
    return redirect(url_for('login_page'))

@app.route('/messages')
def dms():
    if "user_id" not in session:
        return redirect(url_for('login_page'))
    return render_template('dms.html')

@app.route('/api/users')
def api_users():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify([]), 401

    users = User.query.filter(User.id != user_id).all()

    return jsonify([
        {
            "id": user.id,
            "email": user.email,
            "username": user.username
        }
        for user in users
    ])

@app.route('/api/messages/<int:other_user_id>')
def api_get_messages(other_user_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify([]), 401

    messages = Message.query.filter(
        or_(
            and_(Message.sender_id == user_id, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == user_id)
        )
    ).order_by(Message.created_at.asc()).all()

    return jsonify([
        {
            "id": msg.id,
            "text": msg.text,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "is_mine": msg.sender_id == user_id
        }
        for msg in messages
    ])


@app.route('/api/messages', methods=['POST'])
def api_send_message():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    receiver_id = data.get("receiver_id")
    text = data.get("text", "").strip()

    if not receiver_id or not text:
        return jsonify({"error": "Missing data"}), 400

    new_message = Message(
        sender_id=user_id,
        receiver_id=receiver_id,
        text=text
    )

    db.session.add(new_message)
    db.session.commit()

    return jsonify({"success": True})
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))


if __name__ == '__main__':
    app.run(debug=True)


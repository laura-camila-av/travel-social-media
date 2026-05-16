from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from sqlalchemy import or_, and_
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json
from datetime import timedelta, datetime
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///users.db")
csrf = CSRFProtect(app)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif','heic'}
app.permanent_session_lifetime = timedelta(days=10)

db = SQLAlchemy(app)
migrate = Migrate(app, db)


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
    reaction = db.Column(db.String(10), nullable=True)
    reply_to_id = db.Column(db.Integer, db.ForeignKey('message.id'), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

class Like(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    itinerary_id = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    __table_args__ = (
        db.UniqueConstraint('user_id', 'itinerary_id', name='unique_user_itinerary_like'),
    )

class SavedItinerary(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    itinerary_id = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    __table_args__ = (
        db.UniqueConstraint('user_id', 'itinerary_id', name='unique_user_saved_itinerary'),
    )

class Itinerary(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    user = db.relationship('User')   

    destination = db.Column(db.String(120), nullable=False)
    travel_style = db.Column(db.String(50), nullable=True)
    budget = db.Column(db.Float, nullable=True)

    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    days = db.relationship(
        'ItineraryDay',
        backref='itinerary',
        cascade='all, delete-orphan',
        lazy=True
    )

class ItineraryDay(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    itinerary_id = db.Column(db.Integer, db.ForeignKey('itinerary.id'), nullable=False)

    day_number = db.Column(db.Integer, nullable=False)

    total_cost = db.Column(db.Float, nullable=True)
    rented_items = db.Column(db.String(255), nullable=True)
    transport_taken = db.Column(db.Text, nullable=True)
    accommodation = db.Column(db.String(255), nullable=True)

    caption = db.Column(db.Text, nullable=True)

    activity_details = db.Column(db.Text, nullable=True)
    dining_details = db.Column(db.Text, nullable=True)

    photos = db.relationship(
        'ItineraryPhoto',
        backref='day',
        cascade='all, delete-orphan',
        lazy=True
    )

class ItineraryPhoto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    itinerary_day_id = db.Column(db.Integer, db.ForeignKey('itinerary_day.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)

class Follow(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    follower_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    following_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    __table_args__ = (
        db.UniqueConstraint('follower_id', 'following_id', name='unique_user_follow'),
    )

class SearchHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    search_text = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

def add_thumbnails(itineraries):
    for itinerary in itineraries:
        first_photo = ItineraryPhoto.query.join(ItineraryDay).filter(
            ItineraryDay.itinerary_id == itinerary.id
        ).order_by(ItineraryDay.day_number.asc(), ItineraryPhoto.id.asc()).first()

        itinerary.thumbnail = first_photo.filename if first_photo else None

    return itineraries

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


@app.route('/')
def homepage():
    if "user_id" in session:
        return redirect(url_for('feed'))
    return render_template('homepage.html')


@app.route('/profile')
def user_profile():
    user_id = session.get("user_id")

    if not user_id:
        return redirect(url_for('login_page'))

    user = User.query.get_or_404(user_id)

    interests = [
        user.interest_1,
        user.interest_2,
        user.interest_3,
        user.interest_4,
        user.interest_5
    ]
    interests = [interest for interest in interests if interest]

    user_itineraries = add_thumbnails(Itinerary.query.filter_by(user_id=user_id).all())
    saved_items = add_thumbnails(db.session.query(Itinerary).join(
        SavedItinerary, SavedItinerary.itinerary_id == Itinerary.id
    ).filter(SavedItinerary.user_id == user_id).all())

    follower_count = Follow.query.filter_by(following_id=user_id).count()
    following_count = Follow.query.filter_by(follower_id=user_id).count()

    return render_template(
        'user-profile.html',
        user=user,
        interests=interests,
        user_itineraries=add_thumbnails(user_itineraries),
        saved_items=saved_items,
        is_own_profile=True,
        is_following=False,
        follower_count=follower_count,
        following_count=following_count
    )


@app.route('/user/<int:user_id>')
def view_user_profile(user_id):
    current_user_id = session.get("user_id")

    if not current_user_id:
        return redirect(url_for('login_page'))

    user = User.query.get_or_404(user_id)

    if user.id == current_user_id:
        return redirect(url_for('user_profile'))

    interests = [
        user.interest_1,
        user.interest_2,
        user.interest_3,
        user.interest_4,
        user.interest_5
    ]
    interests = [interest for interest in interests if interest]

    user_itineraries = add_thumbnails(Itinerary.query.filter_by(user_id=user_id).all())
    saved_items = []

    existing_follow = Follow.query.filter_by(
        follower_id=current_user_id,
        following_id=user_id
    ).first()

    is_following = existing_follow is not None

    follower_count = Follow.query.filter_by(following_id=user_id).count()
    following_count = Follow.query.filter_by(follower_id=user_id).count()

    return render_template(
        'user-profile.html',
        user=user,
        interests=interests,
        user_itineraries=user_itineraries,
        saved_items=saved_items,
        is_own_profile=False,
        is_following=is_following,
        follower_count=follower_count,
        following_count=following_count
    )

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

@app.route('/create', methods=['GET', 'POST'])
def itinerary_create():
    user_id = session.get("user_id")
    if not user_id:
        return redirect(url_for('login_page'))

    if request.method == 'POST':
        title = request.form.get('trip-title', '').strip()
        destination = request.form.get('destination', '').strip()
        travel_style = request.form.get('travel-style', '').strip()
        budget_raw = request.form.get('trip-budget', '').strip()
        start_date_raw = request.form.get('start-date', '').strip()
        end_date_raw = request.form.get('end-date', '').strip()

        if not title or not destination or not start_date_raw or not end_date_raw:
            flash("Please fill in all required trip details.", "error")
            return redirect(url_for('itinerary_create'))

        try:
            start_date = datetime.strptime(start_date_raw, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_raw, "%Y-%m-%d").date()
        except ValueError:
            flash("Invalid date format.", "error")
            return redirect(url_for('itinerary_create'))

        if end_date < start_date:
            flash("End date cannot be earlier than start date.", "error")
            return redirect(url_for('itinerary_create'))

        try:
            budget = float(budget_raw) if budget_raw else None
        except ValueError:
            flash("Budget must be a valid number.", "error")
            return redirect(url_for('itinerary_create'))

        new_itinerary = Itinerary(
            title=title,
            user_id=user_id,
            destination=destination,
            travel_style=travel_style if travel_style else None,
            budget=budget,
            start_date=start_date,
            end_date=end_date
        )

        db.session.add(new_itinerary)
        db.session.flush()

        total_days = (end_date - start_date).days + 1

        for day_num in range(1, total_days + 1):
            cost_raw = request.form.get(f'cost-day{day_num}', '').strip()
            rented_items = request.form.get(f'rented-items-day{day_num}', '').strip()
            accommodation = request.form.get(f'accommodation-day{day_num}', '').strip()
            transport = request.form.get(f'transport-day{day_num}', '').strip()
            caption = request.form.get(f'caption-day{day_num}', '').strip()
            activity_details = request.form.get(f'activity-json-day{day_num}', '[]')
            dining_details = request.form.get(f'dining-json-day{day_num}', '[]')

            try:
                total_cost = float(cost_raw) if cost_raw else None
            except ValueError:
                total_cost = None

            new_day = ItineraryDay(
                itinerary_id=new_itinerary.id,
                day_number=day_num,
                total_cost=total_cost,
                rented_items=rented_items or None,
                transport_taken=transport or None,
                accommodation=accommodation or None,
                caption=caption or None,
                activity_details=activity_details,
                dining_details=dining_details,
            )

            db.session.add(new_day)
            db.session.flush()

            photos = request.files.getlist(f'photos-day{day_num}')

            for index, photo in enumerate(photos, start=1):
                if photo and photo.filename and allowed_file(photo.filename):
                    ext = photo.filename.rsplit('.', 1)[1].lower()
                    filename = f"itinerary_{new_itinerary.id}_day{day_num}_{index}.{ext}"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    photo.save(filepath)

                    new_photo = ItineraryPhoto(
                        itinerary_day_id=new_day.id,
                        filename=filename
                    )
                    db.session.add(new_photo)


        db.session.commit()
        flash("Itinerary created successfully.", "success")
        return redirect(url_for('user_profile'))

    return render_template('create-itinerary.html')

@app.route('/search')
def search():
    user_id = session.get("user_id")

    if not user_id:
        return redirect(url_for('login_page'))

    q = request.args.get('q', '').strip()
    if q:
        new_search = SearchHistory(user_id=user_id, search_text=q)
        db.session.add(new_search)
        db.session.commit()
    duration = request.args.get('duration', '').strip()
    travel_style = request.args.get('travel_style', '').strip()
    budget_level = request.args.get('budget', '').strip()

    users = []
    itineraries_query = Itinerary.query

    if q:
        users = User.query.filter(
            User.id != user_id,
            User.username.isnot(None),
            User.username.ilike(f'%{q}%')
        ).all()

        itineraries_query = itineraries_query.filter(
            or_(
                Itinerary.title.ilike(f'%{q}%'),
                Itinerary.destination.ilike(f'%{q}%'),
                User.username.ilike(f'%{q}%')
            )
        ).join(User, Itinerary.user_id == User.id)

    if travel_style:
        itineraries_query = itineraries_query.filter(
            Itinerary.travel_style == travel_style
        )

    if budget_level == "Low":
        itineraries_query = itineraries_query.filter(Itinerary.budget <= 500)
    elif budget_level == "Medium":
        itineraries_query = itineraries_query.filter(
            Itinerary.budget > 500,
            Itinerary.budget <= 2000
        )
    elif budget_level == "High":
        itineraries_query = itineraries_query.filter(Itinerary.budget > 2000)

    itineraries = itineraries_query.order_by(Itinerary.created_at.desc()).all()

    if duration:
        filtered = []

        for itinerary in itineraries:
            trip_days = (itinerary.end_date - itinerary.start_date).days + 1

            if duration == "1-3" and 1 <= trip_days <= 3:
                filtered.append(itinerary)
            elif duration == "4-7" and 4 <= trip_days <= 7:
                filtered.append(itinerary)
            elif duration == "8+" and trip_days >= 8:
                filtered.append(itinerary)

        itineraries = filtered

    return render_template(
        'search_page.html',
        q=q,
        users=users,
        itineraries = add_thumbnails(itineraries),
        duration=duration,
        travel_style=travel_style,
        budget_level=budget_level
    )

@app.route('/itinerary/<int:itinerary_id>')
def itinerary_display(itinerary_id):
    user_id = session.get("user_id")

    if not user_id:                       
        return redirect(url_for('login_page'))
    itinerary = Itinerary.query.get_or_404(itinerary_id)

    like_count = Like.query.filter_by(itinerary_id=itinerary_id).count()
    user_liked = False
    user_saved = False
    is_owner = False

    if user_id:
        user_liked = Like.query.filter_by(
            user_id=user_id, itinerary_id=itinerary_id
        ).first() is not None

        user_saved = SavedItinerary.query.filter_by(
            user_id=user_id, itinerary_id=itinerary_id
        ).first() is not None

        is_owner = (user_id == itinerary.user_id)

    return render_template(
        'itinerary-display.html',
        itinerary=itinerary,
        like_count=like_count,
        user_liked=user_liked,
        user_saved=user_saved,
        is_owner=is_owner,
    )

@app.template_filter('from_json')
def from_json_filter(value):
    if not value:
        return []
    try:
        return json.loads(value)
    except Exception:
        return []

@app.route('/api/save/<int:itinerary_id>', methods=['POST'])
def toggle_save(itinerary_id):
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    existing_save = SavedItinerary.query.filter_by(
        user_id=user_id,
        itinerary_id=itinerary_id
    ).first()

    if existing_save:
        db.session.delete(existing_save)
        saved = False
    else:
        new_save = SavedItinerary(
            user_id=user_id,
            itinerary_id=itinerary_id
        )
        db.session.add(new_save)
        saved = True

    db.session.commit()

    return jsonify({
        "saved": saved
    })

@app.route('/api/delete-itinerary/<int:itinerary_id>', methods=['POST'])
def delete_itinerary(itinerary_id):
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    itinerary = Itinerary.query.get_or_404(itinerary_id)

    if itinerary.user_id != user_id:
        return jsonify({"error": "Not allowed"}), 403

    # Remove uploaded photo files from disk
    for day in itinerary.days:
        for photo in day.photos:
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], photo.filename)
            try:
                os.remove(filepath)
            except OSError:
                pass

    # Likes and saves don't cascade, clear them manually
    Like.query.filter_by(itinerary_id=itinerary_id).delete()
    SavedItinerary.query.filter_by(itinerary_id=itinerary_id).delete()

    db.session.delete(itinerary)
    db.session.commit()

    return jsonify({"success": True})

@app.route('/feed')
def feed():
    user_id = session.get("user_id")

    if not user_id:
        return redirect(url_for('login_page'))

    following_ids = [
        follow.following_id
        for follow in Follow.query.filter_by(follower_id=user_id).all()
    ]

    following_itineraries = []

    if following_ids:
        following_itineraries = Itinerary.query.filter(
            Itinerary.user_id.in_(following_ids)
        ).order_by(Itinerary.created_at.desc()).all()

    recent_searches = SearchHistory.query.filter_by(
        user_id=user_id
    ).order_by(SearchHistory.created_at.desc()).limit(5).all()

    search_terms = [search.search_text for search in recent_searches]

    recommended_itineraries = []

    for term in search_terms:
        matches = Itinerary.query.filter(
            or_(
                Itinerary.title.ilike(f"%{term}%"),
                Itinerary.destination.ilike(f"%{term}%"),
                Itinerary.travel_style.ilike(f"%{term}%")
            )
        ).all()

        for itinerary in matches:
            if itinerary not in recommended_itineraries:
                recommended_itineraries.append(itinerary)

    other_itineraries = Itinerary.query.filter(
        Itinerary.user_id != user_id
    ).order_by(Itinerary.created_at.desc()).limit(12).all()

    return render_template(
        'feed.html',
        following_itineraries = add_thumbnails(following_itineraries),
        recommended_itineraries = add_thumbnails(recommended_itineraries),
        other_itineraries = add_thumbnails(other_itineraries)
    )


@app.route('/login', methods=['GET'])
def login_page():
    return render_template(
        'loginpage.html',
        register_email=session.get("register_email", ""),
        register_phone=session.get("register_phone", "")
    )


@app.route('/register', methods=['POST'])
def register():
    email = request.form.get('email', '').strip()
    phone = request.form.get('phone', '').strip()
    password = request.form.get('password', '').strip()
    confirm_password = request.form.get('confirm_password', '').strip()
    session["register_email"] = email
    session["register_phone"] = phone

    if not email or not phone or not password or not confirm_password:
        flash("Please fill in all fields.", "register_error")
        return redirect(url_for('login_page', form='register'))

    if "@" not in email or "." not in email:
        flash("Please enter a valid email.", "register_error")
        return redirect(url_for('login_page', form='register'))

    if not phone.isdigit() or len(phone) < 8 or len(phone) > 15:
        flash("Please enter a valid phone number.", "register_error")
        return redirect(url_for('login_page', form='register'))

    if password != confirm_password:
        flash("Passwords do not match.", "register_error")
        return redirect(url_for('login_page', form='register'))

    if len(password) < 6:
        flash("Password must be at least 6 characters.", "register_error")
        return redirect(url_for('login_page', form='register'))

    existing_email = User.query.filter_by(email=email).first()
    if existing_email:
        flash("Another account already exists with this email.", "register_error")
        return redirect(url_for('login_page', form='register'))

    new_user = User(email=email, phone=phone)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    session["user_id"] = new_user.id
    session.pop("register_email", None)
    session.pop("register_phone", None)
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
    
    save_login = request.form.get("save_login")
    if save_login:
        session.permanent = True
    else:
        session.permanent = False
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

    #only users that the user follows or has received a message from
    users = User.query.filter(
    User.id != user_id,
    or_(
        User.id.in_(
            db.session.query(Follow.following_id).filter_by(
                follower_id=user_id
            )
        ),

        User.id.in_(
            db.session.query(Message.sender_id).filter(
                Message.receiver_id == user_id
            )
        ),

        User.id.in_(
            db.session.query(Message.receiver_id).filter(
                Message.sender_id == user_id
            )
        )
    )
    ).all()

    result = []

    for user in users:
        unread_count = Message.query.filter_by(
            sender_id=user.id,
            receiver_id=user_id,
            is_read=False
        ).count()

        result.append({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "unread_count": unread_count
        })

    session["messages_seen_at"] = datetime.utcnow().isoformat()

    return jsonify(result)

@app.route('/api/messages/<int:other_user_id>')
def api_get_messages(other_user_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify([]), 401

    Message.query.filter_by(
        sender_id=other_user_id,
        receiver_id=user_id,
        is_read=False
    ).update({"is_read": True})

    db.session.commit()

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
            "created_at": msg.created_at.isoformat() + "Z",
            "is_mine": msg.sender_id == user_id,
            "reaction": msg.reaction,
            "reply_to_id": msg.reply_to_id,
            "reply_to_text": Message.query.get(msg.reply_to_id).text if msg.reply_to_id else None
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
    reply_to_id = data.get("reply_to_id")
    if not receiver_id or not text:
        return jsonify({"error": "Missing data"}), 400

    new_message = Message(
        sender_id=user_id,
        receiver_id=receiver_id,
        text=text,
        reply_to_id=reply_to_id
    )

    db.session.add(new_message)
    db.session.commit()

    return jsonify({"success": True})

@app.route('/api/messages/<int:message_id>/react', methods=['POST'])
def react_to_message(message_id):
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    reaction = data.get("reaction", "").strip()

    allowed_reactions = ["❤️", "😂", "😮", "😢", "👍"]

    if reaction not in allowed_reactions:
        return jsonify({"error": "Invalid reaction"}), 400

    message = Message.query.get_or_404(message_id)

    # Only receiver can react to the message
    if message.receiver_id != user_id:
        return jsonify({"error": "You can only react to messages you received"}), 403

    # If same reaction clicked again, remove it
    if message.reaction == reaction:
        message.reaction = None
    else:
        message.reaction = reaction

    db.session.commit()

    return jsonify({
        "success": True,
        "reaction": message.reaction
    })

@app.route('/api/like/<int:itinerary_id>', methods=['POST'])
def toggle_like(itinerary_id):
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    existing_like = Like.query.filter_by(
        user_id=user_id,
        itinerary_id=itinerary_id
    ).first()

    if existing_like:
        db.session.delete(existing_like)
        liked = False
    else:
        new_like = Like(
            user_id=user_id,
            itinerary_id=itinerary_id
        )
        db.session.add(new_like)
        liked = True

    db.session.commit()

    like_count = Like.query.filter_by(itinerary_id=itinerary_id).count()

    return jsonify({
        "liked": liked,
        "like_count": like_count
    })

@app.route('/api/follow/<int:user_id>', methods=['POST'])
def toggle_follow(user_id):
    current_user_id = session.get("user_id")

    if not current_user_id:
        return jsonify({"error": "Not logged in"}), 401

    if current_user_id == user_id:
        return jsonify({"error": "You cannot follow yourself"}), 400

    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({"error": "User not found"}), 404

    existing_follow = Follow.query.filter_by(
        follower_id=current_user_id,
        following_id=user_id
    ).first()

    if existing_follow:
        db.session.delete(existing_follow)
        is_following = False
    else:
        new_follow = Follow(
            follower_id=current_user_id,
            following_id=user_id
        )
        db.session.add(new_follow)
        is_following = True

    db.session.commit()

    follower_count = Follow.query.filter_by(following_id=user_id).count()

    return jsonify({
        "following": is_following,
        "follower_count": follower_count
    })

@app.route('/followers/<int:user_id>')
def followers_page(user_id):
    current_user_id = session.get("user_id")

    if not current_user_id:
        return redirect(url_for('login_page'))

    user = User.query.get_or_404(user_id)

    followers = db.session.query(User).join(
        Follow,
        Follow.follower_id == User.id
    ).filter(
        Follow.following_id == user_id
    ).all()

    return render_template(
        'follow-list.html',
        user=user,
        users=followers,
        list_type='followers'
    )


@app.route('/following/<int:user_id>')
def following_page(user_id):
    current_user_id = session.get("user_id")

    if not current_user_id:
        return redirect(url_for('login_page'))

    user = User.query.get_or_404(user_id)

    following = db.session.query(User).join(
        Follow,
        Follow.following_id == User.id
    ).filter(
        Follow.follower_id == user_id
    ).all()

    return render_template(
        'follow-list.html',
        user=user,
        users=following,
        list_type='following'
    )

def get_session_datetime(key):
    value = session.get(key)

    if not value:
        return datetime.min

    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return datetime.min

@app.context_processor
def inject_notification_counts():
    current_user_id = session.get("user_id")

    if not current_user_id:
        return {
            "message_badge_count": 0,
            "notification_badge_count": 0
        }

    notifications_seen_at = get_session_datetime("notifications_seen_at")
    messages_seen_at = get_session_datetime("messages_seen_at")

    # Messages badge only counts unread messages received after opening messages page
    message_badge_count = Message.query.filter(
        Message.receiver_id == current_user_id,
        Message.is_read.is_(False),
        Message.created_at > messages_seen_at
    ).count()

    # Follow notifications only count follows after opening notifications page
    new_follow_count = Follow.query.filter(
        Follow.following_id == current_user_id,
        Follow.created_at > notifications_seen_at
    ).count()

    # Like notifications only count likes after opening notifications page
    new_like_count = db.session.query(Like).join(
        Itinerary,
        Like.itinerary_id == Itinerary.id
    ).filter(
        Itinerary.user_id == current_user_id,
        Like.user_id != current_user_id,
        Like.created_at > notifications_seen_at
    ).count()

    # DM notifications only count unread messages after opening notifications page
    new_message_notification_count = Message.query.filter(
        Message.receiver_id == current_user_id,
        Message.is_read.is_(False),
        Message.created_at > notifications_seen_at
    ).count()

    return {
        "message_badge_count": message_badge_count,
        "notification_badge_count": new_follow_count + new_like_count + new_message_notification_count
    }

@app.route('/notifications')
def notifications():
    current_user_id = session.get("user_id")

    if not current_user_id:
        return redirect(url_for('login_page'))

    notifications = []

    # Follow notifications
    follower_records = Follow.query.filter_by(
        following_id=current_user_id
    ).order_by(Follow.created_at.desc()).all()

    for record in follower_records:
        follower = User.query.get(record.follower_id)

        if follower:
            is_following_back = Follow.query.filter_by(
                follower_id=current_user_id,
                following_id=follower.id
            ).first() is not None

            notifications.append({
                "type": "follow",
                "actor": follower,
                "created_at": record.created_at,
                "is_following_back": is_following_back
            })

    # Like notifications
    like_records = db.session.query(
        Like,
        Itinerary,
        User
    ).join(
        Itinerary,
        Like.itinerary_id == Itinerary.id
    ).join(
        User,
        Like.user_id == User.id
    ).filter(
        Itinerary.user_id == current_user_id,
        Like.user_id != current_user_id
    ).order_by(
        Like.created_at.desc()
    ).all()

    for like, itinerary, liker in like_records:
        notifications.append({
            "type": "like",
            "actor": liker,
            "itinerary": itinerary,
            "created_at": like.created_at
        })

    # DM notifications for unread messages
    unread_messages = Message.query.filter_by(
        receiver_id=current_user_id,
        is_read=False
    ).order_by(
        Message.created_at.desc()
    ).all()

    seen_senders = set()

    for message in unread_messages:
        if message.sender_id in seen_senders:
            continue

        sender = User.query.get(message.sender_id)

        if sender:
            notifications.append({
                "type": "message",
                "actor": sender,
                "message": message,
                "created_at": message.created_at
            })

            seen_senders.add(message.sender_id)

    notifications.sort(
        key=lambda notification: notification["created_at"],
        reverse=True
    )

    session["notifications_seen_at"] = datetime.utcnow().isoformat()

    return render_template(
        'notifications.html',
        notifications=notifications
    )

@app.route('/api/remove-follower/<int:follower_id>', methods=['POST'])
def remove_follower(follower_id):
    current_user_id = session.get("user_id")

    if not current_user_id:
        return jsonify({"error": "Not logged in"}), 401

    follow_record = Follow.query.filter_by(
        follower_id=follower_id,
        following_id=current_user_id
    ).first()

    if follow_record:
        db.session.delete(follow_record)
        db.session.commit()

    return jsonify({"success": True})

# Returns a list of users that the current user follows (used to populate the share itinerary dropdown)
@app.route('/api/followed-users')
def followed_users():
    current_user_id = session.get("user_id")
    if not current_user_id:
        return jsonify([]), 401

    follows = Follow.query.filter_by(follower_id=current_user_id).all()
    
    users = []
    for follow in follows:
        user = User.query.get(follow.following_id)
        if user:
            users.append({
                "id": user.id,
                "username": user.username
            })
    
    return jsonify(users)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('homepage'))


if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    with app.app_context():
        db.create_all()

    app.run(debug=True)

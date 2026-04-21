from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def homepage():
    return render_template('homepage.html')

@app.route('/profile')
def user_profile():
    return render_template('user-profile.html')

@app.route('/create')
def itinerary_create():
    return render_template('itinerary.html')

@app.route('/messages')
def dms():
    return render_template('dms.html')

@app.route('/search')
def search():
    return render_template('search_page.html')

@app.route('/itinerary/<int:itinerary_id>')
def itinerary_display(itinerary_id):
    return render_template('itinerary-display.html')

@app.route('/feed')
def feed():
    return render_template('feed.html')

if __name__ == '__main__':
    app.run(debug=True)
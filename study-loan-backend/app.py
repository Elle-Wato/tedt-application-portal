from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from config import Config
from models import db
from extensions import mail  # Import the centralized mail object
from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.submissions import submissions_bp
from routes.uploads import uploads_bp
from routes.staff import staff_bp
from datetime import timedelta
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
application = app
app.config.from_object(Config)

# Allow your React app to talk to your Flask app
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# ── SMTP CONFIGURATION (cPanel) ──
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = 'elimishatrust2@gmail.com'
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = 'elimishatrust2@gmail.com'


print("--- MAIL DEBUG ---")
print(f"Server: {app.config['MAIL_SERVER']}")
print(f"User: {app.config['MAIL_USERNAME']}")
print(f"Pass Length: {len(app.config['MAIL_PASSWORD']) if app.config['MAIL_PASSWORD'] else 'NONE'}")
print("------------------")

# ── INITIALIZE EXTENSIONS ──
# We use init_app to prevent circular imports with Blueprints
mail.init_app(app) 
db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

# ── JWT CONFIGURATION ──
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30) 

# ── CORS CONFIGURATION ──
CORS(app, origins=[
    'http://127.0.0.1:5173', 
    'http://localhost:3000', 
    app.config.get('FRONTEND_URL', 'http://localhost:3000')
])

# ── REGISTER BLUEPRINTS ──
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(admin_bp, url_prefix='/admin')
app.register_blueprint(submissions_bp, url_prefix='/submissions')
app.register_blueprint(uploads_bp, url_prefix='/uploads')
app.register_blueprint(staff_bp, url_prefix='/staff')

# ── HEALTH CHECK ROUTE (Optional: To test if the server is up) ──
@app.route('/')
def index():
    return {"status": "Elimisha Trust API is running"}, 200

if __name__ == '__main__':
    app.run(debug=True)
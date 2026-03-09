from dotenv import load_dotenv
load_dotenv()  # Explicitly load .env

from app import app, db

with app.app_context():
    db.create_all()
print('Database tables created successfully!')
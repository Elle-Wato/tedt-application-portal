import os
from dotenv import load_dotenv
from app import app, db 
from models import User, Staff 
from werkzeug.security import generate_password_hash

# Load the variables from .env
load_dotenv()

with app.app_context(): 
    staff_email = os.getenv('STAFF_EMAIL')
    staff_pass = os.getenv('STAFF_PASSWORD')

    if not staff_email or not staff_pass:
        print("Error: STAFF_EMAIL or STAFF_PASSWORD not found in .env")
    else:
        existing_user = User.query.filter_by(email=staff_email).first()
        if existing_user:
            # Update existing user password just in case
            existing_user.password_hash = generate_password_hash(staff_pass)
            existing_user.is_verified = True
            db.session.commit()
            print(f"Updated password for existing staff: {staff_email}")
        else:
            staff_user = User(
                email=staff_email, 
                password_hash=generate_password_hash(staff_pass), 
                role='staff',
                is_verified=True
            )
            db.session.add(staff_user)
            db.session.flush() 
            
            staff_profile = Staff(user_id=staff_user.id) 
            db.session.add(staff_profile)
            db.session.commit()
            print(f"Created and verified new staff: {staff_email}")
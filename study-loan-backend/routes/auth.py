import uuid
from flask import Blueprint, request, jsonify, redirect
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from models import db, User, Student
from utils.email import send_email 

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400

    # 1. Create User object
    # We set verification_token to None and is_verified to True immediately
    user = User(
        email=email, 
        password_hash=generate_password_hash(password), 
        role=role,
        verification_token=None, 
        is_verified=True 
    )
    
    db.session.add(user)
    db.session.commit()

    if role == 'student':
        student = Student(user_id=user.id)
        db.session.add(student)
        db.session.commit()

    # 2. Email Section Removed
    # Students can now log in immediately after clicking Register.
    
    return jsonify({
        'message': 'Registration successful! You can now log in to start your application.'
    }), 201

@auth_bp.route('/verify/<token>', methods=['GET'])
def verify(token):
    user = User.query.filter_by(verification_token=token).first()
    if not user:
        # Redirect to frontend with an error status
        return redirect("https://apply.elimishatrust.or.ke/login?error=invalid_token")

    user.is_verified = True
    user.verification_token = None
    db.session.commit()

    # SUCCESS: Redirect back to your LIVE frontend login page
    return redirect("https://apply.elimishatrust.or.ke/login?verified=true")

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password_hash, password):
        # OPTIONAL: Force verification to True just in case an old user tries to log in
        if not user.is_verified:
            user.is_verified = True
            db.session.commit()
            
        token = create_access_token(identity=user.email)
        return jsonify({
            'token': token, 
            'role': user.role,
            'email': user.email
        }), 200
        
    return jsonify({'error': 'Invalid email or password'}), 401
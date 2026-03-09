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
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student')

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email exists'}), 400

    # 1. Create token and User object
    verification_token = str(uuid.uuid4())
    user = User(
        email=email, 
        password_hash=generate_password_hash(password), 
        role=role,
        verification_token=verification_token,
        is_verified=False 
    )
    
    db.session.add(user)
    db.session.commit()

    if role == 'student':
        student = Student(user_id=user.id)
        db.session.add(student)
        db.session.commit()

    # 2. Send Verification Email
    # Note: When deploying, change to your actual frontend URL (e.g., your-app.render.com)
    verify_url = f"http://127.0.0.1:5000/auth/verify/{verification_token}"
    
    try:
        send_email(email, 'Verify Your Account', f"Welcome! Please verify your account by clicking this link: {verify_url}")
        return jsonify({'message': 'Registration successful! Check your email to verify.'}), 201
    except Exception as e:
        print(f"!!! EMAIL ERROR: {e}")
        return jsonify({
            'message': 'Account created, but verification email failed. Please contact admin.',
            'error_details': str(e)
        }), 201

@auth_bp.route('/verify/<token>', methods=['GET'])
def verify(token):
    user = User.query.filter_by(verification_token=token).first()
    if not user:
        return "<h1>Invalid Link</h1>", 400

    user.is_verified = True
    user.verification_token = None
    db.session.commit()

    # Redirect back to your login page with a success message in the URL
    return redirect("http://localhost:5173/?verified=true")

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if user and check_password_hash(user.password_hash, data['password']):
        if not user.is_verified:
            return jsonify({'error': 'Please verify your email address before logging in.'}), 403
            
        token = create_access_token(identity=user.email)
        return jsonify({'token': token, 'role': user.role})
        
    return jsonify({'error': 'Invalid credentials'}), 401
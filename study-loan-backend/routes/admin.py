from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from sqlalchemy.orm import aliased
from sqlalchemy import func, and_
from sqlalchemy.orm.attributes import flag_modified

from models import db, User, Staff, Student, Submission, Document
import json

admin_bp = Blueprint('admin', __name__)

# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------

def admin_or_staff_required():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if not user or user.role not in ['admin', 'staff']:
        return jsonify({'error': 'Forbidden'}), 403
    return None

def serialize_student(student, submission=None):
    # Extract program type from the JSON details
    details = student.details or {}
    program = details.get('program', 'N/A').replace('_', ' ').title()

    return {
        'id': student.id,
        'submission_id': submission.id if submission else None, # Add this!
        'name': f"{student.name} ({program})", # Helpful for the staff to see the level
        'email': student.user.email if student.user else 'N/A',
        'details': details,
        'status': submission.status if submission else 'pending',
        'submitted_at': submission.submitted_at.isoformat() if submission and submission.submitted_at else None,
        'is_locked': submission.is_locked if submission else False,
        'documents': [
            {
                'id': doc.id,
                'file_url': doc.file_url,
                'uploaded_at': doc.uploaded_at.isoformat()
            } for doc in student.documents
        ]
    }

# -------------------------------------------------------------------
# Create Staff (Admin only)
# -------------------------------------------------------------------

@admin_bp.route('/create-staff', methods=['POST'])
@jwt_required()
def create_staff():
    try:
        user_email = get_jwt_identity()
        admin_user = User.query.filter_by(email=user_email).first()

        if not admin_user or admin_user.role != 'admin':
            return jsonify({'error': 'Forbidden'}), 403

        data = request.get_json()

        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400

        existing = User.query.filter_by(email=data['email']).first()
        if existing:
            return jsonify({'error': 'Email already exists'}), 409

        new_user = User(
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            role='staff'
        )
        db.session.add(new_user)
        db.session.flush()

        staff = Staff(user_id=new_user.id, admin_id=admin_user.id)
        db.session.add(staff)
        db.session.commit()

        return jsonify({'message': 'Staff created successfully'}), 201

    except Exception as e:
        db.session.rollback()
        print("Error creating staff:", str(e))
        return jsonify({'error': 'Internal server error'}), 500

# -------------------------------------------------------------------
# Admin: View all users
# -------------------------------------------------------------------

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        user_email = get_jwt_identity()
        user = User.query.filter_by(email=user_email).first()

        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403

        users = User.query.all()
        return jsonify([
            {
                'id': u.id,
                'email': u.email,
                'role': u.role,
                'created_at': u.created_at.isoformat()
            }
            for u in users
        ])

    except Exception as e:
        print("Error fetching users:", str(e))
        return jsonify({'error': 'Internal server error'}), 500

# -------------------------------------------------------------------
# Staff/Admin: List all students (Dashboard Table)
# -------------------------------------------------------------------

@admin_bp.route('/students', methods=['GET'])
@jwt_required()
def get_students():
    try:
        error = admin_or_staff_required()
        if error: return error

        # 1. Subquery to find the LATEST Student ID for each User
        subq = db.session.query(
            Student.user_id,
            func.max(Student.id).label('latest_id')
        ).group_by(Student.user_id).subquery()

        # 2. Join Submission -> Student -> Subquery
        # This filters out all old student records and duplicate submissions
        rows = db.session.query(Student, Submission)\
            .join(subq, Student.id == subq.c.latest_id)\
            .join(Submission, Submission.student_id == Student.id)\
            .order_by(Submission.submitted_at.desc())\
            .all()

        # 3. Serialize
        result = [serialize_student(student, submission) for student, submission in rows]
        return jsonify(result)

    except Exception as e:
        print("Error:", str(e))
        return jsonify({'error': 'Internal server error'}), 500

# -------------------------------------------------------------------
# Staff/Admin: Full Loan Application Review
# -------------------------------------------------------------------

@admin_bp.route('/students/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student_details(student_id):
    try:
        error = admin_or_staff_required()
        if error:
            return error

        student = Student.query.filter_by(id=student_id).first()
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        latest_submission = Submission.query \
            .filter_by(student_id=student_id) \
            .order_by(Submission.submitted_at.desc()) \
            .first()

        return jsonify(serialize_student(student, latest_submission))

    except Exception as e:
        print("Error fetching student details:", str(e))
        return jsonify({'error': 'Internal server error'}), 500

# -------------------------------------------------------------------
# Student: Update their own details (only if NOT locked)
# -------------------------------------------------------------------

@admin_bp.route('/students/update-details', methods=['PATCH'])
@jwt_required()
def update_student_details():
    try:
        user_email = get_jwt_identity()
        user = User.query.filter_by(email=user_email).first()

        if not user or user.role != 'student':
            return jsonify({'error': 'Unauthorized'}), 403

        student = Student.query.filter_by(user_id=user.id).order_by(Student.id.desc()).first()
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404

        # ── Check if submission is locked ──
        latest_submission = Submission.query.filter_by(
            student_id=student.id
        ).order_by(Submission.submitted_at.desc()).first()

        if latest_submission and latest_submission.is_locked:
            return jsonify({
                'error': 'Application is locked and cannot be edited.',
                'is_locked': True
            }), 403

        incoming_data = request.get_json()

        print("\n" + "=" * 60)
        print("🔵 INCOMING DATA:")
        print(json.dumps(incoming_data, indent=2))
        print("\n🟡 EXISTING DETAILS BEFORE MERGE:")
        print(json.dumps(student.details, indent=2))
        print("=" * 60 + "\n")

        # Always ensure details is a dict
        existing_details = student.details if student.details else {}
        if isinstance(existing_details, str):
            try:
                existing_details = json.loads(existing_details)
            except Exception:
                existing_details = {}

        # Merge incoming data
        existing_details.update(incoming_data)

        # Force SQLAlchemy to detect the change
        student.details = dict(existing_details)
        flag_modified(student, 'details')

        # Update student name if provided
        if 'personalDetails' in incoming_data and 'fullName' in incoming_data['personalDetails']:
            student.name = incoming_data['personalDetails']['fullName']

        db.session.commit()

        print("✅ SAVED SUCCESSFULLY")
        print("🟢 DETAILS AFTER MERGE:")
        print(json.dumps(student.details, indent=2))
        print("=" * 60 + "\n")

        return jsonify({'message': 'Details updated successfully'})

    except Exception as e:
        db.session.rollback()
        print("Error updating student details:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# -------------------------------------------------------------------
# Student: Check submission lock status
# -------------------------------------------------------------------

@admin_bp.route('/student/submission-status', methods=['GET'])
@jwt_required()
def submission_status():
    try:
        user_email = get_jwt_identity()
        user = User.query.filter_by(email=user_email).first()

        if not user:
            return jsonify({"is_locked": False}), 404

        student = Student.query.filter_by(user_id=user.id).order_by(Student.id.desc()).first()
        if not student:
            return jsonify({"is_locked": False, "details": {}})

        submission = Submission.query.filter_by(
            student_id=student.id
        ).order_by(Submission.submitted_at.desc()).first()

        return jsonify({
            "is_locked": submission.is_locked if submission else False,
            "details": student.details or {}
        })

    except Exception as e:
        print("Error checking submission status:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({"is_locked": False}), 500
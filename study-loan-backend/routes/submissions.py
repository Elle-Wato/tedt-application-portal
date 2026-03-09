from flask import Blueprint, request, jsonify, current_app
from flask_mail import Message
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Student, Submission
from extensions import mail # Import from extensions, not app.py
from datetime import datetime
import json

submissions_bp = Blueprint('submissions', __name__)

# ── Helper to extract consent data ──
def build_consent_data(data):
    return {
        'studentName': data.get('studentName'),
        'studentDate': data.get('studentDate'),
        'studentSignature': data.get('studentSignature'),
        'guardianName': data.get('guardianName'),
        'guardianDate': data.get('guardianDate'),
        'guardianSignature': data.get('guardianSignature'),
        'guarantorName': data.get('guarantorName'),
        'guarantorDate': data.get('guarantorDate'),
        'guarantorSignature': data.get('guarantorSignature'),
        'submittedAt': datetime.utcnow().isoformat()
    }

# ── Helper to send the email ──
def send_notification_email(student_name, program):
    try:
        msg = Message(
            subject=f"🚀 New Application: {student_name}",
            recipients=["applications@elimishatrust.or.ke"],
            body=f"""
Hello Team,

A new loan application has been received on the Elimisha Trust Portal.

STUDENT DETAILS:
--------------------------------
Name: {student_name}
Program: {program.replace('_', ' ').title() if program else 'N/A'}
Submitted At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}
--------------------------------

Please log in to the Staff Dashboard to review the full details.
            """
        )
        # Use the mail object directly imported from extensions
        mail.send(msg)
        print(f"✅ Notification email sent for {student_name}")
    except Exception as e:
        print(f"❌ Mail Notification Error: {str(e)}")

@submissions_bp.route('/submit', methods=['POST'])
@jwt_required()
def submit_application():
    try:
        user_email = get_jwt_identity()
        user = User.query.filter_by(email=user_email).first()

        if not user or user.role != 'student':
            return jsonify({'error': 'Unauthorized'}), 403

        student = Student.query.filter_by(user_id=user.id).first()
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404

        data = request.get_json() or {}
        program_name = data.get('program', 'N/A')

        # ── Check if student already has a locked/submitted application ──
        existing_submission = Submission.query.filter_by(
            student_id=student.id,
            is_locked=True
        ).first()

        if existing_submission:
            # Build fresh details for new application
            consent_data = build_consent_data(data)
            new_details = {k: v for k, v in data.items() if k not in consent_data}
            new_details['consentForm'] = consent_data

            # Student name logic moved INSIDE here where 'data' is defined
            current_student_name = (
                consent_data.get('studentName') or
                new_details.get('personalDetails', {}).get('fullName') or
                student.name
            )

            new_student = Student(
                user_id=user.id,
                name=current_student_name,
                details=new_details
            )
            db.session.add(new_student)
            db.session.flush() 

            new_submission = Submission(
                student_id=new_student.id,
                submitted_at=datetime.utcnow(),
                status='pending',
                is_locked=True
            )
            db.session.add(new_submission)
            db.session.commit()

            send_notification_email(current_student_name, program_name)

            return jsonify({
                'message': 'New application created successfully',
                'submission_id': new_submission.id
            }), 201

        else:
            # Update/Create first submission
            pending_submission = Submission.query.filter_by(
                student_id=student.id,
                is_locked=False
            ).first()

            details = student.details or {}
            if isinstance(details, str):
                try: details = json.loads(details)
                except: details = {}

            consent_data = build_consent_data(data)
            for key in (set(data.keys()) - set(consent_data.keys())):
                details[key] = data[key]

            details['consentForm'] = consent_data

            current_student_name = (
                consent_data.get('studentName') or
                details.get('personalDetails', {}).get('fullName') or
                student.name
            )
            
            if current_student_name and current_student_name != student.name:
                student.name = current_student_name

            student.details = details
            db.session.add(student)

            if pending_submission:
                pending_submission.submitted_at = datetime.utcnow()
                pending_submission.status = 'pending'
                pending_submission.is_locked = True 
                db.session.add(pending_submission)
            else:
                new_submission = Submission(
                    student_id=student.id,
                    submitted_at=datetime.utcnow(),
                    status='pending',
                    is_locked=True 
                )
                db.session.add(new_submission)

            db.session.commit()

            send_notification_email(current_student_name, program_name)

            return jsonify({'message': 'Application submitted successfully'}), 201

    except Exception as e:
        db.session.rollback()
        print("Submission error:", str(e))
        return jsonify({'error': 'Internal server error'}), 500
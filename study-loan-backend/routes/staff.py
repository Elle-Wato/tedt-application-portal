from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Submission

staff_bp = Blueprint('staff', __name__)

@staff_bp.route('/submission/<int:student_id>', methods=['PATCH'])
@jwt_required()
def update_status(student_id):
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    
    if not user or user.role != 'staff':
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['approved', 'rejected']:
        return jsonify({'message': 'Invalid status'}), 400
    
    # Find the latest submission for the student (assuming one per student)
    submission = Submission.query.filter_by(student_id=student_id).order_by(Submission.submitted_at.desc()).first()
    if not submission:
        return jsonify({'message': 'Submission not found'}), 404
    
    submission.status = new_status
    db.session.commit()
    return jsonify({'message': 'Status updated successfully'})
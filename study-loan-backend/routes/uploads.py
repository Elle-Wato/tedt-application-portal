from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Student, Document
import cloudinary.uploader
import os
import re

uploads_bp = Blueprint('uploads', __name__)

@uploads_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_document():
    try:
        user_email = get_jwt_identity()
        user = User.query.filter_by(email=user_email).first()

        if not user or user.role != 'student':
            return jsonify({'error': 'Unauthorized'}), 403
        
        student = Student.query.filter_by(user_id=user.id).first()
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        file = request.files.get('file')
        if not file:
            return jsonify({'error': 'No file provided'}), 400
        
        # ✅ CRITICAL FIX HERE
        original_filename = file.filename
        filename_without_ext = os.path.splitext(original_filename)[0]
        safe_filename = re.sub(r"[^a-zA-Z0-9_-]", "_", filename_without_ext)
        
        upload_result = cloudinary.uploader.upload(
    file,
    resource_type="raw",
    public_id=f"{student.id}_{safe_filename}",
    overwrite=True
)



        file_url = upload_result['secure_url']

        # Save document reference
        document = Document(
            student_id=student.id,
            file_url=file_url
        )

        db.session.add(document)
        db.session.commit()
        
        return jsonify({
            'message': 'File uploaded successfully',
            'file_url': file_url
        }), 201
    
    except Exception as e:
        print("Upload error:", str(e))
        db.session.rollback()
        return jsonify({'error': 'Upload failed'}), 500

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='student')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # --- ADD THESE TWO LINES ---
    is_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100), unique=True, nullable=True)
    # ---------------------------

    # Relationships (Keep your existing ones)
    student = db.relationship('Student', backref='user', uselist=False, cascade='all, delete-orphan')
    staff = db.relationship('Staff', backref='user', uselist=False, foreign_keys='Staff.user_id', cascade='all, delete-orphan')
    admin_staff = db.relationship('Staff', backref='admin', uselist=False, foreign_keys='Staff.admin_id')

    def __repr__(self):
        return f'<User {self.email}>'


class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)  # REMOVED unique=True to allow multiple students per user
    name = db.Column(db.String(100))
    details = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    documents = db.relationship('Document', backref='student', cascade='all, delete-orphan')
    submissions = db.relationship('Submission', backref='student', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Student {self.name}>'


class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False, index=True)
    file_url = db.Column(db.Text, nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Document {self.file_url}>'


class Submission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False, index=True)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = db.Column(db.String(20), default='pending', index=True)  # pending, approved, rejected

    # ✅ is_locked MUST be inside the class, before __table_args__
    is_locked = db.Column(db.Boolean, default=False, nullable=False)

    # ✅ __table_args__ must be at the end of the class
    __table_args__ = (
        db.CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",  # use string not column reference
            name='valid_status'
        ),
    )
    
    def __repr__(self):
        return f'<Submission {self.status} for Student {self.student_id}>'


class Staff(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True, index=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Staff User {self.user_id} under Admin {self.admin_id}>'
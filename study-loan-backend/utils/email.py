from flask_mail import Message
from extensions import mail
import os

def send_email(to, subject, content):
    # Get sender from .env
    sender_email = os.getenv('MAIL_USERNAME')
    
    print(f"--- ATTEMPTING TO SEND EMAIL ---")
    print(f"From: {sender_email}")
    print(f"To: {to}")
    
    msg = Message(
        subject,
        recipients=[to],
        body=content,
        sender=sender_email
    )
    
    try:
        mail.send(msg)
        print("--- EMAIL SENT SUCCESSFULLY ---")
    except Exception as e:
        print(f"--- EMAIL FAILED: {e} ---")
        raise e
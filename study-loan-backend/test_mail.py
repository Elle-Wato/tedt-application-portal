import smtplib
import os
from dotenv import load_dotenv

load_dotenv()

# Manually testing the connection
try:
    server = smtplib.SMTP('smtp.gmail.com', 465)
    server.starttls()
    # Replace os.getenv with your actual password string just for this 10-second test
    server.login('elimishatrust2@gmail.com', os.getenv('MAIL_PASSWORD'))
    print("✅ SUCCESS: The credentials work!")
    server.quit()
except Exception as e:
    print(f"❌ FAILED: {e}")
from dotenv import load_dotenv
import os

load_dotenv()
print(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")
print(f"JWT_SECRET_KEY: {os.getenv('JWT_SECRET_KEY')}")
print(f"Current working directory: {os.getcwd()}")
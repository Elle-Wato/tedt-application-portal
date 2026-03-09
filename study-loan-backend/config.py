import os
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
import cloudinary.api

load_dotenv()  # Load .env

class Config:
    SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'fallback_secret')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'fallback_jwt')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    
    # Add connection options for Neon SSL and stability
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,  # Test connections before use to avoid stale connections
        'pool_recycle': 300,    # Recycle connections every 5 minutes to prevent timeouts
        'connect_args': {'sslmode': 'require'}  # Force SSL for Neon
    }

    # Add this to catch issues early
    if not SQLALCHEMY_DATABASE_URI:
        raise ValueError(f"DATABASE_URL not found in .env. Loaded value: {os.getenv('DATABASE_URL')}. Check .env file.")
    
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)
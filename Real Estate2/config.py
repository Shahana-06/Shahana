"""
Configuration file for Real Estate Application
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Application configuration"""
    
    # API Configuration
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", "8000"))
    API_BASE_URL = os.getenv("API_BASE_URL", f"http://localhost:{API_PORT}")
    
    # Firebase Configuration
    FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")
    
    # Application Settings
    APP_NAME = "Real Estate Finder"
    APP_VERSION = "1.0.0"
    
    # Scoring Algorithm Weights
    WEIGHT_PRICE = 0.3
    WEIGHT_AMENITY = 0.3
    WEIGHT_LOCATION = 0.2
    WEIGHT_COMMUNITY = 0.2
    
    # Search Settings
    MAX_SEARCH_RESULTS = 10
    
    # Security Settings
    PASSWORD_MIN_LENGTH = 6
    
    # User Roles
    ROLE_PROPERTY_MANAGER = "property_manager"
    ROLE_PROPERTY_SEEKER = "property_seeker"
    
    @classmethod
    def validate(cls):
        """Validate configuration"""
        if not os.path.exists(cls.FIREBASE_CREDENTIALS_PATH):
            raise FileNotFoundError(
                f"Firebase credentials file not found: {cls.FIREBASE_CREDENTIALS_PATH}"
            )
        
        # Validate weights sum to 1.0
        total_weight = (
            cls.WEIGHT_PRICE + 
            cls.WEIGHT_AMENITY + 
            cls.WEIGHT_LOCATION + 
            cls.WEIGHT_COMMUNITY
        )
        if abs(total_weight - 1.0) > 0.01:
            raise ValueError(
                f"Scoring weights must sum to 1.0, got {total_weight}"
            )

# Create config instance
config = Config()

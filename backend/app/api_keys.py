"""
api_keys.py
-----------
Manages user API keys with encryption and storage.
Handles Groq API key validation and persistence.
"""

import os
import json
from pathlib import Path
from cryptography.fernet import Fernet
from typing import Optional

# Create API keys storage directory
API_KEYS_DIR = Path(__file__).resolve().parent.parent / "user_api_keys"
API_KEYS_DIR.mkdir(exist_ok=True)

# Encryption key - in production, load from environment
ENCRYPTION_KEY = os.getenv("API_KEY_ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    # Generate a new key if not provided (dev environment)
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    print(f"⚠️  Generated temporary encryption key: {ENCRYPTION_KEY}")
    print("   ⚠️  In production, set API_KEY_ENCRYPTION_KEY environment variable")

cipher = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)


def _get_user_keys_file(user_email: str) -> Path:
    """Get the file path for a user's API keys"""
    safe_email = user_email.replace("@", "_").replace(".", "_")
    return API_KEYS_DIR / f"{safe_email}_keys.json"


def _encrypt_key(key: str) -> str:
    """Encrypt an API key"""
    return cipher.encrypt(key.encode()).decode()


def _decrypt_key(encrypted_key: str) -> str:
    """Decrypt an API key"""
    try:
        return cipher.decrypt(encrypted_key.encode()).decode()
    except Exception as e:
        raise ValueError(f"Failed to decrypt API key: {str(e)}")


def save_api_key(user_email: str, provider: str, api_key: str) -> bool:
    """
    Save an encrypted API key for a user
    
    Args:
        user_email: User's email address
        provider: API provider name (e.g., "groq")
        api_key: The API key to save
    
    Returns:
        True if successful
    """
    try:
        keys_file = _get_user_keys_file(user_email)
        
        # Load existing keys
        keys_data = {}
        if keys_file.exists():
            with open(keys_file, 'r') as f:
                keys_data = json.load(f)
        
        # Trim whitespace and encrypt the key
        api_key = api_key.strip()
        keys_data[provider] = _encrypt_key(api_key)
        
        # Write to file
        with open(keys_file, 'w') as f:
            json.dump(keys_data, f)
        
        return True
    except Exception as e:
        print(f"Error saving API key: {str(e)}")
        return False


def get_api_key(user_email: str, provider: str) -> Optional[str]:
    """
    Retrieve and decrypt an API key for a user
    
    Args:
        user_email: User's email address
        provider: API provider name (e.g., "groq")
    
    Returns:
        Decrypted API key or None if not found
    """
    try:
        keys_file = _get_user_keys_file(user_email)
        
        if not keys_file.exists():
            return None
        
        with open(keys_file, 'r') as f:
            keys_data = json.load(f)
        
        encrypted_key = keys_data.get(provider)
        if not encrypted_key:
            return None
        
        return _decrypt_key(encrypted_key)
    except Exception as e:
        print(f"Error retrieving API key: {str(e)}")
        return None


def delete_api_key(user_email: str, provider: str) -> bool:
    """
    Delete an API key for a user
    
    Args:
        user_email: User's email address
        provider: API provider name (e.g., "groq")
    
    Returns:
        True if successful
    """
    try:
        keys_file = _get_user_keys_file(user_email)
        
        if not keys_file.exists():
            return False
        
        with open(keys_file, 'r') as f:
            keys_data = json.load(f)
        
        if provider in keys_data:
            del keys_data[provider]
            
            with open(keys_file, 'w') as f:
                json.dump(keys_data, f)
        
        return True
    except Exception as e:
        print(f"Error deleting API key: {str(e)}")
        return False


async def validate_groq_api_key(api_key: str) -> bool:
    """
    Validate Groq API key by making a test API call
    
    Args:
        api_key: The API key to validate
    
    Returns:
        True if valid, False otherwise
    """
    try:
        from groq import Groq
        
        client = Groq(api_key=api_key)
        
        # Make a simple test call
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": "test"}],
            model="mixtral-8x7b-32768",
            max_tokens=1,
        )
        
        return True
    except Exception as e:
        print(f"Groq API key validation failed: {str(e)}")
        return False


def has_api_key(user_email: str, provider: str) -> bool:
    """
    Check if user has an API key stored
    
    Args:
        user_email: User's email address
        provider: API provider name (e.g., "groq")
    
    Returns:
        True if API key exists
    """
    try:
        keys_file = _get_user_keys_file(user_email)
        
        if not keys_file.exists():
            return False
        
        with open(keys_file, 'r') as f:
            keys_data = json.load(f)
        
        return provider in keys_data
    except Exception:
        return False

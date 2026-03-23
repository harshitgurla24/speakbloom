"""
api_keys.py
-----------
Manages user API keys with encryption and persistent database storage.
Handles Groq API key validation and persistence.
"""

import os
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from cryptography.fernet import Fernet
from sqlalchemy import create_engine, delete, select
from sqlalchemy import String, Text, DateTime, UniqueConstraint
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker


# Encryption key - in production, load from environment
ENCRYPTION_KEY = os.getenv("API_KEY_ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    print(f"⚠️  Generated temporary encryption key: {ENCRYPTION_KEY}")
    print("   ⚠️  In production, set API_KEY_ENCRYPTION_KEY environment variable")

cipher = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)


def _resolve_database_url() -> str:
    configured = os.getenv("DATABASE_URL", "").strip()
    if configured:
        if configured.startswith("postgres://"):
            return configured.replace("postgres://", "postgresql+psycopg://", 1)
        if configured.startswith("postgresql://") and "+" not in configured.split("://", 1)[0]:
            return configured.replace("postgresql://", "postgresql+psycopg://", 1)
        return configured

    sqlite_path = Path(__file__).resolve().parent.parent / "data" / "app.db"
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    print("⚠️  DATABASE_URL is not set. Falling back to local SQLite database.")
    return f"sqlite:///{sqlite_path.as_posix()}"


DATABASE_URL = _resolve_database_url()
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)
LEGACY_API_KEYS_DIR = Path(__file__).resolve().parent.parent / "user_api_keys"


class Base(DeclarativeBase):
    pass


class UserApiKey(Base):
    __tablename__ = "user_api_keys"
    __table_args__ = (
        UniqueConstraint("user_email", "provider", name="uq_user_provider"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_email: Mapped[str] = mapped_column(String(320), index=True)
    provider: Mapped[str] = mapped_column(String(64), index=True)
    encrypted_key: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


Base.metadata.create_all(bind=engine)


def _encrypt_key(key: str) -> str:
    """Encrypt an API key"""
    return cipher.encrypt(key.encode()).decode()


def _decrypt_key(encrypted_key: str) -> str:
    """Decrypt an API key"""
    try:
        return cipher.decrypt(encrypted_key.encode()).decode()
    except Exception as e:
        raise ValueError(f"Failed to decrypt API key: {str(e)}")


def _legacy_user_keys_file(user_email: str) -> Path:
    safe_email = user_email.replace("@", "_").replace(".", "_")
    return LEGACY_API_KEYS_DIR / f"{safe_email}_keys.json"


def _get_legacy_api_key(user_email: str, provider: str) -> Optional[str]:
    keys_file = _legacy_user_keys_file(user_email)
    if not keys_file.exists():
        return None

    try:
        with open(keys_file, "r", encoding="utf-8") as f:
            keys_data = json.load(f)
        encrypted_key = keys_data.get(provider)
        if not encrypted_key:
            return None
        return _decrypt_key(encrypted_key)
    except Exception as e:
        print(f"Error reading legacy API key file: {str(e)}")
        return None


def _delete_legacy_api_key(user_email: str, provider: str) -> None:
    keys_file = _legacy_user_keys_file(user_email)
    if not keys_file.exists():
        return

    try:
        with open(keys_file, "r", encoding="utf-8") as f:
            keys_data = json.load(f)

        if provider in keys_data:
            del keys_data[provider]

            if keys_data:
                with open(keys_file, "w", encoding="utf-8") as f:
                    json.dump(keys_data, f)
            else:
                keys_file.unlink(missing_ok=True)
    except Exception as e:
        print(f"Error deleting legacy API key file: {str(e)}")


def save_api_key(user_email: str, provider: str, api_key: str) -> bool:
    """
    Save an encrypted API key for a user
    """
    try:
        api_key = api_key.strip()
        now = datetime.now(timezone.utc)

        with SessionLocal() as session:
            existing = session.execute(
                select(UserApiKey).where(
                    UserApiKey.user_email == user_email,
                    UserApiKey.provider == provider,
                )
            ).scalar_one_or_none()

            if existing:
                existing.encrypted_key = _encrypt_key(api_key)
                existing.updated_at = now
            else:
                session.add(
                    UserApiKey(
                        user_email=user_email,
                        provider=provider,
                        encrypted_key=_encrypt_key(api_key),
                        created_at=now,
                        updated_at=now,
                    )
                )

            session.commit()

        _delete_legacy_api_key(user_email, provider)
        return True
    except (SQLAlchemyError, ValueError) as e:
        print(f"Error saving API key: {str(e)}")
        return False


def get_api_key(user_email: str, provider: str) -> Optional[str]:
    """
    Retrieve and decrypt an API key for a user
    """
    try:
        with SessionLocal() as session:
            record = session.execute(
                select(UserApiKey.encrypted_key).where(
                    UserApiKey.user_email == user_email,
                    UserApiKey.provider == provider,
                )
            ).scalar_one_or_none()

        if not record:
            legacy_key = _get_legacy_api_key(user_email, provider)
            if not legacy_key:
                return None

            # Auto-migrate legacy key to DB on first read
            save_api_key(user_email, provider, legacy_key)
            return legacy_key

        return _decrypt_key(record)
    except (SQLAlchemyError, ValueError) as e:
        print(f"Error retrieving API key: {str(e)}")
        return None


def delete_api_key(user_email: str, provider: str) -> bool:
    """
    Delete an API key for a user
    """
    try:
        deleted_db = False
        with SessionLocal() as session:
            result = session.execute(
                delete(UserApiKey).where(
                    UserApiKey.user_email == user_email,
                    UserApiKey.provider == provider,
                )
            )
            session.commit()
            deleted_db = result.rowcount > 0

        legacy_before = _get_legacy_api_key(user_email, provider)
        _delete_legacy_api_key(user_email, provider)
        return deleted_db or legacy_before is not None
    except SQLAlchemyError as e:
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
        with SessionLocal() as session:
            record = session.execute(
                select(UserApiKey.id).where(
                    UserApiKey.user_email == user_email,
                    UserApiKey.provider == provider,
                )
            ).scalar_one_or_none()
        if record is not None:
            return True

        # Legacy fallback for users not yet migrated
        return _get_legacy_api_key(user_email, provider) is not None
    except SQLAlchemyError:
        return False

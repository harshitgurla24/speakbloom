"""
models.py
---------
SQLAlchemy database models for user statistics and admin data.
"""

import os
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from sqlalchemy import String, DateTime, Integer, Float, Index


def _resolve_database_url() -> str:
    """Resolve database URL from environment or use SQLite fallback"""
    configured = os.getenv("DATABASE_URL", "").strip()
    if configured:
        if configured.startswith("postgres://"):
            return configured.replace("postgres://", "postgresql+psycopg://", 1)
        if configured.startswith("postgresql://") and "+" not in configured.split("://", 1)[0]:
            return configured.replace("postgresql://", "postgresql+psycopg://", 1)
        return configured

    sqlite_path = Path(__file__).resolve().parent.parent / "data" / "app.db"
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{sqlite_path.as_posix()}"


DATABASE_URL = _resolve_database_url()
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


class UserStats(Base):
    """Model to store user statistics and progress"""
    __tablename__ = "user_stats"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    user_name: Mapped[str] = mapped_column(String(255), nullable=True)
    user_picture: Mapped[str] = mapped_column(String(500), nullable=True)
    
    # Score and level tracking
    total_score: Mapped[float] = mapped_column(Float, default=0.0)
    current_level: Mapped[str] = mapped_column(String(20), default="beginner")  # beginner, intermediate, advanced
    total_sessions: Mapped[int] = mapped_column(Integer, default=0)
    
    # Language-specific tracking (stored as comma-separated)
    languages_attempted: Mapped[str] = mapped_column(String(500), default="")
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
    last_activity: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    __table_args__ = (
        Index('idx_user_email', 'user_email'),
        Index('idx_created_at', 'created_at'),
        Index('idx_current_level', 'current_level'),
    )


class SessionHistory(Base):
    """Model to store individual practice session history"""
    __tablename__ = "session_history"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_email: Mapped[str] = mapped_column(String(320), index=True)
    
    language: Mapped[str] = mapped_column(String(50))
    level: Mapped[str] = mapped_column(String(20))  # easy, medium, hard
    text_length: Mapped[str] = mapped_column(String(20))  # short, medium, long
    
    # Performance metrics
    accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    fluency: Mapped[float] = mapped_column(Float, default=0.0)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True
    )
    
    __table_args__ = (
        Index('idx_user_email', 'user_email'),
        Index('idx_created_at', 'created_at'),
        Index('idx_language', 'language'),
    )


class AdminUser(Base):
    """Model to store admin users"""
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    admin_email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    
    __table_args__ = (
        Index('idx_admin_email', 'admin_email'),
    )


# Create all tables
Base.metadata.create_all(bind=engine)

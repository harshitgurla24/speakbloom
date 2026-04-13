"""
admin.py
--------
Admin panel routes and utilities.
Handles admin user management and statistics retrieval.
"""

import os
from datetime import datetime, timezone
from typing import Any

from fastapi import Depends, HTTPException
from pydantic import BaseModel

from app.models import SessionLocal, UserStats, SessionHistory, AdminUser


class UserStatsResponse(BaseModel):
    user_email: str
    user_name: str | None
    user_picture: str | None
    total_score: float
    current_level: str
    total_sessions: int
    languages_attempted: str
    created_at: datetime
    updated_at: datetime
    last_activity: datetime | None


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users_today: int
    active_users_week: int
    average_score: float
    total_sessions: int
    users: list[UserStatsResponse]


class UpdateUserStatsRequest(BaseModel):
    accuracy: float
    fluency: float
    score: float
    language: str
    level: str
    text_length: str
    duration_seconds: float


class AdminUserRegistration(BaseModel):
    admin_email: str


def is_admin(admin_email: str) -> bool:
    """Check if user is an admin"""
    ADMIN_EMAILS = os.getenv("ADMIN_EMAILS", "").strip().split(",")
    ADMIN_EMAILS = [email.strip() for email in ADMIN_EMAILS if email.strip()]
    
    print(f"[is_admin] Checking email: '{admin_email}'")
    print(f"[is_admin] Admin emails list: {ADMIN_EMAILS}")
    
    if not ADMIN_EMAILS:
        print(f"[is_admin] ADMIN_EMAILS is empty!")
        return False
    
    result = admin_email in ADMIN_EMAILS
    print(f"[is_admin] Is admin? {result}")
    return result


def get_admin_user(admin_email: str) -> bool:
    """Verify admin user from database"""
    try:
        with SessionLocal() as session:
            admin = session.query(AdminUser).filter(
                AdminUser.admin_email == admin_email,
                AdminUser.is_active == True
            ).first()
            return admin is not None
    except Exception as e:
        print(f"Error checking admin user: {str(e)}")
        return False


def update_user_stats(
    user_email: str,
    user_name: str | None,
    user_picture: str | None,
    accuracy: float,
    fluency: float,
    score: float,
    language: str,
    level: str,
    text_length: str,
    duration_seconds: float,
) -> bool:
    """
    Update user statistics and session history
    Called after each practice session
    """
    try:
        with SessionLocal() as session:
            # Update or create user stats
            user_stats = session.query(UserStats).filter(
                UserStats.user_email == user_email
            ).first()
            
            now = datetime.now(timezone.utc)
            
            if user_stats:
                user_stats.total_score += score
                user_stats.total_sessions += 1
                user_stats.updated_at = now
                user_stats.last_activity = now
                
                # Update languages attempted
                if language not in user_stats.languages_attempted:
                    if user_stats.languages_attempted:
                        user_stats.languages_attempted += f",{language}"
                    else:
                        user_stats.languages_attempted = language
                
                # Update level based on performance
                avg_accuracy = (user_stats.total_score / user_stats.total_sessions) if user_stats.total_sessions > 0 else 0
                if avg_accuracy >= 80:
                    user_stats.current_level = "advanced"
                elif avg_accuracy >= 60:
                    user_stats.current_level = "intermediate"
                else:
                    user_stats.current_level = "beginner"
            else:
                user_stats = UserStats(
                    user_email=user_email,
                    user_name=user_name,
                    user_picture=user_picture,
                    total_score=score,
                    total_sessions=1,
                    languages_attempted=language,
                    current_level="beginner",
                    created_at=now,
                    updated_at=now,
                    last_activity=now,
                )
                session.add(user_stats)
            
            # Add session history
            session_history = SessionHistory(
                user_email=user_email,
                language=language,
                level=level,
                text_length=text_length,
                accuracy=accuracy,
                fluency=fluency,
                score=score,
                duration_seconds=duration_seconds,
                created_at=now,
            )
            session.add(session_history)
            
            session.commit()
            return True
    except Exception as e:
        print(f"Error updating user stats: {str(e)}")
        return False


def create_or_update_user_stats(user_email: str, user_name: str | None, user_picture: str | None) -> bool:
    """
    Create user stats entry if it doesn't exist
    Called on user first login
    """
    try:
        with SessionLocal() as session:
            existing = session.query(UserStats).filter(
                UserStats.user_email == user_email
            ).first()
            
            if not existing:
                now = datetime.now(timezone.utc)
                user_stats = UserStats(
                    user_email=user_email,
                    user_name=user_name,
                    user_picture=user_picture,
                    created_at=now,
                    updated_at=now,
                )
                session.add(user_stats)
                session.commit()
            return True
    except Exception as e:
        print(f"Error creating user stats: {str(e)}")
        return False


def get_all_users_stats() -> list[UserStatsResponse]:
    """
    Get all users' statistics (admin only)
    """
    try:
        with SessionLocal() as session:
            users = session.query(UserStats).order_by(UserStats.created_at.desc()).all()
            return [
                UserStatsResponse(
                    user_email=user.user_email,
                    user_name=user.user_name,
                    user_picture=user.user_picture,
                    total_score=user.total_score,
                    current_level=user.current_level,
                    total_sessions=user.total_sessions,
                    languages_attempted=user.languages_attempted,
                    created_at=user.created_at,
                    updated_at=user.updated_at,
                    last_activity=user.last_activity,
                )
                for user in users
            ]
    except Exception as e:
        print(f"Error getting users stats: {str(e)}")
        return []


def get_admin_dashboard_stats() -> dict[str, Any]:
    """
    Get dashboard statistics for admin panel
    """
    try:
        with SessionLocal() as session:
            total_users = session.query(UserStats).count()
            
            # Active users today
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            active_today = session.query(UserStats).filter(
                UserStats.last_activity >= today_start
            ).count()
            
            # Active users this week
            from datetime import timedelta
            week_start = datetime.now(timezone.utc) - timedelta(days=7)
            active_week = session.query(UserStats).filter(
                UserStats.last_activity >= week_start
            ).count()
            
            # Average score
            avg_score_result = session.query(UserStats).with_entities(
                session.query(UserStats.total_score).filter(UserStats.total_sessions > 0).count()
            ).first()
            
            # Total sessions
            total_sessions = session.query(SessionHistory).count()
            
            # Get all users stats
            users = session.query(UserStats).order_by(UserStats.created_at.desc()).all()
            users_response = [
                UserStatsResponse(
                    user_email=user.user_email,
                    user_name=user.user_name,
                    user_picture=user.user_picture,
                    total_score=user.total_score,
                    current_level=user.current_level,
                    total_sessions=user.total_sessions,
                    languages_attempted=user.languages_attempted,
                    created_at=user.created_at,
                    updated_at=user.updated_at,
                    last_activity=user.last_activity,
                )
                for user in users
            ]
            
            # Calculate average score
            avg_score = 0.0
            if users_response:
                total = sum(user.total_score for user in users_response)
                count = len(users_response)
                avg_score = total / count if count > 0 else 0.0
            
            return {
                "total_users": total_users,
                "active_users_today": active_today,
                "active_users_week": active_week,
                "average_score": round(avg_score, 2),
                "total_sessions": total_sessions,
                "users": users_response,
            }
    except Exception as e:
        print(f"Error getting dashboard stats: {str(e)}")
        return {
            "total_users": 0,
            "active_users_today": 0,
            "active_users_week": 0,
            "average_score": 0.0,
            "total_sessions": 0,
            "users": [],
        }

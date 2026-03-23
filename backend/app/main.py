"""
main.py
-------
FastAPI application entry point.

Run with:
    uvicorn app.main:app --reload --port 8000
"""

from dotenv import load_dotenv
from pathlib import Path
import os
from datetime import datetime, timedelta, timezone
from typing import Any

# Load .env from the backend/ folder regardless of where uvicorn is launched from
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from jose import JWTError, jwt

from app.text_generator import generate_text
from app.pronunciation import analyze_pronunciation
from app.api_keys import save_api_key, get_api_key, delete_api_key, has_api_key, validate_groq_api_key

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AI Pronunciation Practice API",
    version="1.0.0",
    description="Backend for the Multilanguage Pronunciation and Listening Practice Tool.",
)

# Allow requests from any localhost port (Vite may use 5173, 5174, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

SUPPORTED_LANGUAGES = {
    "en-US",
    "hi-IN",
    "mr-IN",
    "gu-IN",
    "bn-IN",
    "ar-SA",
    "te-IN",
    "or-IN",
    "ta-IN",
    "pa-IN",
    "sa-IN",
    "ml-IN",
}
SUPPORTED_LENGTHS = {"short", "medium", "long"}
SUPPORTED_LEVELS  = {"easy", "medium", "hard"}

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
APP_JWT_SECRET = os.getenv("APP_JWT_SECRET", "dev-change-me")
APP_JWT_ALGORITHM = os.getenv("APP_JWT_ALGORITHM", "HS256")
APP_JWT_EXPIRE_HOURS = int(os.getenv("APP_JWT_EXPIRE_HOURS", "24"))


class AuthUser(BaseModel):
    sub: str
    email: str
    name: str | None = None
    picture: str | None = None


class GoogleAuthRequest(BaseModel):
    credential: str = Field(..., min_length=20)


class AuthSessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: AuthUser


class GenerateTextRequest(BaseModel):
    language: str = Field(..., example="en-US")
    length: str   = Field(..., example="medium")
    level: str    = Field("easy", example="easy")


class GenerateTextResponse(BaseModel):
    text: str
    language: str
    length: str
    level: str


class AnalyzePronunciationRequest(BaseModel):
    original_text: str = Field(..., min_length=1)
    spoken_text: str = Field(..., min_length=0)
    time_taken: float = Field(..., ge=0, description="Recording duration in seconds")


class SaveApiKeyRequest(BaseModel):
    api_key: str = Field(..., min_length=1, description="The API key to save")
    provider: str = Field(default="groq", description="API provider (e.g., groq)")


class ApiKeyResponse(BaseModel):
    success: bool
    message: str
    has_api_key: bool


class ValidateApiKeyRequest(BaseModel):
    api_key: str = Field(..., min_length=1, description="The API key to validate")


class ValidateApiKeyResponse(BaseModel):
    valid: bool
    message: str


def _create_access_token(user: AuthUser) -> tuple[str, int]:
    expires_in = APP_JWT_EXPIRE_HOURS * 60 * 60
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=expires_in)

    payload: dict[str, Any] = {
        "type": "access",
        "sub": user.sub,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, APP_JWT_SECRET, algorithm=APP_JWT_ALGORITHM)
    return token, expires_in


def _decode_access_token(token: str) -> AuthUser:
    try:
        payload = jwt.decode(token, APP_JWT_SECRET, algorithms=[APP_JWT_ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired session token.") from exc

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid session token type.")

    sub = payload.get("sub")
    email = payload.get("email")
    if not sub or not email:
        raise HTTPException(status_code=401, detail="Invalid session token payload.")

    return AuthUser(
        sub=sub,
        email=email,
        name=payload.get("name"),
        picture=payload.get("picture"),
    )


def get_current_user(authorization: str | None = Header(default=None)) -> AuthUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token is missing.")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token is missing.")

    return _decode_access_token(token)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/")
def root():
    return {"message": "AI Pronunciation Practice API is running."}


@app.post("/auth/google", response_model=AuthSessionResponse)
def auth_google(request: GoogleAuthRequest):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Google auth is not configured on server. Missing GOOGLE_CLIENT_ID.",
        )

    try:
        idinfo = google_id_token.verify_oauth2_token(
            request.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid Google credential.") from exc

    if not idinfo.get("email_verified"):
        raise HTTPException(status_code=401, detail="Google account email is not verified.")

    user = AuthUser(
        sub=idinfo.get("sub", ""),
        email=idinfo.get("email", ""),
        name=idinfo.get("name"),
        picture=idinfo.get("picture"),
    )

    if not user.sub or not user.email:
        raise HTTPException(status_code=401, detail="Could not read Google profile information.")

    access_token, expires_in = _create_access_token(user)
    return AuthSessionResponse(
        access_token=access_token,
        expires_in=expires_in,
        user=user,
    )


@app.get("/auth/me", response_model=AuthUser)
def auth_me(current_user: AuthUser = Depends(get_current_user)):
    return current_user


@app.post("/generate-text", response_model=GenerateTextResponse)
def generate_text_endpoint(
    request: GenerateTextRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Generate a practice paragraph for the given language, length, and difficulty level.
    
    REQUIRES user's stored Groq API key. Will fail if user hasn't added their API key.
    Users must add their API key from https://console.groq.com/keys

    - **language**: BCP-47 code (e.g. en-US, hi-IN, mr-IN, gu-IN, bn-IN, ar-SA, te-IN, or-IN, ta-IN, pa-IN, sa-IN, ml-IN)
    - **length**: short | medium | long
    - **level**: easy | medium | hard
    """
    if request.language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language '{request.language}'. "
                   f"Supported: {sorted(SUPPORTED_LANGUAGES)}",
        )
    if request.length not in SUPPORTED_LENGTHS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported length '{request.length}'. "
                   f"Supported: {sorted(SUPPORTED_LENGTHS)}",
        )
    if request.level not in SUPPORTED_LEVELS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported level '{request.level}'. "
                   f"Supported: {sorted(SUPPORTED_LEVELS)}",
        )

    # Get user's stored API key
    user_api_key = get_api_key(current_user.email, "groq")
    
    # API key is REQUIRED
    if not user_api_key:
        raise HTTPException(
            status_code=403,
            detail="Groq API key not found. Please add your API key from https://console.groq.com/keys"
        )
    
    print(f"[/generate-text] Generating text for user: {current_user.email}")
    print(f"[/generate-text] API key length: {len(user_api_key)} chars")
    
    try:
        # Generate text using user's API key only
        text = generate_text(
            language=request.language, 
            length=request.length, 
            level=request.level,
            api_key=user_api_key
        )
        return GenerateTextResponse(text=text, language=request.language, length=request.length, level=request.level)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        error_msg = str(e)
        print(f"[/generate-text] Error: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Failed to generate text: {error_msg}")


@app.post("/analyze-pronunciation")
def analyze_pronunciation_endpoint(
    request: AnalyzePronunciationRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Compare the spoken transcript against the original text and return
    accuracy, wrong words, speaking speed, and a fluency rating.

    - **original_text**: The reference paragraph
    - **spoken_text**: Transcript from speech recognition
    - **time_taken**: Duration of the recording in seconds
    """
    if not request.original_text.strip():
        raise HTTPException(status_code=400, detail="original_text must not be empty.")

    result = analyze_pronunciation(
        original_text=request.original_text,
        spoken_text=request.spoken_text,
        time_taken=request.time_taken,
    )
    return result


# ---------------------------------------------------------------------------
# API Key Management Endpoints
# ---------------------------------------------------------------------------

@app.post("/api-key/save", response_model=ApiKeyResponse)
def save_api_key_endpoint(
    request: SaveApiKeyRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Save or update a user's API key (encrypted storage)
    
    - **api_key**: The API key to save
    - **provider**: API provider name (default: groq)
    """
    if not request.api_key.strip():
        raise HTTPException(status_code=400, detail="API key cannot be empty.")
    
    success = save_api_key(current_user.email, request.provider, request.api_key)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save API key.")
    
    return ApiKeyResponse(
        success=True,
        message=f"API key for {request.provider} saved successfully",
        has_api_key=True
    )


@app.post("/api-key/validate", response_model=ValidateApiKeyResponse)
async def validate_api_key_endpoint(
    request: ValidateApiKeyRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Validate a Groq API key before saving
    """
    if not request.api_key.strip():
        raise HTTPException(status_code=400, detail="API key cannot be empty.")
    
    valid = await validate_groq_api_key(request.api_key)
    
    return ValidateApiKeyResponse(
        valid=valid,
        message="API key is valid" if valid else "Invalid API key or failed to validate"
    )


@app.get("/api-key/status")
def get_api_key_status(
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Check if user has an API key saved (without retrieving it)
    """
    has_key = has_api_key(current_user.email, "groq")
    
    return {
        "has_api_key": has_key,
        "provider": "groq",
        "message": "API key is set" if has_key else "No API key set"
    }


@app.delete("/api-key/delete")
def delete_api_key_endpoint(
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Delete user's stored API key
    """
    success = delete_api_key(current_user.email, "groq")
    
    return {
        "success": success,
        "message": "API key deleted successfully" if success else "No API key to delete"
    }

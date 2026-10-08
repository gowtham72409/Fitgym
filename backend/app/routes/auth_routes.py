import time
import hashlib
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user
from app.firestore import get_document, save_document, list_documents

router = APIRouter(prefix="/api/auth", tags=["auth"])

# In-memory store for registered users passwords (email -> hashed_pw)
USER_PASSWORDS: Dict[str, str] = {}

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginPasswordRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None

class VerifyRequest(BaseModel):
    email: str
    code: str

@router.post("/register")
async def register_account(req: RegisterRequest):
    """
    Registers a new user with Name, Email, and Password.
    CRITICAL REQUIREMENT: Does NOT log the user in immediately.
    Returns success message so frontend redirects user to Sign In page.
    """
    clean_email = req.email.strip().lower()
    clean_name = req.name.strip()
    pw = req.password.strip()

    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if len(pw) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
    if not clean_name:
        clean_name = clean_email.split("@")[0].capitalize() or "Gowtham"
    if clean_name.lower() == "athlete":
        clean_name = "Gowtham"

    user_id = f"user_{abs(hash(clean_email)) % 1000000}"

    # Check if user already exists
    existing = get_document("users", user_id, user_id=user_id)
    if existing and clean_email in USER_PASSWORDS:
        # User already registered
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please sign in.")

    # Store hashed password
    USER_PASSWORDS[clean_email] = hash_pw(pw)

    user_record = {
        "uid": user_id,
        "user_id": user_id,
        "name": clean_name,
        "email": clean_email,
        "photo_url": "",
        "xp": 125,
        "level": 2,
        "streak": 1,
        "created_at": time.time()
    }
    save_document("users", user_id, user_record)

    # Initial profile setup
    profile = {
        "user_id": user_id,
        "name": clean_name,
        "email": clean_email,
        "age": 26,
        "gender": "male",
        "weight_kg": 78.5,
        "height_cm": 175,
        "target_weight_kg": 72.0,
        "goal": "Weight Loss & Muscle Tone",
        "activity_level": "moderate",
        "dietary_preference": "Non-Vegetarian",
        "streak": 1,
        "level": 2,
        "xp": 125,
        "bmi": 25.6,
        "daily_burn_target_kcal": 550,
        "daily_calorie_target": 2150,
        "onboarding_completed": True
    }
    save_document("fitness_profiles", user_id, profile)

    return {
        "status": "success",
        "message": "Account created successfully! Please sign in with your email and password."
    }

@router.post("/login-password")
@router.post("/login")
async def login_with_password(req: LoginPasswordRequest):
    """
    Direct login with Email and Password without email verification codes.
    Returns access_token on valid credentials.
    """
    clean_email = req.email.strip().lower()
    pw = req.password.strip()

    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Invalid email address.")
    if not pw:
        raise HTTPException(status_code=400, detail="Please enter your password.")

    user_id = f"user_{abs(hash(clean_email)) % 1000000}"

    # Verify password if user registered with password
    stored_hash = USER_PASSWORDS.get(clean_email)
    if stored_hash:
        if hash_pw(pw) != stored_hash:
            raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
    else:
        # If user registered in dev session or demo, accept password and record it
        USER_PASSWORDS[clean_email] = hash_pw(pw)

    user_record = get_document("users", user_id, user_id=user_id)
    if not user_record:
        user_name = clean_email.split("@")[0].capitalize() or "Gowtham"
        if user_name.lower() == "athlete":
            user_name = "Gowtham"
        user_record = {
            "uid": user_id,
            "user_id": user_id,
            "name": user_name,
            "email": clean_email,
            "photo_url": "",
            "xp": 125,
            "level": 2,
            "streak": 1
        }
        save_document("users", user_id, user_record)

    profile = get_document("fitness_profiles", user_id, user_id=user_id)
    if not profile:
        profile = {
            "user_id": user_id,
            "name": user_record.get("name", "Gowtham"),
            "email": clean_email,
            "age": 26,
            "gender": "male",
            "weight_kg": 78.5,
            "height_cm": 175,
            "target_weight_kg": 72.0,
            "goal": "Weight Loss & Muscle Tone",
            "activity_level": "moderate",
            "dietary_preference": "Non-Vegetarian",
            "streak": 1,
            "level": 2,
            "xp": 125,
            "bmi": 25.6,
            "daily_burn_target_kcal": 550,
            "daily_calorie_target": 2150,
            "onboarding_completed": True
        }
        save_document("fitness_profiles", user_id, profile)

    token = f"dev-token-{user_id}"

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": user_record,
        "profile": profile
    }

@router.post("/verify-token")
async def verify_token(user: dict = Depends(get_current_user)):
    """Verifies Bearer token and returns user status + onboarding completion status."""
    uid = user["uid"]
    profile = get_document("fitness_profiles", uid, user_id=uid)
    user_record = get_document("users", uid, user_id=uid)
    
    if not user_record:
        resolved = user.get("name") or "Gowtham"
        if resolved.lower() == "athlete":
            resolved = "Gowtham"
        user_record = {
            "uid": uid,
            "user_id": uid,
            "name": resolved,
            "email": user.get("email", ""),
            "photo_url": user.get("photo_url", ""),
            "xp": 125,
            "level": 2
        }
        save_document("users", uid, user_record)

    has_onboarded = profile is not None and bool(profile.get("onboarding_completed", False))

    return {
        "status": "authenticated",
        "user": user_record,
        "onboarding_completed": has_onboarded
    }

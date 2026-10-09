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

    user_id = f"user_{hashlib.sha256(clean_email.encode('utf-8')).hexdigest()[:12]}"

    # Check if user already exists
    existing = get_document("users", user_id, user_id=user_id)
    if existing and (existing.get("password_hash") or clean_email in USER_PASSWORDS):
        # User already registered
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please sign in.")

    # Store hashed password in memory and persistent user record
    hashed = hash_pw(pw)
    USER_PASSWORDS[clean_email] = hashed

    user_record = {
        "uid": user_id,
        "user_id": user_id,
        "name": clean_name,
        "email": clean_email,
        "password_hash": hashed,
        "photo_url": "",
        "xp": 0,
        "level": 1,
        "streak": 1,
        "created_at": time.time()
    }
    save_document("users", user_id, user_record)

    # Initial profile setup (Clean empty profile for new users)
    profile = {
        "user_id": user_id,
        "name": clean_name,
        "email": clean_email,
        "streak": 1,
        "level": 1,
        "xp": 0,
        "height_cm": None,
        "weight_kg": None,
        "current_weight_kg": None,
        "target_weight_kg": None,
        "bmi": None,
        "daily_burn_target_kcal": None,
        "daily_calorie_target": None,
        "daily_protein_target": None,
        "daily_carbs_target": None,
        "daily_fat_target": None,
        "daily_fiber_target": None,
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

    user_id = f"user_{hashlib.sha256(clean_email.encode('utf-8')).hexdigest()[:12]}"
    user_record = get_document("users", user_id, user_id=user_id)

    # Verify password if user registered with password
    stored_hash = None
    if user_record and user_record.get("password_hash"):
        stored_hash = user_record.get("password_hash")
    elif clean_email in USER_PASSWORDS:
        stored_hash = USER_PASSWORDS[clean_email]

    if stored_hash:
        if hash_pw(pw) != stored_hash:
            raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
    else:
        # First time login or demo user: record password for future logins
        hashed = hash_pw(pw)
        USER_PASSWORDS[clean_email] = hashed
        if user_record:
            user_record["password_hash"] = hashed
            save_document("users", user_id, user_record)

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
            "xp": 0,
            "level": 1,
            "streak": 1
        }
        save_document("users", user_id, user_record)

    profile = get_document("fitness_profiles", user_id, user_id=user_id)
    if not profile:
        profile = {
            "user_id": user_id,
            "name": user_record.get("name", "Gowtham"),
            "email": clean_email,
            "streak": 1,
            "level": 1,
            "xp": 0,
            "height_cm": None,
            "weight_kg": None,
            "current_weight_kg": None,
            "target_weight_kg": None,
            "bmi": None,
            "daily_burn_target_kcal": None,
            "daily_calorie_target": None,
            "daily_protein_target": None,
            "daily_carbs_target": None,
            "daily_fat_target": None,
            "daily_fiber_target": None,
            "onboarding_completed": True
        }
        save_document("fitness_profiles", user_id, profile)
    else:
        # If user has the old dummy numbers (78.5 and 175) or level 2, clean them up for new user experience
        if profile.get("weight_kg") == 78.5 and profile.get("height_cm") == 175:
            profile["height_cm"] = None
            profile["weight_kg"] = None
            profile["current_weight_kg"] = None
            profile["target_weight_kg"] = None
            profile["bmi"] = None
            profile["daily_burn_target_kcal"] = None
            profile["daily_calorie_target"] = None
            profile["daily_protein_target"] = None
            profile["daily_carbs_target"] = None
            profile["daily_fat_target"] = None
            profile["daily_fiber_target"] = None
            profile["level"] = 1
            profile["xp"] = 0
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

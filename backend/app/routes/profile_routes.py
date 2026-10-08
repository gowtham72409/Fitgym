from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.auth import get_current_user
from app.firestore import get_document, save_document
from app.ai import calculate_fitness_metrics

router = APIRouter(prefix="/api/profile", tags=["profile"])

@router.get("")
async def get_profile(user: dict = Depends(get_current_user)):
    """Fetch user profile, XP/level status, and calculated fitness metrics."""
    uid = user["uid"]
    profile = get_document("fitness_profiles", uid, user_id=uid)
    user_record = get_document("users", uid, user_id=uid) or {}

    if not profile:
        # Return empty template indicating onboarding needed
        return {
            "profile": None,
            "user": user_record,
            "metrics": None,
            "onboarding_completed": False
        }

    metrics = calculate_fitness_metrics(profile)
    # Merge both at top level so frontend profile?.name and profile?.level are directly accessible
    resolved_name = user_record.get("name") or profile.get("name") or "Gowtham"
    if resolved_name.lower() == "athlete":
        resolved_name = "Gowtham"

    merged = {
        **profile,
        **user_record,
        "profile": profile,
        "user": user_record,
        "metrics": metrics,
        "name": resolved_name,
        "onboarding_completed": bool(profile.get("onboarding_completed", False))
    }
    return merged

@router.put("")
@router.post("")
async def update_profile(data: Dict[str, Any], user: dict = Depends(get_current_user)):
    """Update user profile, recalculate metrics, and mark onboarding completed."""
    uid = user["uid"]
    existing = get_document("fitness_profiles", uid, user_id=uid) or {}
    
    # Securely enforce user_id
    data["user_id"] = uid
    if "starting_weight_kg" not in existing and "weight_kg" in data:
        data["starting_weight_kg"] = data["weight_kg"]

    merged = {**existing, **data}
    saved_profile = save_document("fitness_profiles", uid, merged)

    # If name/photo updated, update users collection too
    user_record = get_document("users", uid, user_id=uid) or {}
    if "name" in data:
        user_record["name"] = data["name"]
    if "photo_url" in data:
        user_record["photo_url"] = data["photo_url"]
    save_document("users", uid, user_record)

    metrics = calculate_fitness_metrics(saved_profile)
    return {
        "status": "success",
        "profile": saved_profile,
        "metrics": metrics
    }

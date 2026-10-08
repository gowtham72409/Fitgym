import time
from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.firestore import get_document, save_document, list_documents
from app.ai import calculate_fitness_metrics

router = APIRouter(prefix="/api", tags=["tracking"])

# =====================================================================
# DAILY CHECK-IN & WATER TRACKER
# =====================================================================
@router.post("/checkin")
async def log_checkin(data: Dict[str, Any], user: dict = Depends(get_current_user)):
    """Log daily check-in (mood, sleep, energy, water, steps). Awards +10 XP."""
    uid = user["uid"]
    today_date_str = datetime.now().strftime("%Y-%m-%d")
    checkin_id = f"{uid}_{today_date_str}"

    existing = get_document("daily_checkins", checkin_id, user_id=uid) or {}
    
    # Merge fields
    merged = {
        "id": checkin_id,
        "user_id": uid,
        "date_str": today_date_str,
        "mood": data.get("mood", existing.get("mood", "Good")),
        "sleep_hours": data.get("sleep_hours", existing.get("sleep_hours", 7.5)),
        "energy": data.get("energy", existing.get("energy", 8)),
        "water_ml": data.get("water_ml", existing.get("water_ml", 0)),
        "steps": data.get("steps", existing.get("steps", 0)),
        "notes": data.get("notes", existing.get("notes", "")),
        "created_at": existing.get("created_at", time.time()),
        "updated_at": time.time()
    }
    saved = save_document("daily_checkins", checkin_id, merged)

    # If first checkin today, award XP
    xp_awarded = 0
    if not existing:
        xp_awarded = 10
        user_record = get_document("users", uid, user_id=uid) or {"xp": 0, "level": 1}
        current_xp = user_record.get("xp", 0) + 10
        user_record["xp"] = current_xp
        user_record["level"] = (current_xp // 1000) + 1
        save_document("users", uid, user_record)

    return {
        "status": "success",
        "checkin": saved,
        "xp_awarded": xp_awarded
    }

@router.get("/checkin/history")
async def get_checkin_history(user: dict = Depends(get_current_user)):
    """Fetch past check-in logs."""
    uid = user["uid"]
    records = list_documents("daily_checkins", uid, limit=30)
    return {"history": records}

# =====================================================================
# WEIGHT TRACKING & PROGRESS GRAPH
# =====================================================================
@router.post("/weight")
async def log_weight(data: Dict[str, Any], user: dict = Depends(get_current_user)):
    """Logs weight measurement, recalculates BMI, updates profile, and awards +10 XP."""
    uid = user["uid"]
    weight_kg = float(data.get("weight_kg", 70.0))
    date_str = data.get("date_str", datetime.now().strftime("%Y-%m-%d"))
    weight_id = f"w_{uid}_{date_str}"

    weight_entry = {
        "id": weight_id,
        "user_id": uid,
        "weight_kg": weight_kg,
        "date_str": date_str,
        "notes": data.get("notes", ""),
        "created_at": time.time()
    }
    saved = save_document("weight_history", weight_id, weight_entry)

    # Update profile weight
    profile = get_document("fitness_profiles", uid, user_id=uid) or {}
    profile["weight_kg"] = weight_kg
    save_document("fitness_profiles", uid, profile)

    metrics = calculate_fitness_metrics(profile)

    # Award XP
    user_record = get_document("users", uid, user_id=uid) or {"xp": 0, "level": 1}
    current_xp = user_record.get("xp", 0) + 10
    user_record["xp"] = current_xp
    user_record["level"] = (current_xp // 1000) + 1
    save_document("users", uid, user_record)

    return {
        "status": "success",
        "entry": saved,
        "metrics": metrics,
        "xp_awarded": 10
    }

@router.get("/weight")
@router.get("/weight/history")
async def get_weight_history(user: dict = Depends(get_current_user)):
    """Returns chronological weight records for graph rendering and progress summary."""
    uid = user["uid"]
    records = list_documents("weight_history", uid, limit=60)
    records.sort(key=lambda x: x.get("date_str", ""))

    profile = get_document("fitness_profiles", uid, user_id=uid) or {}
    start_weight = float(profile.get("starting_weight_kg", profile.get("weight_kg", 70)))
    target_weight = float(profile.get("target_weight_kg", 65))
    current_weight = float(profile.get("weight_kg", start_weight))

    total_diff = abs(start_weight - target_weight)
    achieved_diff = abs(start_weight - current_weight)
    progress_pct = 100 if total_diff == 0 else min(100, round((achieved_diff / total_diff) * 100))

    metrics = calculate_fitness_metrics(profile)

    return {
        "history": records,
        "starting_weight_kg": start_weight,
        "current_weight_kg": current_weight,
        "target_weight_kg": target_weight,
        "progress_pct": progress_pct,
        "metrics": metrics
    }

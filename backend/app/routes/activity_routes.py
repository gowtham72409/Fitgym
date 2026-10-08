import time
import uuid
from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.firestore import get_document, save_document, list_documents, delete_document

router = APIRouter(tags=["activity"])

@router.get("/api/activities")
@router.get("/api/activity")
async def get_all_activities(user: dict = Depends(get_current_user)):
    """Fetch completed activity records for user."""
    uid = user["uid"]
    records = list_documents("activities", uid, limit=100)
    # Sort descending by date
    records.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return records

@router.post("/api/activities")
@router.post("/api/activity")
async def save_new_activity(data: Dict[str, Any], user: dict = Depends(get_current_user)):
    """Directly save an activity session record."""
    uid = user["uid"]
    activity_id = f"act_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now().isoformat()

    doc_data = {
        "id": activity_id,
        "user_id": uid,
        "activity_type": data.get("activity_type", "Walking"),
        "type": data.get("activity_type", "Walking"),
        "distance_km": float(data.get("distance_km", 0.0)),
        "duration_sec": int(data.get("duration_sec", 0)),
        "duration_seconds": int(data.get("duration_sec", 0)),
        "avg_speed_kmh": float(data.get("avg_speed_kmh", 0.0)),
        "calories": int(data.get("calories", 0)),
        "route_data": data.get("route_data", []),
        "created_at": now_iso,
        "start_time": time.time(),
        "completed": True
    }
    saved = save_document("activities", activity_id, doc_data)

    # Award +50 XP
    user_record = get_document("users", uid, user_id=uid) or {"xp": 0, "level": 1}
    current_xp = user_record.get("xp", 0) + 50
    new_level = (current_xp // 1000) + 1
    user_record["xp"] = current_xp
    user_record["level"] = new_level
    save_document("users", uid, user_record)

    return saved

@router.post("/api/activity/start")
async def start_activity(data: Dict[str, Any], user: dict = Depends(get_current_user)):
    """Initialize an outdoor GPS activity session."""
    uid = user["uid"]
    activity_id = f"act_{uuid.uuid4().hex[:12]}"
    
    activity_type = data.get("type", "Running")
    goal_type = data.get("goal_type", "Free")
    goal_value = data.get("goal_value", 0)

    doc_data = {
        "id": activity_id,
        "user_id": uid,
        "activity_type": activity_type,
        "type": activity_type,
        "status": "in_progress",
        "goal_type": goal_type,
        "goal_value": goal_value,
        "start_time": time.time(),
        "duration_sec": 0,
        "distance_km": 0.0,
        "calories": 0,
        "avg_speed_kmh": 0.0,
        "created_at": datetime.now().isoformat(),
        "completed": False
    }

    saved = save_document("activities", activity_id, doc_data)
    return {"status": "started", "activity": saved}

@router.put("/api/activities/{activity_id}")
@router.put("/api/activity/{activity_id}")
async def update_activity(activity_id: str, data: Dict[str, Any], user: dict = Depends(get_current_user)):
    """Edit activity record."""
    uid = user["uid"]
    existing = get_document("activities", activity_id, user_id=uid)
    if not existing:
        raise HTTPException(status_code=404, detail="Activity not found")

    existing.update(data)
    saved = save_document("activities", activity_id, existing)
    return {"status": "success", "activity": saved}

@router.delete("/api/activities/{activity_id}")
@router.delete("/api/activity/{activity_id}")
async def delete_activity(activity_id: str, user: dict = Depends(get_current_user)):
    """Deletes activity record."""
    uid = user["uid"]
    success = delete_document("activities", activity_id, uid)
    if not success:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"status": "deleted", "id": activity_id}

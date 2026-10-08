import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user
from app.firestore import get_document, save_document, list_documents, delete_document

router = APIRouter(tags=["challenges"])

DEFAULT_MISSIONS = [
    {
        "id": "mission-workout-90",
        "title": "Complete 90 min Workout",
        "description": "Finish your 90-minute workout quest.",
        "xp_reward": 50,
        "icon": "🏋️",
        "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop",
        "is_completed": False
    },
    {
        "id": "mission-eat-healthy",
        "title": "Eat 5 Healthy Meals",
        "description": "Complete five balanced meals from your plan.",
        "xp_reward": 30,
        "icon": "🥗",
        "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
        "is_completed": False
    },
    {
        "id": "mission-drink-water",
        "title": "Drink 3L Water",
        "description": "Stay hydrated through the day.",
        "xp_reward": 20,
        "icon": "💧",
        "is_completed": False
    },
    {
        "id": "mission-walk-steps",
        "title": "Walk 8,000 Steps",
        "description": "Build your movement streak.",
        "xp_reward": 20,
        "icon": "🚶",
        "is_completed": False
    }
]

class CompleteChallengeBody(BaseModel):
    id: Optional[str] = None
    challenge_id: Optional[str] = None

class ChallengeCreateBody(BaseModel):
    title: str
    description: str
    xp_reward: Optional[int] = 30
    category: Optional[str] = "General"

class ChallengeUpdateBody(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    xp_reward: Optional[int] = None
    category: Optional[str] = None
    icon: Optional[str] = None

@router.get("/api/challenge")
@router.get("/api/challenges")
async def get_all_challenges(user: dict = Depends(get_current_user)):
    """Fetch active missions for the authenticated athlete."""
    uid = user["uid"]
    stored = list_documents("user_challenges", uid)
    if not stored:
        # Seed default missions
        for m in DEFAULT_MISSIONS:
            doc_id = f"{uid}_{m['id']}"
            item = dict(m)
            item["user_id"] = uid
            item["doc_id"] = doc_id
            save_document("user_challenges", doc_id, item)
        stored = list_documents("user_challenges", uid)
    return stored

@router.post("/api/challenge/complete")
async def complete_challenge_endpoint(body: CompleteChallengeBody, user: dict = Depends(get_current_user)):
    """Completes a challenge and awards XP."""
    uid = user["uid"]
    ch_id = body.challenge_id or body.id
    if not ch_id:
        raise HTTPException(status_code=400, detail="Challenge ID is required")

    doc_id = f"{uid}_{ch_id}" if not ch_id.startswith(uid) else ch_id

    challenge = get_document("user_challenges", doc_id, user_id=uid)
    if not challenge:
        # Check by id match
        items = list_documents("user_challenges", uid)
        for it in items:
            if it.get("id") == ch_id or it.get("doc_id") == ch_id:
                challenge = it
                doc_id = it.get("doc_id") or it.get("id")
                break

    if not challenge:
        # Fallback create and complete
        challenge = {
            "id": ch_id,
            "user_id": uid,
            "title": "Mission Completed",
            "xp_reward": 30,
            "is_completed": True
        }
    else:
        challenge["is_completed"] = True
        challenge["completed_at"] = time.time()

    save_document("user_challenges", doc_id, challenge)

    # Award XP
    xp_reward = challenge.get("xp_reward", 30)
    user_record = get_document("users", uid, user_id=uid) or {"xp": 0, "level": 1}
    current_xp = user_record.get("xp", 0) + xp_reward
    new_level = (current_xp // 1000) + 1
    user_record["xp"] = current_xp
    user_record["level"] = new_level
    save_document("users", uid, user_record)

    profile = get_document("fitness_profiles", uid, user_id=uid)
    if profile:
        profile["xp"] = current_xp
        profile["level"] = new_level
        save_document("fitness_profiles", uid, profile)

    return {
        "status": "success",
        "xp_awarded": xp_reward,
        "total_xp": current_xp,
        "level": new_level,
        "challenge": challenge
    }

@router.post("/api/challenge/reset")
async def reset_challenges_endpoint(user: dict = Depends(get_current_user)):
    """Reset daily missions back to default."""
    uid = user["uid"]
    for m in DEFAULT_MISSIONS:
        doc_id = f"{uid}_{m['id']}"
        item = dict(m)
        item["user_id"] = uid
        item["doc_id"] = doc_id
        item["is_completed"] = False
        save_document("user_challenges", doc_id, item)
    return {"status": "success", "message": "Challenges reset to default"}

@router.post("/api/challenge")
async def create_custom_challenge(body: ChallengeCreateBody, user: dict = Depends(get_current_user)):
    """Creates a custom mission."""
    uid = user["uid"]
    new_id = f"custom_{int(time.time())}"
    doc_id = f"{uid}_{new_id}"
    item = {
        "id": new_id,
        "user_id": uid,
        "doc_id": doc_id,
        "title": body.title,
        "description": body.description,
        "xp_reward": body.xp_reward or 30,
        "category": body.category or "General",
        "icon": "⚡",
        "is_completed": False
    }
    save_document("user_challenges", doc_id, item)
    return item

@router.put("/api/challenge/{challenge_id}")
async def update_custom_challenge(challenge_id: str, body: ChallengeUpdateBody, user: dict = Depends(get_current_user)):
    """Updates an existing challenge."""
    uid = user["uid"]
    doc_id = f"{uid}_{challenge_id}" if not challenge_id.startswith(uid) else challenge_id
    item = get_document("user_challenges", doc_id, user_id=uid)
    if not item:
        items = list_documents("user_challenges", uid)
        for it in items:
            if it.get("id") == challenge_id or it.get("doc_id") == challenge_id:
                item = it
                doc_id = it.get("doc_id") or it.get("id")
                break

    if not item:
        raise HTTPException(status_code=404, detail="Challenge not found")

    if body.title is not None:
        item["title"] = body.title
    if body.description is not None:
        item["description"] = body.description
    if body.xp_reward is not None:
        item["xp_reward"] = body.xp_reward
    if body.category is not None:
        item["category"] = body.category
    if body.icon is not None:
        item["icon"] = body.icon

    save_document("user_challenges", doc_id, item)
    return item

@router.delete("/api/challenge/{challenge_id}")
async def delete_custom_challenge(challenge_id: str, user: dict = Depends(get_current_user)):
    """Deletes a challenge."""
    uid = user["uid"]
    doc_id = f"{uid}_{challenge_id}" if not challenge_id.startswith(uid) else challenge_id
    delete_document("user_challenges", doc_id, user_id=uid)
    
    # Also attempt delete with plain id if needed
    delete_document("user_challenges", challenge_id, user_id=uid)
    return {"status": "success"}


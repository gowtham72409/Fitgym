import time
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.firestore import get_document, save_document, list_documents
from app.ai import chat_with_agent, chat_with_sara, calculate_fitness_metrics, generate_workout_plan

router = APIRouter(prefix="/api/sara", tags=["sara"])

@router.post("")
async def interact_with_sara(data: Dict[str, Any], user: dict = Depends(get_current_user)):
    """
    Context-aware Multi-Agent conversation (Sara, Chef Macro, Coach Marcus, Dr. Zen, Coach Blaze).
    Answers user questions, provides domain guidance, and performs live actions.
    """
    uid = user["uid"]
    user_msg = data.get("message", "").strip()
    agent_id = data.get("agent_id", "sara")
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Gather user context
    profile = get_document("fitness_profiles", uid, user_id=uid) or {}
    metrics = calculate_fitness_metrics(profile) if profile else {}
    diet_plan = get_document("diet_plans", uid, user_id=uid) or {}
    workout_plan = get_document("workout_plans", uid, user_id=uid) or {}
    recent_activities = list_documents("activities", uid, limit=3)
    user_record = get_document("users", uid, user_id=uid) or {}

    context = {
        "profile": {**profile, "name": user_record.get("name", "Athlete")},
        "metrics": metrics,
        "workout": workout_plan,
        "diet": diet_plan,
        "recent_activities": recent_activities
    }

    # Call Multi-Agent AI
    sara_result = chat_with_agent(user_msg, context, agent_id=agent_id)
    reply = sara_result.get("reply", "I'm right here with you on your fitness journey!")
    agent_name = sara_result.get("agent_name", "Sara")
    action = sara_result.get("action", "NONE")
    action_payload = sara_result.get("action_payload", {})

    # Perform action server-side if actionable
    if action == "SWITCH_WORKOUT_ENVIRONMENT" and profile:
        profile["workout_environment"] = action_payload.get("environment", "Home")
        save_document("fitness_profiles", uid, profile)

    elif action == "ADJUST_WORKOUT_DURATION" and profile:
        dur = action_payload.get("duration_minutes", 45)
        profile["workout_duration_minutes"] = dur
        save_document("fitness_profiles", uid, profile)
        # Regenerate workout with new duration
        new_workout = generate_workout_plan(profile, duration_mins=dur)
        new_workout["user_id"] = uid
        new_workout["id"] = uid
        save_document("workout_plans", uid, new_workout)

    # Save to chat history
    chat_id = f"chat_{int(time.time() * 1000)}"
    chat_entry = {
        "id": chat_id,
        "user_id": uid,
        "user_message": user_msg,
        "sara_reply": reply,
        "action": action,
        "action_payload": action_payload,
        "created_at": time.time()
    }
    save_document("chat_history", chat_id, chat_entry)

    return {
        "reply": reply,
        "agent_id": agent_id,
        "agent_name": agent_name,
        "action": action,
        "action_payload": action_payload,
        "created_at": time.time()
    }

@router.get("/history")
async def get_sara_history(user: dict = Depends(get_current_user)):
    """Fetch previous chat turns."""
    uid = user["uid"]
    history = list_documents("chat_history", uid, limit=50)
    history.sort(key=lambda x: x.get("created_at", 0))
    return {"history": history}

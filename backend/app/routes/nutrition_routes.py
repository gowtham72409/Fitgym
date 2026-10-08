import time
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.auth import get_current_user
from app.firestore import get_document, save_document, list_documents, delete_document
from app.storage import upload_user_file, delete_user_file, get_file_url
from app.ai import analyze_food_image

router = APIRouter(prefix="/api/nutrition", tags=["nutrition"])

@router.post("/analyze")
async def analyze_nutrition(
    image: UploadFile = File(...),
    quantity_kg: float = Form(0.50),
    meal_type: str = Form("Meal"),
    food_name_override: Optional[str] = Form(None),
    user: dict = Depends(get_current_user)
):
    """
    Multimodal AI Food Scanner:
    1. Reads mobile food photo
    2. Stores image in Firebase Storage under users/{uid}/food-scans/{scanId}.jpg
    3. Runs Vision AI to detect ingredients, calories & macros based on weight
    4. Saves to Firestore nutrition_logs
    5. Awards +10 XP for healthy nutrition logging
    """
    uid = user["uid"]
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image uploaded")

    # Limit max size to 10MB
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image exceeds 10MB limit")

    scan_id = f"scan_{uuid.uuid4().hex[:12]}"
    filename = f"{scan_id}.jpg"

    # Upload to Firebase Storage
    storage_path = upload_user_file(uid, "food-scans", filename, image_bytes, content_type="image/jpeg")
    image_display_url = get_file_url(storage_path)

    # Analyze with Multimodal Vision AI
    profile = get_document("fitness_profiles", uid, user_id=uid) or {}
    diet_pref = profile.get("food_preference", "")
    analysis = analyze_food_image(image_bytes, quantity_kg=quantity_kg, meal_type=meal_type, preferences=diet_pref)

    # If user provided a manual override
    if food_name_override and food_name_override.strip():
        analysis["food_name"] = food_name_override.strip()

    today_date_str = datetime.now().strftime("%Y-%m-%d")

    # Prepare Firestore document
    doc_data = {
        "id": scan_id,
        "user_id": uid,
        "food_name": analysis.get("food_name", "Meal"),
        "detected_items": analysis.get("detected_items", []),
        "quantity_kg": quantity_kg,
        "serving": analysis.get("estimated_serving", f"{int(quantity_kg*1000)}g"),
        "calories": analysis.get("calories", 500),
        "protein_g": analysis.get("protein_g", 30),
        "carbs_g": analysis.get("carbs_g", 60),
        "fat_g": analysis.get("fat_g", 15),
        "fiber_g": analysis.get("fiber_g", 5),
        "confidence": analysis.get("confidence", 0.9),
        "notes": analysis.get("notes", ""),
        "meal_type": meal_type,
        "image_path": storage_path,
        "image_url": image_display_url,
        "date_str": today_date_str,
        "created_at": time.time()
    }

    saved = save_document("nutrition_logs", scan_id, doc_data)

    # Award +10 XP
    user_record = get_document("users", uid, user_id=uid) or {"xp": 0, "level": 1}
    current_xp = user_record.get("xp", 0) + 10
    user_record["xp"] = current_xp
    user_record["level"] = (current_xp // 1000) + 1
    save_document("users", uid, user_record)

    return {
        "status": "success",
        "result": saved,
        "xp_earned": 10,
        "total_xp": current_xp
    }

@router.get("/history")
async def get_nutrition_history(user: dict = Depends(get_current_user)):
    """Fetch user's logged meals and food scans."""
    uid = user["uid"]
    logs = list_documents("nutrition_logs", uid, limit=50)
    for log in logs:
        if "image_path" in log and not log.get("image_url"):
            log["image_url"] = get_file_url(log["image_path"])
    return {"history": logs}

@router.put("/{scan_id}")
async def update_nutrition_log(scan_id: str, data: Dict[str, Any], user: dict = Depends(get_current_user)):
    """Allow user to manually correct food name, quantity, or recalculate macros."""
    uid = user["uid"]
    existing = get_document("nutrition_logs", scan_id, user_id=uid)
    if not existing:
        raise HTTPException(status_code=404, detail="Nutrition log not found")

    data["user_id"] = uid
    data["id"] = scan_id

    # If quantity changed, adjust macros proportionally
    old_qty = existing.get("quantity_kg", 0.50)
    new_qty = data.get("quantity_kg", old_qty)
    if old_qty > 0 and new_qty != old_qty and "calories" not in data:
        ratio = new_qty / old_qty
        data["calories"] = round(existing.get("calories", 500) * ratio)
        data["protein_g"] = round(existing.get("protein_g", 30) * ratio)
        data["carbs_g"] = round(existing.get("carbs_g", 60) * ratio)
        data["fat_g"] = round(existing.get("fat_g", 15) * ratio)
        data["fiber_g"] = round(existing.get("fiber_g", 5) * ratio)

    merged = {**existing, **data}
    saved = save_document("nutrition_logs", scan_id, merged)
    return {"status": "success", "result": saved}

@router.delete("/{scan_id}")
async def delete_nutrition_log(scan_id: str, user: dict = Depends(get_current_user)):
    """Deletes food scan record and deletes image from Firebase Storage."""
    uid = user["uid"]
    existing = get_document("nutrition_logs", scan_id, user_id=uid)
    if not existing:
        raise HTTPException(status_code=404, detail="Nutrition log not found")

    # Delete storage image if exists
    img_path = existing.get("image_path")
    if img_path:
        delete_user_file(img_path, uid)

    delete_document("nutrition_logs", scan_id, uid)
    return {"status": "deleted", "id": scan_id}

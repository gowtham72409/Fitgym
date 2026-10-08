import time
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.firestore import get_document, save_document, list_documents
from app.ai import generate_diet_plan, generate_workout_plan, calculate_fitness_metrics

router = APIRouter(prefix="/api", tags=["plans"])

@router.get("/day")
async def get_day_summary(user: dict = Depends(get_current_user)):
    """
    Returns today's consolidated dashboard view with 7-day plan days array:
    - Current day of week (e.g. 'Sunday')
    - Today's Diet & Workout
    - Full 7-day days list so DietPlan.jsx and HomeDashboard.jsx can render immediately
    """
    uid = user["uid"]
    profile = get_document("fitness_profiles", uid, user_id=uid) or {}
    metrics = calculate_fitness_metrics(profile) if profile else {}
    user_record = get_document("users", uid, user_id=uid) or {}

    today_str = datetime.now().strftime("%A")
    today_date_str = datetime.now().strftime("%Y-%m-%d")

    # Fetch 7-day diet and workout plans, generate if missing
    diet_plan = get_document("diet_plans", uid, user_id=uid)
    if not diet_plan or "days" not in diet_plan:
        diet_plan = generate_diet_plan(profile)
        diet_plan["user_id"] = uid
        save_document("diet_plans", uid, diet_plan)

    workout_plan = get_document("workout_plans", uid, user_id=uid)
    if not workout_plan or "days" not in workout_plan:
        workout_plan = generate_workout_plan(profile, duration_mins=90)
        workout_plan["user_id"] = uid
        save_document("workout_plans", uid, workout_plan)

    # Find today's meals
    today_meals = []
    if diet_plan and "days" in diet_plan:
        for d in diet_plan["days"]:
            if d.get("day", "").lower() == today_str.lower():
                today_meals = d.get("meals", [])
                break

    # Find today's workout
    today_workout = None
    if workout_plan and "days" in workout_plan:
        for d in workout_plan["days"]:
            if d.get("day", "").lower() == today_str.lower():
                today_workout = d
                break

    # Fetch today's nutrition logs
    all_logs = list_documents("nutrition_logs", uid, limit=50)
    today_logs = [log for log in all_logs if log.get("date_str") == today_date_str or (log.get("created_at") and datetime.fromtimestamp(log["created_at"]).strftime("%Y-%m-%d") == today_date_str)]
    
    consumed_calories = sum(l.get("calories", 0) for l in today_logs)
    consumed_protein = sum(l.get("protein_g", 0) for l in today_logs)
    consumed_carbs = sum(l.get("carbs_g", 0) for l in today_logs)
    consumed_fat = sum(l.get("fat_g", 0) for l in today_logs)

    # Fetch today's checkin
    checkin_doc = get_document("daily_checkins", f"{uid}_{today_date_str}", user_id=uid) or {}
    water_ml = checkin_doc.get("water_ml", 0)

    # Fetch daily challenge
    challenge_doc = get_document("challenges", f"{uid}_{today_date_str}", user_id=uid)
    if not challenge_doc:
        challenge_doc = {
            "id": f"{uid}_{today_date_str}",
            "user_id": uid,
            "title": "Complete Your Scheduled Workout",
            "description": "Crush today's planned session and log your sweat!",
            "difficulty": "Moderate",
            "xp_reward": 50,
            "completed": False,
            "date_str": today_date_str
        }

    completed_workouts = list_documents("daily_history", uid, limit=20)
    workout_done_today = any(w.get("type") == "workout" and w.get("date_str") == today_date_str for w in completed_workouts)

    xp = user_record.get("xp", 125)
    level = user_record.get("level", 2)

    return {
        "day_of_week": today_str,
        "date_str": today_date_str,
        "days": diet_plan.get("days", []),
        "user": user_record,
        "metrics": metrics,
        "today_progress": {
            "calories_consumed": consumed_calories,
            "calories_target": metrics.get("target_calories", 2000),
            "protein_consumed_g": consumed_protein,
            "protein_target_g": metrics.get("target_protein_g", 130),
            "water_ml": water_ml,
            "water_target_ml": 3000,
            "steps": checkin_doc.get("steps", 0),
            "workout_completed": workout_done_today
        },
        "today_meals": today_meals,
        "today_workout": today_workout,
        "today_challenge": challenge_doc,
        "has_diet_plan": True,
        "has_workout_plan": True
    }

# =====================================================================
# FULL PLAN GENERATION & CUSTOMIZATION
# =====================================================================
@router.post("/plan")
@router.post("/plan/generate")
async def generate_full_plans(user: dict = Depends(get_current_user)):
    """Generates both 7-day Diet and 7-day Workout plans tailored to profile."""
    uid = user["uid"]
    profile = get_document("fitness_profiles", uid, user_id=uid) or {}

    diet = generate_diet_plan(profile)
    diet["user_id"] = uid
    diet["id"] = uid
    save_document("diet_plans", uid, diet)

    pref_duration = int(profile.get("workout_duration_minutes", 90))
    workout = generate_workout_plan(profile, duration_mins=pref_duration)
    workout["user_id"] = uid
    workout["id"] = uid
    save_document("workout_plans", uid, workout)

    return {
        "status": "success",
        "diet": diet,
        "workout": workout,
        "days": diet.get("days", [])
    }

# =====================================================================
# DIET ENDPOINTS
# =====================================================================
@router.get("/diet")
async def get_diet(user: dict = Depends(get_current_user)):
    """Fetch user's 7-day diet plan."""
    uid = user["uid"]
    diet = get_document("diet_plans", uid, user_id=uid)
    if not diet or "days" not in diet:
        profile = get_document("fitness_profiles", uid, user_id=uid) or {}
        diet = generate_diet_plan(profile)
        diet["user_id"] = uid
        diet["id"] = uid
        save_document("diet_plans", uid, diet)

    return {
        **diet,
        "days": diet.get("days", []),
        "diet": diet
    }

@router.post("/customize")
@router.put("/diet")
@router.post("/diet/meal")
async def save_custom_diet(data: Dict[str, Any], user: dict = Depends(get_current_user)):
    """Saves user modifications to diet plan: add meal, edit meal, delete meal."""
    uid = user["uid"]
    diet = get_document("diet_plans", uid, user_id=uid)
    if not diet or "days" not in diet:
        profile = get_document("fitness_profiles", uid, user_id=uid) or {}
        diet = generate_diet_plan(profile)

    target_day = data.get("day", "Monday")
    action = data.get("action", "edit")  # "add", "edit", "delete"
    meal_type = data.get("meal_type")
    new_food = data.get("new_food_name") or data.get("recipe_name") or "Custom Meal"
    meal_idx = data.get("meal_index", None)

    for d in diet.get("days", []):
        if d.get("day", "").lower() == target_day.lower():
            meals = d.get("meals", [])
            
            if action == "delete":
                if meal_idx is not None and 0 <= meal_idx < len(meals):
                    meals.pop(meal_idx)
                elif meal_type:
                    meals = [m for m in meals if m.get("meal", "").lower() != meal_type.lower() and m.get("recipe_name") != new_food]
                d["meals"] = meals

            elif action == "add":
                new_meal = {
                    "meal": meal_type or "Custom Meal",
                    "recipe_name": new_food,
                    "food_name": new_food,
                    "calories": int(data.get("new_calories", data.get("calories", 350))),
                    "protein_g": float(data.get("new_protein_g", data.get("protein_g", 25))),
                    "carbs_g": float(data.get("new_carbs_g", data.get("carbs_g", 40))),
                    "fat_g": float(data.get("new_fat_g", data.get("fat_g", 10))),
                    "fiber_g": float(data.get("new_fiber_g", data.get("fiber_g", 5))),
                    "ingredients": data.get("new_ingredients") or ["Fresh ingredients", "Healthy portion"],
                    "instructions": data.get("new_instructions") or ["Prepare fresh and enjoy."]
                }
                meals.append(new_meal)
                d["meals"] = meals

            else:  # "edit"
                found = False
                if meal_idx is not None and 0 <= meal_idx < len(meals):
                    m = meals[meal_idx]
                    m["meal"] = meal_type or m.get("meal")
                    m["recipe_name"] = new_food
                    m["food_name"] = new_food
                    m["calories"] = int(data.get("new_calories", data.get("calories", m.get("calories", 350))))
                    m["protein_g"] = float(data.get("new_protein_g", data.get("protein_g", m.get("protein_g", 25))))
                    m["carbs_g"] = float(data.get("new_carbs_g", data.get("carbs_g", m.get("carbs_g", 40))))
                    m["fat_g"] = float(data.get("new_fat_g", data.get("fat_g", m.get("fat_g", 10))))
                    m["fiber_g"] = float(data.get("new_fiber_g", data.get("fiber_g", m.get("fiber_g", 5))))
                    if "new_ingredients" in data:
                        m["ingredients"] = data["new_ingredients"]
                    if "new_instructions" in data:
                        m["instructions"] = data["new_instructions"]
                    found = True
                else:
                    for m in meals:
                        if m.get("meal", "").lower() == (meal_type or "").lower() or m.get("recipe_name") == new_food:
                            m["recipe_name"] = new_food
                            m["food_name"] = new_food
                            if meal_type:
                                m["meal"] = meal_type
                            if "new_calories" in data or "calories" in data:
                                m["calories"] = int(data.get("new_calories", data.get("calories", m.get("calories", 350))))
                            if "new_protein_g" in data or "protein_g" in data:
                                m["protein_g"] = float(data.get("new_protein_g", data.get("protein_g", m.get("protein_g", 25))))
                            if "new_carbs_g" in data or "carbs_g" in data:
                                m["carbs_g"] = float(data.get("new_carbs_g", data.get("carbs_g", m.get("carbs_g", 40))))
                            if "new_fat_g" in data or "fat_g" in data:
                                m["fat_g"] = float(data.get("new_fat_g", data.get("fat_g", m.get("fat_g", 10))))
                            if "new_fiber_g" in data or "fiber_g" in data:
                                m["fiber_g"] = float(data.get("new_fiber_g", data.get("fiber_g", m.get("fiber_g", 5))))
                            if "new_ingredients" in data:
                                m["ingredients"] = data["new_ingredients"]
                            if "new_instructions" in data:
                                m["instructions"] = data["new_instructions"]
                            found = True
                            break
                if not found:
                    # If not found during edit, add it as a new meal
                    meals.append({
                        "meal": meal_type or "Custom Meal",
                        "recipe_name": new_food,
                        "food_name": new_food,
                        "calories": int(data.get("new_calories", 350)),
                        "protein_g": float(data.get("new_protein_g", 25)),
                        "carbs_g": float(data.get("new_carbs_g", 40)),
                        "fat_g": float(data.get("new_fat_g", 10)),
                        "fiber_g": float(data.get("new_fiber_g", 5)),
                        "ingredients": data.get("new_ingredients") or ["Fresh ingredients"],
                        "instructions": data.get("new_instructions") or ["Prepare fresh and enjoy."]
                    })
                    d["meals"] = meals

            # Recalculate day summary totals
            d["total_calories"] = sum(m.get("calories", 0) for m in d.get("meals", []))
            d["total_protein_g"] = sum(m.get("protein_g", 0) for m in d.get("meals", []))
            break

    diet["user_id"] = uid
    save_document("diet_plans", uid, diet)
    return {"status": "success", "plan_data": diet, "days": diet.get("days", [])}

# =====================================================================
# WORKOUT ENDPOINTS
# =====================================================================
@router.get("/workout")
@router.post("/workout")
async def get_workout(user: dict = Depends(get_current_user)):
    """Fetch user's 7-day workout plan (Home & Gym)."""
    uid = user["uid"]
    workout = get_document("workout_plans", uid, user_id=uid)
    if not workout or "days" not in workout:
        profile = get_document("fitness_profiles", uid, user_id=uid) or {}
        dur = int(profile.get("workout_duration_minutes", 90))
        workout = generate_workout_plan(profile, duration_mins=dur)
        workout["user_id"] = uid
        workout["id"] = uid
        save_document("workout_plans", uid, workout)

    return {
        **workout,
        "days": workout.get("days", []),
        "workout": workout
    }

@router.post("/workout/customize")
@router.post("/workout/generate")
async def regenerate_workout(data: Optional[Dict[str, Any]] = None, user: dict = Depends(get_current_user)):
    """Regenerates workout plan with optional duration/difficulty override."""
    uid = user["uid"]
    profile = get_document("fitness_profiles", uid, user_id=uid) or {}
    dur = 90
    if data and "duration_min" in data:
        dur = int(data["duration_min"])
    elif data and "duration_minutes" in data:
        dur = int(data["duration_minutes"])

    workout = generate_workout_plan(profile, duration_mins=dur)
    workout["user_id"] = uid
    workout["id"] = uid
    save_document("workout_plans", uid, workout)

    return {
        "status": "success",
        "plan_data": workout,
        "days": workout.get("days", []),
        "workout": workout
    }

@router.post("/workout/exercise")
@router.put("/workout/exercise")
async def customize_workout_exercise(data: Dict[str, Any], user: dict = Depends(get_current_user)):
    """
    Customizes an individual exercise in the workout plan:
    - action: 'add', 'edit', 'delete'
    - day: 'Monday', 'Tuesday', etc.
    - mode: 'Home' or 'Gym'
    - section: 'warmup', 'mobility', 'main_strength', 'conditioning', 'core', 'cooldown'
    - exercise: { name, sets, reps, duration, weight, target_muscle }
    - exercise_index: optional index
    """
    uid = user["uid"]
    workout = get_document("workout_plans", uid, user_id=uid)
    if not workout or "days" not in workout:
        profile = get_document("fitness_profiles", uid, user_id=uid) or {}
        workout = generate_workout_plan(profile, duration_mins=90)

    target_day = data.get("day", "Monday")
    raw_mode = str(data.get("mode", "Gym")).capitalize()
    action = data.get("action", "add")
    ex_idx = data.get("exercise_index", None)
    ex_data = data.get("exercise", {})

    if raw_mode == "Cardio":
        target_sub = "cardio_workout"
        section_key = "exercises"
    elif raw_mode == "Home":
        target_sub = "home_workout"
        section_key = data.get("section", "main_strength")
    else:
        target_sub = "gym_workout"
        section_key = data.get("section", "main_strength")

    for d in workout.get("days", []):
        if d.get("day", "").lower() == target_day.lower():
            if target_sub not in d or not isinstance(d[target_sub], dict):
                d[target_sub] = {
                    "duration_minutes": 45,
                    "focus": "Cardio & Aerobic Conditioning",
                    "calories_est": 450,
                    "target_hr": "135–165 BPM",
                    "exercises": []
                }
            sub = d.get(target_sub, {})
            # Find the section list
            if section_key not in sub or not isinstance(sub[section_key], list):
                sub[section_key] = []

            exercise_list = sub[section_key]

            if action == "delete":
                if ex_idx is not None and 0 <= ex_idx < len(exercise_list):
                    exercise_list.pop(ex_idx)
                elif "name" in ex_data:
                    target_name = ex_data.get("name") or ex_data.get("exercise_name")
                    exercise_list = [ex for ex in exercise_list if (ex.get("name") or ex.get("exercise_name")) != target_name]
                sub[section_key] = exercise_list

            elif action in ("edit", "add"):
                item_name = ex_data.get("name") or ex_data.get("exercise_name", "Custom Exercise")
                item = {
                    "name": item_name,
                    "exercise_name": item_name,
                    "duration": str(ex_data.get("duration", "15 min")),
                    "intensity": str(ex_data.get("intensity", "Moderate")),
                    "calories_burn": str(ex_data.get("calories_burn", "150 kcal")),
                    "target_hr": str(ex_data.get("target_hr", "130–155 BPM")),
                    "equipment": str(ex_data.get("equipment", "Bodyweight")),
                    "sets": int(ex_data.get("sets", 3)),
                    "reps": str(ex_data.get("reps", "10-12")),
                    "target_muscle": str(ex_data.get("target_muscle") or ex_data.get("muscle_group", "Cardio / Full body")),
                    "muscle_group": str(ex_data.get("muscle_group") or ex_data.get("target_muscle", "Cardio / Full body")),
                    "difficulty": str(ex_data.get("difficulty", "Intermediate")),
                    "instructions": str(ex_data.get("instructions", "Perform with steady pacing and strict form."))
                }
                if action == "edit" and ex_idx is not None and 0 <= ex_idx < len(exercise_list):
                    exercise_list[ex_idx] = item
                else:
                    exercise_list.append(item)
                sub[section_key] = exercise_list

            break

    workout["user_id"] = uid
    save_document("workout_plans", uid, workout)
    return {
        "status": "success",
        "plan_data": workout,
        "days": workout.get("days", []),
        "workout": workout
    }


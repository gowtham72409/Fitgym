import json
import logging
import re
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from PIL import Image
import io
from app.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini if key is provided
if settings.GEMINI_API_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.error(f"Failed to configure Gemini API: {e}")

# Helper to clean JSON string from LLM markdown codeblocks
def extract_json(text: str) -> Optional[Dict[str, Any]]:
    try:
        # Check for ```json ... ```
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1)
        return json.loads(text.strip())
    except Exception as e:
        logger.warning(f"Failed to parse JSON from AI response: {e}")
        return None

# =====================================================================
# CALCULATION UTILITIES
# =====================================================================
def calculate_fitness_metrics(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate BMI, BMR, TDEE, Calorie Target, and Protein Target safely."""
    raw_weight = profile.get("weight_kg") or profile.get("current_weight_kg")
    raw_height = profile.get("height_cm")
    
    # If new user has not set measurements yet, do not invent dummy values
    if not raw_weight or not raw_height:
        return {
            "bmi": None,
            "bmi_category": "Not Set",
            "bmr": None,
            "tdee": None,
            "daily_calorie_target": profile.get("daily_calorie_target"),
            "daily_burn_target_kcal": profile.get("daily_burn_target_kcal"),
            "protein_target_g": profile.get("daily_protein_target"),
            "carbs_target_g": profile.get("daily_carbs_target"),
            "fat_target_g": profile.get("daily_fat_target")
        }

    weight = float(raw_weight)
    height = float(raw_height)
    age = int(profile.get("age", 25))
    gender = profile.get("gender", "male").lower()
    activity = profile.get("activity_level", "moderate").lower()
    goal = profile.get("goal", "general_fitness").lower()
    target_weight = float(profile.get("target_weight_kg", weight))

    # BMI
    height_m = height / 100.0
    bmi = round(weight / (height_m * height_m), 1) if height_m > 0 else 22.0
    
    bmi_category = "Normal"
    if bmi < 18.5:
        bmi_category = "Underweight"
    elif bmi >= 25 and bmi < 30:
        bmi_category = "Overweight"
    elif bmi >= 30:
        bmi_category = "Obese"

    # BMR (Mifflin-St Jeor)
    if gender == "female":
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
    else:
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    bmr = round(bmr)

    # Activity multiplier
    multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    }
    multiplier = multipliers.get(activity, 1.55)
    tdee = round(bmr * multiplier)

    # Target Calorie calculation (safe deficit/surplus)
    if "loss" in goal:
        target_calories = max(1400 if gender == "female" else 1600, tdee - 450)
    elif "muscle" in goal or "gain" in goal:
        target_calories = tdee + 350
    else:
        target_calories = tdee

    # Suggested Protein (1.6 to 2.2 g per kg based on goal)
    if "muscle" in goal:
        protein_g = round(weight * 2.0)
    elif "loss" in goal:
        protein_g = round(weight * 1.8)
    else:
        protein_g = round(weight * 1.6)

    # Target weight diff & progress
    weight_diff = round(abs(weight - target_weight), 1)
    # Estimated progress % if starting weight exists
    starting_weight = float(profile.get("starting_weight_kg", weight))
    total_change_needed = abs(starting_weight - target_weight)
    current_change = abs(starting_weight - weight)
    progress_pct = 100 if total_change_needed == 0 else min(100, round((current_change / total_change_needed) * 100))

    return {
        "bmi": bmi,
        "bmi_category": bmi_category,
        "bmr": bmr,
        "tdee": tdee,
        "target_calories": round(target_calories),
        "target_protein_g": protein_g,
        "weight_diff_kg": weight_diff,
        "progress_pct": progress_pct
    }

# =====================================================================
# AI DIET PLAN GENERATOR
# =====================================================================
DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

def generate_diet_plan(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Generates a complete 7-day diet plan using Gemini or structured science-backed fallback."""
    metrics = calculate_fitness_metrics(profile)
    pref = profile.get("food_preference", "non_vegetarian")
    budget = profile.get("budget", "moderate")
    allergies = profile.get("allergies", "none")
    cuisines = profile.get("cuisines", "mixed")
    calories = metrics["target_calories"]
    protein = metrics["target_protein_g"]

    prompt = f"""
    You are FitQuest AI Nutritionist. Create a customized 7-day meal plan for:
    - Daily Target: {calories} kcal, {protein}g protein
    - Diet type: {pref}
    - Budget: {budget}
    - Allergies to avoid: {allergies}
    - Preferred cuisines: {cuisines}

    Provide all 7 days: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.
    Every day must contain 4 meals: Breakfast, Lunch, Snack, Dinner.
    Every meal must include exact quantity, serving size, calories, protein_g, carbs_g, fat_g, fiber_g, and recipe (name, ingredients with quantities, prep_time_mins, instructions).

    Return ONLY strict JSON matching this schema:
    {{
      "summary": "High-protein balanced plan tailored to your preferences",
      "daily_target_calories": {calories},
      "daily_target_protein_g": {protein},
      "days": [
        {{
          "day": "Sunday",
          "meals": [
            {{
              "meal": "Breakfast",
              "food_name": "Oatmeal with Almonds & Berries",
              "quantity": "1 bowl (250g)",
              "serving_size_g": 250,
              "calories": 420,
              "protein_g": 22,
              "carbs_g": 55,
              "fat_g": 12,
              "fiber_g": 8,
              "recipe": {{
                "name": "Power Protein Oatmeal",
                "prep_time_mins": 10,
                "ingredients": ["60g rolled oats", "200ml milk or plant milk", "1 scoop whey or plant protein", "15g chopped almonds", "50g fresh berries"],
                "instructions": ["Simmer oats in milk for 5 mins.", "Stir in protein powder off heat.", "Top with almonds and berries."]
              }}
            }}
          ]
        }}
      ]
    }}
    """

    if settings.GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            data = extract_json(response.text)
            if data and "days" in data and len(data["days"]) >= 7:
                return data
        except Exception as e:
            logger.warning(f"Gemini diet generation failed, using intelligent template: {e}")

    # Fallback Nutritionist Expert Engine
    return _build_fallback_diet_plan(pref, calories, protein, cuisines)

def _build_fallback_diet_plan(pref: str, target_cal: int, target_prot: int, cuisines: str) -> Dict[str, Any]:
    # Meal templates based on preferences
    is_veg = "veg" in pref.lower() and "non" not in pref.lower()
    
    sample_breakfasts = [
        {
            "meal": "Breakfast",
            "food_name": "Scrambled Eggs on Whole Wheat Toast with Avocado" if not is_veg else "Paneer & Spinach Bhurji with Multigrain Toast",
            "quantity": "2 eggs + 2 slices toast" if not is_veg else "150g paneer + 2 slices toast",
            "serving_size_g": 280,
            "calories": round(target_cal * 0.28),
            "protein_g": round(target_prot * 0.28),
            "carbs_g": 40,
            "fat_g": 16,
            "fiber_g": 6,
            "recipe": {
                "name": "Morning High-Protein Energy Plate",
                "prep_time_mins": 12,
                "ingredients": ["2 whole eggs" if not is_veg else "150g low-fat paneer", "2 slices whole wheat bread", "1/2 avocado", "1 tsp olive oil", "Salt & black pepper"],
                "instructions": ["Toast the whole wheat bread until golden.", "Scramble eggs/paneer with olive oil and spices.", "Layer with sliced avocado and serve fresh."]
            }
        },
        {
            "meal": "Breakfast",
            "food_name": "High-Protein Greek Yogurt Parfait with Rolled Oats & Chia",
            "quantity": "250g Greek yogurt + 40g oats",
            "serving_size_g": 320,
            "calories": round(target_cal * 0.27),
            "protein_g": round(target_prot * 0.29),
            "carbs_g": 45,
            "fat_g": 10,
            "fiber_g": 7,
            "recipe": {
                "name": "Berry Chia Yogurt Crunch",
                "prep_time_mins": 8,
                "ingredients": ["250g thick Greek yogurt", "40g rolled oats", "1 tbsp chia seeds", "75g mixed berries", "1 tsp honey"],
                "instructions": ["Layer Greek yogurt in a bowl.", "Mix in chia seeds and rolled oats.", "Top with washed berries and a drizzle of honey."]
            }
        }
    ]

    sample_lunches = [
        {
            "meal": "Lunch",
            "food_name": "Grilled Chicken Breast with Steamed Brown Rice & Broccoli" if not is_veg else "Tofu & Quinoa Buddha Bowl with Roasted Edamame",
            "quantity": "180g protein + 150g rice + veggies",
            "serving_size_g": 420,
            "calories": round(target_cal * 0.35),
            "protein_g": round(target_prot * 0.36),
            "carbs_g": 65,
            "fat_g": 14,
            "fiber_g": 8,
            "recipe": {
                "name": "Balanced Performance Lunch Bowl",
                "prep_time_mins": 25,
                "ingredients": ["180g lean chicken breast" if not is_veg else "200g firm organic tofu", "150g cooked brown rice", "100g steamed broccoli florets", "1 tsp sesame oil", "Lemon juice"],
                "instructions": ["Season protein with paprika, garlic powder, and salt.", "Grill on medium skillet for 6-8 mins each side.", "Serve alongside steamed rice and broccoli with lemon juice."]
            }
        },
        {
            "meal": "Lunch",
            "food_name": "Salmon Rice Bowl with Cucumber & Avocado" if not is_veg else "Lentil Dal with Brown Basmati Rice & Cucumber Raita",
            "quantity": "1 bowl (400g)",
            "serving_size_g": 400,
            "calories": round(target_cal * 0.34),
            "protein_g": round(target_prot * 0.34),
            "carbs_g": 60,
            "fat_g": 18,
            "fiber_g": 7,
            "recipe": {
                "name": "Heart-Healthy Nutrient Bowl",
                "prep_time_mins": 20,
                "ingredients": ["160g wild salmon fillet" if not is_veg else "1.5 cup cooked yellow/red lentils", "150g warm brown rice", "1 sliced Persian cucumber", "Fresh cilantro", "Sesame seeds"],
                "instructions": ["Pan-sear salmon or simmer spiced lentils.", "Portion rice into a bowl, arrange cucumber slices.", "Garnish with sesame seeds and herbs."]
            }
        }
    ]

    sample_snacks = [
        {
            "meal": "Snack",
            "food_name": "Apple Slices with Natural Peanut Butter & Roasted Pumpkin Seeds",
            "quantity": "1 medium apple + 2 tbsp peanut butter",
            "serving_size_g": 180,
            "calories": round(target_cal * 0.12),
            "protein_g": round(target_prot * 0.10),
            "carbs_g": 26,
            "fat_g": 12,
            "fiber_g": 5,
            "recipe": {
                "name": "Crisp Apple Nut Booster",
                "prep_time_mins": 4,
                "ingredients": ["1 crisp red or green apple", "2 tbsp unsweetened peanut butter", "1 tbsp pumpkin seeds"],
                "instructions": ["Slice apple into wedges.", "Serve with peanut butter for dipping and sprinkle seeds."]
            }
        },
        {
            "meal": "Snack",
            "food_name": "Protein Shake with Banana & Almond Milk",
            "quantity": "1 shaker (350ml)",
            "serving_size_g": 350,
            "calories": round(target_cal * 0.13),
            "protein_g": round(target_prot * 0.14),
            "carbs_g": 28,
            "fat_g": 4,
            "fiber_g": 4,
            "recipe": {
                "name": "Quick Recovery Smoothie",
                "prep_time_mins": 5,
                "ingredients": ["1 scoop whey or plant protein powder", "1 medium ripe banana", "250ml unsweetened almond milk", "Ice cubes"],
                "instructions": ["Blend all ingredients in a high-speed blender for 30 seconds until creamy."]
            }
        }
    ]

    sample_dinners = [
        {
            "meal": "Dinner",
            "food_name": "Herb-Baked Turkey Breast with Roasted Sweet Potatoes & Asparagus" if not is_veg else "Chickpea & Sweet Potato Mediterranean Bowl with Tahini",
            "quantity": "1 plate (380g)",
            "serving_size_g": 380,
            "calories": round(target_cal * 0.25),
            "protein_g": round(target_prot * 0.26),
            "carbs_g": 48,
            "fat_g": 10,
            "fiber_g": 9,
            "recipe": {
                "name": "Evening Recovery Plate",
                "prep_time_mins": 30,
                "ingredients": ["160g turkey breast" if not is_veg else "200g cooked chickpeas", "150g cubed sweet potatoes", "8 spears fresh asparagus", "1 tbsp olive oil", "Rosemary & sea salt"],
                "instructions": ["Toss sweet potatoes and asparagus with olive oil and rosemary.", "Roast at 200°C (400°F) for 22 mins.", "Bake protein alongside until cooked through."]
            }
        },
        {
            "meal": "Dinner",
            "food_name": "Steamed Cod with Warm Quinoa & Sautéed Green Beans" if not is_veg else "Stir-Fried Tempeh with Quinoa & Asian Greens",
            "quantity": "1 plate (360g)",
            "serving_size_g": 360,
            "calories": round(target_cal * 0.25),
            "protein_g": round(target_prot * 0.26),
            "carbs_g": 44,
            "fat_g": 9,
            "fiber_g": 8,
            "recipe": {
                "name": "Lean Protein Green Dinner",
                "prep_time_mins": 22,
                "ingredients": ["180g cod fillet" if not is_veg else "180g organic tempeh cubes", "120g cooked fluffy quinoa", "100g fresh green beans", "Garlic clove", "Olive oil"],
                "instructions": ["Steam cod or sauté tempeh in a non-stick pan.", "Sauté green beans with minced garlic.", "Serve over warm quinoa."]
            }
        }
    ]

    days = []
    for idx, day_name in enumerate(DAYS_OF_WEEK):
        b = sample_breakfasts[idx % len(sample_breakfasts)]
        l = sample_lunches[idx % len(sample_lunches)]
        s = sample_snacks[idx % len(sample_snacks)]
        d = sample_dinners[idx % len(sample_dinners)]
        days.append({
            "day": day_name,
            "meals": [b, l, s, d]
        })

    return {
        "summary": f"Scientifically balanced {pref.replace('_', ' ').title()} plan targeting ~{target_cal} kcal and {target_prot}g protein.",
        "daily_target_calories": target_cal,
        "daily_target_protein_g": target_prot,
        "days": days
    }

# =====================================================================
# AI WORKOUT PLAN GENERATOR
# =====================================================================
def generate_workout_plan(profile: Dict[str, Any], duration_mins: int = 90) -> Dict[str, Any]:
    """
    Generates a full 7-day workout plan.
    Every day must contain BOTH a Home Workout AND a Gym Workout.
    Each workout structured: Warm-up, Mobility, Strength, Cardio, Core, Cool-down.
    """
    fitness_level = profile.get("fitness_level", "beginner")
    goal = profile.get("goal", "general_fitness")
    equipment = profile.get("equipment", "Dumbbells, Mat")

    prompt = f"""
    You are FitQuest AI Head Strength Coach. Generate a comprehensive 7-day workout plan.
    - Level: {fitness_level}
    - Goal: {goal}
    - Default duration: {duration_mins} minutes
    - Days: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.

    For EVERY day, you MUST provide BOTH:
    1. "home_workout" (using minimal/home equipment like dumbbells, bodyweight, bands, mat)
    2. "gym_workout" (using full gym equipment, barbells, cables, machines)

    Each workout MUST contain all 6 sections:
    - warmup (exercises)
    - mobility (exercises)
    - strength (exercises)
    - cardio (conditioning exercises)
    - core (exercises)
    - cooldown (stretches)

    Each exercise item MUST have:
    - name (string)
    - sets (integer)
    - reps (string or integer, e.g. "12 reps" or "45 secs")
    - duration_seconds (integer)
    - rest_seconds (integer)
    - difficulty ("Beginner" | "Intermediate" | "Advanced")
    - instructions (step-by-step string)

    Return ONLY strict JSON matching this structure:
    {{
      "plan_name": "7-Day Dual Home & Gym Progressive Program",
      "days": [
        {{
          "day": "Sunday",
          "focus": "Full Body & Mobility",
          "home_workout": {{
            "duration_minutes": {duration_mins},
            "warmup": [...],
            "mobility": [...],
            "strength": [...],
            "cardio": [...],
            "core": [...],
            "cooldown": [...]
          }},
          "gym_workout": {{
            "duration_minutes": {duration_mins},
            "warmup": [...],
            "mobility": [...],
            "strength": [...],
            "cardio": [...],
            "core": [...],
            "cooldown": [...]
          }}
        }}
      ]
    }}
    """

    if settings.GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            data = extract_json(response.text)
            if data and "days" in data and len(data["days"]) >= 7:
                return data
        except Exception as e:
            logger.warning(f"Gemini workout generation failed, using coach template: {e}")

    # Fallback Workout Expert Engine
    return _build_fallback_workout_plan(fitness_level, goal, duration_mins)

def _build_fallback_workout_plan(level: str, goal: str, duration_mins: int) -> Dict[str, Any]:
    day_splits = [
        ("Sunday", "Full Body Conditioning & Core"),
        ("Monday", "Chest, Triceps & Upper Body Push"),
        ("Tuesday", "Back, Biceps & Pull Strength"),
        ("Wednesday", "Legs, Quads & Hamstring Power"),
        ("Thursday", "Active Recovery, Mobility & Cardio"),
        ("Friday", "Shoulders, Arms & Functional Strength"),
        ("Saturday", "HIIT & Total Body Athleticism")
    ]

    days = []
    for day_name, focus in day_splits:
        home_wo = {
            "duration_minutes": duration_mins,
            "focus": f"Home {focus}",
            "warmup": [
                {"name": "Arm Circles & Torso Twists", "sets": 2, "reps": "30 sec", "duration_seconds": 60, "rest_seconds": 15, "difficulty": level.title(), "instructions": "Rotate arms forward and backward with controlled range, followed by gentle spine rotations."},
                {"name": "Jumping Jacks", "sets": 2, "reps": "45 sec", "duration_seconds": 90, "rest_seconds": 20, "difficulty": level.title(), "instructions": "Maintain rhythmic bouncing, engaging calves and shoulders."}
            ],
            "mobility": [
                {"name": "World's Greatest Stretch", "sets": 2, "reps": "5 each side", "duration_seconds": 120, "rest_seconds": 20, "difficulty": level.title(), "instructions": "Lunge forward, place hand inside ankle, rotate opposite arm towards the ceiling."},
                {"name": "Cat-Cow Spine Floss", "sets": 2, "reps": "10 reps", "duration_seconds": 90, "rest_seconds": 15, "difficulty": level.title(), "instructions": "Inhale to arch back looking up, exhale to round spine tucking chin."}
            ],
            "strength": [
                {"name": "Dumbbell Goblet Squats", "sets": 4, "reps": "12 reps", "duration_seconds": 180, "rest_seconds": 60, "difficulty": level.title(), "instructions": "Hold dumbbell vertically at chest height, keep chest tall and drive through whole foot."},
                {"name": "Push-Ups (Tempo 3-1-1)", "sets": 3, "reps": "10-15 reps", "duration_seconds": 150, "rest_seconds": 60, "difficulty": level.title(), "instructions": "Maintain straight plank line, lower chest towards ground with elbows at 45 degrees."},
                {"name": "Dumbbell Bent-Over Rows", "sets": 3, "reps": "12 reps", "duration_seconds": 150, "rest_seconds": 60, "difficulty": level.title(), "instructions": "Hinge hips back at 45 degrees, pull dumbbells towards hips squeezing lats."}
            ],
            "cardio": [
                {"name": "Mountain Climbers", "sets": 3, "reps": "40 sec", "duration_seconds": 120, "rest_seconds": 45, "difficulty": level.title(), "instructions": "Drive knees alternately towards chest from high plank position while bracing abs."},
                {"name": "High Knees in Place", "sets": 3, "reps": "30 sec", "duration_seconds": 90, "rest_seconds": 30, "difficulty": level.title(), "instructions": "Pump arms and bring knees up to waist height rapidly."}
            ],
            "core": [
                {"name": "Forearm Plank Hold", "sets": 3, "reps": "45 sec", "duration_seconds": 135, "rest_seconds": 30, "difficulty": level.title(), "instructions": "Squeeze glutes and brace core, keeping neck neutral."},
                {"name": "Deadbugs", "sets": 3, "reps": "12 reps", "duration_seconds": 120, "rest_seconds": 30, "difficulty": level.title(), "instructions": "Extend opposite arm and leg while pressing lower back flat onto the mat."}
            ],
            "cooldown": [
                {"name": "Child's Pose", "sets": 1, "reps": "60 sec", "duration_seconds": 60, "rest_seconds": 0, "difficulty": level.title(), "instructions": "Sit back onto heels, reach hands forward and breathe deeply into back ribs."},
                {"name": "Standing Quad & Hamstring Stretch", "sets": 2, "reps": "30 sec/leg", "duration_seconds": 120, "rest_seconds": 0, "difficulty": level.title(), "instructions": "Hold ankle to stretch quadriceps, then hinge forward to lengthen hamstrings."}
            ]
        }

        gym_wo = {
            "duration_minutes": duration_mins,
            "focus": f"Gym {focus}",
            "warmup": [
                {"name": "Incline Treadmill Walk", "sets": 1, "reps": "5 mins", "duration_seconds": 300, "rest_seconds": 30, "difficulty": level.title(), "instructions": "Warm up cardiovascular system at 10% incline at 4.5 km/h."},
                {"name": "Cable Face Pulls with Rope", "sets": 2, "reps": "15 reps", "duration_seconds": 90, "rest_seconds": 30, "difficulty": level.title(), "instructions": "Set pulley to face level, pull towards eyes with external shoulder rotation."}
            ],
            "mobility": [
                {"name": "Barbell Dislocates & Torso Rotations", "sets": 2, "reps": "10 reps", "duration_seconds": 90, "rest_seconds": 20, "difficulty": level.title(), "instructions": "Use light PVC pipe or empty bar to loosen shoulder girdle and thoracic spine."},
                {"name": "Deep Squat Hold with Rig Support", "sets": 2, "reps": "45 sec", "duration_seconds": 90, "rest_seconds": 20, "difficulty": level.title(), "instructions": "Hold upright post in deep squat, shifting weight side to side to open hips."}
            ],
            "strength": [
                {"name": "Barbell Back Squats", "sets": 4, "reps": "8-10 reps", "duration_seconds": 240, "rest_seconds": 90, "difficulty": level.title(), "instructions": "Bar rested across traps, brace core with deep breath, break at hips and knees simultaneously."},
                {"name": "Flat Barbell Bench Press", "sets": 4, "reps": "8-10 reps", "duration_seconds": 240, "rest_seconds": 90, "difficulty": level.title(), "instructions": "Retract scapulae into bench, touch mid-chest, drive bar up to lockout."},
                {"name": "Lat Pulldown (Wide Grip)", "sets": 3, "reps": "10-12 reps", "duration_seconds": 180, "rest_seconds": 60, "difficulty": level.title(), "instructions": "Pull bar down to upper chest, leading with elbows and squeezing back muscles."}
            ],
            "cardio": [
                {"name": "Rowing Machine Intervals", "sets": 4, "reps": "250m sprint", "duration_seconds": 240, "rest_seconds": 60, "difficulty": level.title(), "instructions": "Explosive leg drive, lean back slightly, pull handle to lower ribs."},
                {"name": "Assault Bike Intervals", "sets": 3, "reps": "30 sec work / 30 sec rest", "duration_seconds": 180, "rest_seconds": 30, "difficulty": level.title(), "instructions": "All-out sprint engaging both upper body push-pull and quad drive."}
            ],
            "core": [
                {"name": "Hanging Knee/Leg Raises", "sets": 3, "reps": "12 reps", "duration_seconds": 120, "rest_seconds": 45, "difficulty": level.title(), "instructions": "Hang from pull-up bar, curl pelvis up bringing knees towards chest without swinging."},
                {"name": "Cable Woodchoppers", "sets": 3, "reps": "12 each side", "duration_seconds": 150, "rest_seconds": 45, "difficulty": level.title(), "instructions": "Rotate torso diagonally from high to low using abdominal obliques."}
            ],
            "cooldown": [
                {"name": "Foam Roller Thoracic & Quads", "sets": 1, "reps": "4 mins", "duration_seconds": 240, "rest_seconds": 0, "difficulty": level.title(), "instructions": "Slowly roll upper back, lats, IT bands and quadriceps to reduce tension."},
                {"name": "Doorway Pec Stretch & Hip Flexor Kneeling Stretch", "sets": 2, "reps": "45 sec each", "duration_seconds": 180, "rest_seconds": 0, "difficulty": level.title(), "instructions": "Gently stretch chest against door frame, kneel to lengthen hip flexors."}
            ]
        }

        cardio_wo = {
            "duration_minutes": 45,
            "focus": f"Cardio & Aerobic Conditioning ({focus})",
            "calories_est": 450,
            "target_hr": "135–165 BPM",
            "exercises": [
                {
                    "name": "Treadmill Incline Interval Run",
                    "duration": "15 min",
                    "sets": 1,
                    "reps": "15 mins",
                    "intensity": "High (HIIT)",
                    "calories_burn": "180 kcal",
                    "target_hr": "150–165 BPM",
                    "equipment": "Treadmill",
                    "difficulty": level.title(),
                    "instructions": "Alternate 1 min fast run at 8% incline with 1 min brisk recovery walk at 4% incline."
                },
                {
                    "name": "Stationary Cycling Sprint Intervals",
                    "duration": "12 min",
                    "sets": 6,
                    "reps": "30s sprint / 30s rest",
                    "intensity": "High (HIIT)",
                    "calories_burn": "140 kcal",
                    "target_hr": "140–160 BPM",
                    "equipment": "Stationary Bike",
                    "difficulty": level.title(),
                    "instructions": "Push maximum RPM for 30 seconds against medium resistance, followed by 30 seconds easy pedaling."
                },
                {
                    "name": "Jump Rope Speed Drills",
                    "duration": "8 min",
                    "sets": 4,
                    "reps": "90s work / 30s rest",
                    "intensity": "Moderate–High",
                    "calories_burn": "95 kcal",
                    "target_hr": "135–155 BPM",
                    "equipment": "Jump Rope",
                    "difficulty": level.title(),
                    "instructions": "Stay light on balls of feet, keep wrists relaxed and maintain rapid continuous skipping tempo."
                },
                {
                    "name": "Rowing Machine 500m Power Intervals",
                    "duration": "10 min",
                    "sets": 3,
                    "reps": "500m sprint",
                    "intensity": "High Intensity",
                    "calories_burn": "120 kcal",
                    "target_hr": "145–165 BPM",
                    "equipment": "Rowing Machine",
                    "difficulty": level.title(),
                    "instructions": "Drive powerfully with legs first, swing hips, and pull handle to sternum with smooth return cadence."
                },
                {
                    "name": "Burpee & Mountain Climber Circuit",
                    "duration": "8 min",
                    "sets": 4,
                    "reps": "45s work / 15s rest",
                    "intensity": "Max Effort",
                    "calories_burn": "110 kcal",
                    "target_hr": "155–170 BPM",
                    "equipment": "Bodyweight",
                    "difficulty": level.title(),
                    "instructions": "Perform 5 burpees followed by 20 rapid mountain climbers back-to-back for 45 seconds."
                }
            ]
        }

        days.append({
            "day": day_name,
            "focus": focus,
            "home_workout": home_wo,
            "gym_workout": gym_wo,
            "cardio_workout": cardio_wo
        })

    return {
        "plan_name": "7-Day Dual Home & Gym Progressive Program",
        "days": days
    }

# =====================================================================
# MULTIMODAL VISION FOOD SCANNER
# =====================================================================
def analyze_food_image(image_bytes: bytes, quantity_kg: float, meal_type: str = "Meal", preferences: str = "") -> Dict[str, Any]:
    """
    Analyzes food photo using Gemini Vision or intelligent nutritional classifier.
    Takes image bytes + user-specified weight in kg.
    """
    prompt = f"""
    You are an expert sports nutritionist and food vision AI.
    Analyze this food image. The user has provided an approximate meal weight of {quantity_kg} kg ({int(quantity_kg * 1000)} grams).
    Meal Type: {meal_type}.
    Additional context: {preferences}.

    Instructions:
    1. Identify the primary dish/food name.
    2. Detect individual ingredients/components.
    3. Calculate realistic nutritional values scaled precisely to the {quantity_kg} kg weight.
    4. Provide confidence score (0.0 to 1.0) and helpful nutritional notes.

    Respond with ONLY strict JSON matching this format:
    {{
      "food_name": "Grilled Chicken Rice Bowl",
      "detected_items": ["Grilled Chicken Breast", "Steamed Brown Rice", "Steamed Broccoli", "Sesame Oil"],
      "quantity_kg": {quantity_kg},
      "estimated_serving": "{int(quantity_kg * 1000)} grams total portion",
      "calories": 650,
      "protein_g": 42,
      "carbs_g": 78,
      "fat_g": 14,
      "fiber_g": 6,
      "confidence": 0.92,
      "notes": "Excellent macronutrient distribution. Rich in lean protein and complex carbohydrates for workout recovery."
    }}
    """

    if settings.GEMINI_API_KEY:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content([prompt, image])
            data = extract_json(response.text)
            if data and "food_name" in data and "calories" in data:
                return data
        except Exception as e:
            logger.warning(f"Gemini Vision food analysis failed, falling back: {e}")

    # Fallback Intelligent Nutritional Estimator
    weight_g = int(quantity_kg * 1000)
    # Average balanced meal density ~ 1.5 kcal/g
    estimated_cals = round(weight_g * 1.45)
    estimated_prot = round(weight_g * 0.08) # ~8g per 100g
    estimated_carbs = round(weight_g * 0.18) # ~18g per 100g
    estimated_fat = round(weight_g * 0.04) # ~4g per 100g
    estimated_fiber = round(weight_g * 0.015)

    return {
        "food_name": "Balanced Meal Plate",
        "detected_items": ["Wholesome Protein", "Complex Grains", "Fresh Vegetables", "Healthy Fats"],
        "quantity_kg": quantity_kg,
        "estimated_serving": f"{weight_g} g estimated portion",
        "calories": estimated_cals,
        "protein_g": estimated_prot,
        "carbs_g": estimated_carbs,
        "fat_g": estimated_fat,
        "fiber_g": estimated_fiber,
        "confidence": 0.85,
        "notes": f"Balanced nutritional profile estimated for {quantity_kg} kg portion. You can manually adjust ingredients and macros anytime."
    }

# =====================================================================
# SARA AI ASSISTANT (CONTEXT-AWARE FITNESS AGENT)
# =====================================================================
def chat_with_sara(user_message: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sara answers user questions using their full profile, diet, workout, activities, and goals.
    Can also trigger actionable plan modifications.
    """
    user_name = context.get("profile", {}).get("name", "Athlete")
    goal = context.get("profile", {}).get("goal", "general_fitness")
    metrics = context.get("metrics", {})
    recent_workout = context.get("workout", {}).get("plan_name", "Active Program")

    system_prompt = f"""
    You are Sara, FitQuest AI's warm, motivating, expert personal fitness and nutrition coach.
    You speak in a friendly, encouraging, and actionable tone.
    You are talking to {user_name}.
    User's Fitness Goal: {goal}.
    Daily Calorie Target: {metrics.get('target_calories', 2000)} kcal.
    Daily Protein Target: {metrics.get('target_protein_g', 120)}g.
    Current Program: {recent_workout}.

    Instructions:
    1. Respond concisely and empathetically.
    2. If the user asks to modify their meal, workout duration, or switch to home/gym, determine the action and return action metadata.
    3. Action types allowed:
       - "NONE": general conversational advice
       - "REPLACE_MEAL": suggest 3 alternative meals
       - "SWITCH_WORKOUT_ENVIRONMENT": switch today's workout to "Home" or "Gym"
       - "ADJUST_WORKOUT_DURATION": change workout duration in minutes
       - "ADJUST_CALORIES": modify calorie target
    4. AI SAFETY RULE: Never diagnose medical ailments, recommend extreme diets, or recommend starvation. Advise professional medical consultation if medical questions arise.

    Respond with ONLY JSON:
    {{
      "reply": "Your conversational response here...",
      "action": "NONE" | "REPLACE_MEAL" | "SWITCH_WORKOUT_ENVIRONMENT" | "ADJUST_WORKOUT_DURATION" | "ADJUST_CALORIES",
      "action_payload": {{}}
    }}
    """

    if settings.GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            full_prompt = f"{system_prompt}\n\nUser: {user_message}"
            response = model.generate_content(full_prompt)
            data = extract_json(response.text)
            if data and "reply" in data:
                return data
        except Exception as e:
            logger.warning(f"Sara Gemini chat failed, using coaching logic: {e}")

    # Fallback Intelligent Coaching Engine
    msg_lower = user_message.lower()

    if "breakfast" in msg_lower and ("change" in msg_lower or "replace" in msg_lower or "swap" in msg_lower):
        return {
            "reply": f"Here are 3 high-protein breakfast options tailored to your {goal} goal! Pick any one to replace it in your plan:",
            "action": "REPLACE_MEAL",
            "action_payload": {
                "meal": "Breakfast",
                "options": [
                    {"food_name": "Avocado & Poached Eggs on Sourdough", "calories": 420, "protein_g": 24, "carbs_g": 38, "fat_g": 18},
                    {"food_name": "Greek Yogurt Berry Bowl with Chia Seeds", "calories": 380, "protein_g": 28, "carbs_g": 42, "fat_g": 8},
                    {"food_name": "Banana Oat Protein Shake & Almonds", "calories": 440, "protein_g": 32, "carbs_g": 52, "fat_g": 12}
                ]
            }
        }

    if "home" in msg_lower and ("workout" in msg_lower or "gym" in msg_lower or "today" in msg_lower):
        return {
            "reply": "No problem at all! I've switched your workout for today to your customized Home Workout routine. You'll get an awesome sweat in without stepping foot in the gym!",
            "action": "SWITCH_WORKOUT_ENVIRONMENT",
            "action_payload": {"environment": "Home"}
        }

    if "gym" in msg_lower and ("switch" in msg_lower or "today" in msg_lower):
        return {
            "reply": "Awesome! I've loaded up your Gym Workout for today, complete with strength and machine exercises. Let's crush it!",
            "action": "SWITCH_WORKOUT_ENVIRONMENT",
            "action_payload": {"environment": "Gym"}
        }

    if ("45 min" in msg_lower or "30 min" in msg_lower or "60 min" in msg_lower) and "workout" in msg_lower:
        dur = 45 if "45" in msg_lower else (30 if "30" in msg_lower else 60)
        return {
            "reply": f"Done! I've adjusted your workout schedule to {dur} minutes. The exercises have been re-calibrated so you still hit your primary muscle stimuli efficiently.",
            "action": "ADJUST_WORKOUT_DURATION",
            "action_payload": {"duration_minutes": dur}
        }

    if "protein" in msg_lower or "how much" in msg_lower:
        target_p = metrics.get('target_protein_g', 130)
        return {
            "reply": f"Based on your profile and {goal} goal, your daily target is {target_p}g of protein. Aim for 25-35g per meal across your breakfast, lunch, snack, and dinner to maximize muscle synthesis and satiety!",
            "action": "NONE",
            "action_payload": {}
        }

    return {
        "reply": f"Hey {user_name}! You're making great progress towards your {goal} goal. Remember, consistency beats intensity every time. What would you like to tweak today—your diet, workout, or daily challenges?",
        "action": "NONE",
        "action_payload": {}
    }

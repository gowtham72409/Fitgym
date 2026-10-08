# FitQuest AI — Your AI-Powered Fitness Journey

A mobile-first Progressive Web Application (PWA) designed and optimized for mobile devices (iOS Safari, Android Chrome, and standalone installed PWA). Powered by React, Vite, FastAPI, Google Firebase (Auth, Firestore, Storage), and Gemini Multimodal Vision & Text AI.

---

## 🌟 Key Highlights & Capabilities

1. **Mobile-First PWA Experience**
   - Installable to iPhone & Android home screens with standalone display mode.
   - Offline app shell caching via `service-worker.js`.
   - iPhone notch safe-area support (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
   - 44px+ touch targets, swipeable cards, bottom sheets, and sticky mobile headers.
   - Dedicated "Install FitQuest AI" dismissable banner.

2. **Isolated Multi-User Architecture**
   - Complete data isolation: Every profile, 7-day diet, workout, food scan, GPS activity, challenge, weight log, and Sara conversation is isolated by authenticated Firebase UID.
   - Privileged operations happen strictly via the FastAPI backend; private Firebase service credentials are never exposed to the frontend.

3. **17-Step Personalization Wizard**
   - Captures biological metrics, goals, experience, home/gym environment, schedule, dietary preferences (Veg, Non-veg, Vegan, Eggetarian), budget, allergies, disliked foods, and cuisines.
   - Calculates BMI, BMR (Mifflin-St Jeor formula), daily calorie targets, and protein requirements with safe wellness guidance (no crash diets).

4. **Fully Customizable 7-Day Diet Plan**
   - Sunday through Saturday, each day with 4 meals: Breakfast, Lunch, Snack, Dinner.
   - Exact quantities (e.g. 2 eggs, 150g rice), macros, and step-by-step recipes.
   - One-tap meal replacements (AI generates 3 targeted options), portion editor with automatic macro recalculation, and regeneration.

5. **7-Day Dual Workout System (Home & Gym)**
   - Every day provides both a dedicated Home Workout and Gym Workout.
   - Configurable duration: 30, 45, 60, 75, or 90 mins.
   - Structured in 6 modules: Warm-up, Mobility, Strength, Cardio Conditioning, Core, and Cool-down.
   - Exercise customizer: swap, remove, or reorder exercises.
   - **Live Workout Player**: Set-by-set checkoffs, countdown rest timer with Web Audio API chime and haptic vibration, and +100 XP completion rewards.

6. **AI Multimodal Food Scanner**
   - Mobile camera access (`accept="image/*"` with `capture="environment"`) & gallery picker.
   - Portion weight input in kg (0.25, 0.50, 0.75, 1.00 kg or custom).
   - Multimodal Vision AI detects ingredients and computes calories and macros.
   - Private storage in Firebase Storage under `users/{uid}/food-scans/{scanId}.jpg`.
   - Manual dish name correction and record deletion.

7. **Real-Time GPS Outdoor Activity Tracker**
   - Real browser/mobile geolocation (`navigator.geolocation.watchPosition`) for Walking, Running, Cycling, and Hiking.
   - Transparent location privacy disclosure before requesting permissions.
   - Interactive live Leaflet map rendering user's route polyline.
   - Live HUD: Distance (km), Duration (mm:ss), Speed (km/h), Pace (min/km), and Calories burned.
   - Customizable targets (Distance, Time, Calories, Free) and +75 XP rewards.

8. **Sara AI Fitness Assistant**
   - Floating action coach button available across all screens.
   - Context-aware: reads profile, calorie targets, today's workout, and recent activities.
   - Actionable: swaps meals, updates workout duration, and switches between home/gym routines on command.

9. **Gamification & Progress Tracking**
   - Level & XP progression engine (Level 1, Level 2, Level 3...) with anti-abuse protection.
   - Daily AI-personalized challenges (+50 XP).
   - Daily Check-in with mood, sleep, energy, and one-tap water tracker (+250ml per glass).
   - Body weight trend tracker with interactive SVG curve chart.
   - Monthly performance analytics & AI-generated consistency recap.
   - Customizable & reorderable dashboard widgets.

---

## 🏗️ Architecture & Technology Stack

```
Mobile PWA (iOS / Android)
    ↓
React + Vite (Vanilla CSS Design System)
    ↓
Render Static Site
    ↓
FastAPI REST API
    ↓
Google Firebase
    ├── Firebase Authentication (Email/Password, Google Sign-in)
    ├── Cloud Firestore (Document Database)
    ├── Firebase Storage (Encrypted User Media)
    └── Firebase App Check
    ↓
Gemini 1.5/2.0 Flash (Multimodal Vision & Coaching)
```

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app & CORS middleware
│   │   ├── config.py            # Environment configuration
│   │   ├── firebase.py          # Firebase Admin SDK & dev fallback
│   │   ├── auth.py              # Firebase token verification dependency
│   │   ├── firestore.py         # Firestore CRUD with user isolation
│   │   ├── storage.py           # Firebase Storage manager
│   │   ├── ai.py                # Gemini Vision, Text AI, and calculations
│   │   └── routes/
│   │       ├── auth_routes.py
│   │       ├── profile_routes.py
│   │       ├── plan_routes.py
│   │       ├── nutrition_routes.py
│   │       ├── activity_routes.py
│   │       ├── challenges_routes.py
│   │       ├── checkin_routes.py
│   │       ├── sara_routes.py
│   │       └── settings_routes.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── icons/               # 192x192, 512x512, maskable PWA icons
│   │   ├── manifest.webmanifest # PWA Web App Manifest
│   │   └── service-worker.js    # Offline caching service worker
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Onboarding/
│   │   │   ├── Home/
│   │   │   ├── Diet/
│   │   │   ├── Workout/
│   │   │   ├── Activity/
│   │   │   ├── FoodScanner/
│   │   │   ├── Challenges/
│   │   │   ├── CheckIn/
│   │   │   ├── Weight/
│   │   │   ├── Progress/
│   │   │   ├── Sara/
│   │   │   └── Settings/
│   │   ├── context/AuthContext.jsx
│   │   ├── services/api.js
│   │   ├── services/firebase.js
│   │   ├── styles/index.css     # Mobile design system & tokens
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── firebase/
│   ├── firestore.rules          # Strict user-isolated Firestore rules
│   └── storage.rules            # Secure user storage rules
├── render.yaml                  # Zero-downtime Render deployment blueprint
├── .gitignore
└── README.md
```

---

## 🚀 Running Locally

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start FastAPI server on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend includes a health check at `http://localhost:8000/health` and OpenAPI docs at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` on your mobile browser or emulator.

---

## ☁️ Deployment on Render

This repository includes a production-ready `render.yaml` configuration.

### 1. Frontend: Render Static Site
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: URL of your deployed backend (e.g. `https://fitquest-backend.onrender.com`)
  - `VITE_FIREBASE_API_KEY`: Your Firebase Web API key
  - `VITE_FIREBASE_AUTH_DOMAIN`: `your-app.firebaseapp.com`
  - `VITE_FIREBASE_PROJECT_ID`: `your-project-id`
  - `VITE_FIREBASE_STORAGE_BUCKET`: `your-project-id.appspot.com`

### 2. Backend: Render Web Service
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`
- **Environment Variables**:
  - `ENVIRONMENT`: `production`
  - `FRONTEND_URL`: URL of your deployed frontend
  - `GEMINI_API_KEY`: Google Gemini API key
  - `FIREBASE_PROJECT_ID`: Firebase project ID
  - `FIREBASE_CLIENT_EMAIL`: Service account client email
  - `FIREBASE_PRIVATE_KEY`: Service account private key (with escaped `\n` supported)
  - `FIREBASE_STORAGE_BUCKET`: Firebase storage bucket name

---

## 🔒 Security & Data Isolation
- **Authentication**: Firebase Authentication ID tokens verified on every privileged request.
- **Rules**: Cloud Firestore & Storage rules restrict access strictly to `request.auth.uid == userId`.
- **Zero Exposed Secrets**: Backend secrets, private keys, and AI keys are never compiled into the client bundle.

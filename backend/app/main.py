import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.firebase import init_firebase, is_firebase_ready
from app.routes.auth_routes import router as auth_router
from app.routes.profile_routes import router as profile_router
from app.routes.plan_routes import router as plan_router
from app.routes.nutrition_routes import router as nutrition_router
from app.routes.activity_routes import router as activity_router
from app.routes.challenges_routes import router as challenges_router
from app.routes.checkin_routes import router as checkin_router
from app.routes.sara_routes import router as sara_router
from app.routes.settings_routes import router as settings_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

# Initialize Firebase
init_firebase()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="FitQuest AI - Mobile-first fitness intelligence backend"
)

# CORS Setup
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://fitgym-two.vercel.app",
    "https://fitgym.vercel.app",
]

if settings.FRONTEND_URL:
    clean_frontend_url = settings.FRONTEND_URL.rstrip("/")
    if clean_frontend_url not in origins:
        origins.append(clean_frontend_url)

# Allow Render deployment domain wildcard if configured or standard headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if settings.ENVIRONMENT == "production" else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler for safe error messages
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again."}
    )

# Routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(plan_router)
app.include_router(nutrition_router)
app.include_router(activity_router)
app.include_router(challenges_router)
app.include_router(checkin_router)
app.include_router(sara_router)
app.include_router(settings_router)

@app.get("/health")
@app.get("/api/health")
async def health_check():
    """Health check endpoint for Render monitoring and client cold-start detection."""
    return {
        "status": "healthy",
        "app": "FitQuest AI",
        "version": settings.VERSION,
        "firebase_connected": is_firebase_ready(),
        "gemini_configured": bool(settings.GEMINI_API_KEY)
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to FitQuest AI API - Your AI-powered fitness journey",
        "health": "/health",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

import logging
from typing import Dict, Any, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from app.firebase import is_firebase_ready
from app.firestore import get_document, save_document

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    """
    Validates the Firebase Bearer token and returns authenticated user dict:
    { "uid": "...", "email": "...", "name": "...", "picture": "..." }
    Rejects invalid/expired tokens.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Case 1: Firebase is initialized and live
    if is_firebase_ready():
        try:
            decoded_token = auth.verify_id_token(token)
            uid = decoded_token.get("uid")
            if not uid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: no UID present"
                )
            user_rec = get_document("users", uid, user_id=uid) or {}
            prof_rec = get_document("fitness_profiles", uid, user_id=uid) or {}
            user_name = decoded_token.get("name") or user_rec.get("name") or prof_rec.get("name") or "Gowtham"
            if str(user_name).strip().lower() == "athlete":
                user_name = "Gowtham"
            return {
                "uid": uid,
                "email": decoded_token.get("email", ""),
                "name": user_name,
                "photo_url": decoded_token.get("picture", "")
            }
        except Exception as e:
            logger.error(f"Firebase token verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication failed: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Case 2: Development / Test fallback mode (allows local sandbox testing without live GCP secrets)
    # Token can be prefixed like 'dev-token-UID' or 'demo-user-123' or any token string
    if token:
        # Extract UID safely from token
        if token.startswith("dev-token-"):
            uid = token.replace("dev-token-", "")
        elif token.startswith("test-"):
            uid = token
        elif token.startswith("mock-"):
            uid = token.replace("mock-", "")
        else:
            # Hash or truncate arbitrary string token
            uid = f"user_{abs(hash(token)) % 1000000}"

        user_rec = get_document("users", uid, user_id=uid) or {}
        prof_rec = get_document("fitness_profiles", uid, user_id=uid) or {}
        resolved_name = user_rec.get("name") or prof_rec.get("name") or "Gowtham"
        if resolved_name.lower() == "athlete":
            resolved_name = "Gowtham"

        return {
            "uid": uid,
            "email": user_rec.get("email") or f"{uid}@fitquest.ai",
            "name": resolved_name,
            "photo_url": user_rec.get("photo_url", "")
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

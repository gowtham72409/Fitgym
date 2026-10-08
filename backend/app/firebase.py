import json
import logging
import os
from typing import Optional, Dict, Any
import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
from app.config import settings

logger = logging.getLogger(__name__)

_firebase_initialized = False
_db = None
_bucket = None

def init_firebase():
    global _firebase_initialized, _db, _bucket
    if _firebase_initialized:
        return _db

    cred = None
    try:
        # 1. Direct JSON string
        if settings.FIREBASE_CREDENTIALS_JSON:
            cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
            cred = credentials.Certificate(cred_dict)
            logger.info("Firebase initialized via FIREBASE_CREDENTIALS_JSON")

        # 2. Individual environment variables (common in Render)
        elif settings.FIREBASE_PROJECT_ID and settings.FIREBASE_CLIENT_EMAIL and settings.FIREBASE_PRIVATE_KEY:
            private_key = settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n')
            cred_dict = {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key": private_key,
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
            cred = credentials.Certificate(cred_dict)
            logger.info("Firebase initialized via individual credentials")

        # 3. Path to credentials file if specified
        elif os.path.exists("service-account.json"):
            cred = credentials.Certificate("service-account.json")
            logger.info("Firebase initialized via service-account.json")

    except Exception as e:
        logger.warning(f"Failed to load Firebase credentials: {e}")

    if cred:
        try:
            storage_bucket = settings.FIREBASE_STORAGE_BUCKET or f"{settings.FIREBASE_PROJECT_ID}.appspot.com"
            app = firebase_admin.initialize_app(cred, {
                'storageBucket': storage_bucket
            })
            _db = firestore.client()
            _bucket = storage.bucket()
            _firebase_initialized = True
            logger.info("Firebase Admin successfully connected to Firestore and Storage")
            return _db
        except Exception as e:
            logger.error(f"Error initializing Firebase Admin app: {e}")

    logger.warning("Running Firebase in fallback memory mode (credentials not configured)")
    _firebase_initialized = False
    return None

def get_db():
    global _db
    if _db is None:
        init_firebase()
    return _db

def get_storage_bucket():
    global _bucket
    if _bucket is None:
        init_firebase()
    return _bucket

def is_firebase_ready() -> bool:
    return _firebase_initialized

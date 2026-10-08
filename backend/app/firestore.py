import time
import logging
from typing import Dict, Any, List, Optional
from app.firebase import get_db, is_firebase_ready

logger = logging.getLogger(__name__)

# Fallback in-memory store for local development/testing without live Firebase credentials
_mock_store: Dict[str, Dict[str, Dict[str, Any]]] = {}

def _get_mock_collection(col_name: str) -> Dict[str, Dict[str, Any]]:
    if col_name not in _mock_store:
        _mock_store[col_name] = {}
    return _mock_store[col_name]

def save_document(collection: str, doc_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Save or update a document in Firestore, with timestamp."""
    data = dict(data)
    if "updated_at" not in data:
        data["updated_at"] = time.time()
    if "created_at" not in data:
        data["created_at"] = time.time()

    db = get_db()
    if db is not None:
        try:
            db.collection(collection).document(doc_id).set(data, merge=True)
            return data
        except Exception as e:
            logger.error(f"Firestore save error on {collection}/{doc_id}: {e}")

    # Fallback in-memory
    col = _get_mock_collection(collection)
    if doc_id in col:
        existing = col[doc_id]
        existing.update(data)
        col[doc_id] = existing
    else:
        col[doc_id] = data
    return col[doc_id]

def get_document(collection: str, doc_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Retrieve a document and enforce user isolation."""
    db = get_db()
    if db is not None:
        try:
            doc = db.collection(collection).document(doc_id).get()
            if doc.exists:
                data = doc.to_dict()
                if user_id and data.get("user_id") and data.get("user_id") != user_id:
                    return None
                return data
            return None
        except Exception as e:
            logger.error(f"Firestore get error on {collection}/{doc_id}: {e}")

    # Fallback in-memory
    col = _get_mock_collection(collection)
    data = col.get(doc_id)
    if data and user_id and data.get("user_id") and data.get("user_id") != user_id:
        return None
    return data

def list_documents(collection: str, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Query documents for a specific user."""
    db = get_db()
    if db is not None:
        try:
            docs = (
                db.collection(collection)
                .where("user_id", "==", user_id)
                .order_by("created_at", direction="DESCENDING")
                .limit(limit)
                .stream()
            )
            return [d.to_dict() for d in docs]
        except Exception as e:
            # If compound index error or order_by issue, fallback to un-ordered where
            try:
                docs = (
                    db.collection(collection)
                    .where("user_id", "==", user_id)
                    .limit(limit)
                    .stream()
                )
                items = [d.to_dict() for d in docs]
                items.sort(key=lambda x: x.get("created_at", 0), reverse=True)
                return items
            except Exception as e2:
                logger.error(f"Firestore query error on {collection}: {e2}")

    # Fallback in-memory
    col = _get_mock_collection(collection)
    results = [v for v in col.values() if v.get("user_id") == user_id]
    results.sort(key=lambda x: x.get("created_at", 0), reverse=True)
    return results[:limit]

def delete_document(collection: str, doc_id: str, user_id: str) -> bool:
    """Delete a document if owned by user."""
    existing = get_document(collection, doc_id, user_id=user_id)
    if not existing:
        return False

    db = get_db()
    if db is not None:
        try:
            db.collection(collection).document(doc_id).delete()
            return True
        except Exception as e:
            logger.error(f"Firestore delete error on {collection}/{doc_id}: {e}")

    col = _get_mock_collection(collection)
    if doc_id in col:
        del col[doc_id]
        return True
    return False

def purge_all_user_data(user_id: str) -> Dict[str, int]:
    """Wipe all user data across all collections upon account deletion."""
    collections = [
        "users", "fitness_profiles", "diet_plans", "workout_plans",
        "nutrition_logs", "activities", "challenges", "challenge_history",
        "daily_checkins", "weight_history", "daily_history",
        "monthly_summaries", "chat_history", "settings",
        "dashboard_preferences", "notification_preferences"
    ]
    counts = {}
    for col_name in collections:
        items = list_documents(col_name, user_id, limit=500)
        del_count = 0
        for item in items:
            doc_id = item.get("id") or item.get("doc_id") or user_id
            if delete_document(col_name, doc_id, user_id):
                del_count += 1
        # Also direct delete if doc_id was user_id
        delete_document(col_name, user_id, user_id)
        counts[col_name] = del_count
    return counts

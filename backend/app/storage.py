import logging
import base64
from typing import Optional
from app.firebase import get_storage_bucket, is_firebase_ready

logger = logging.getLogger(__name__)

# Fallback store for base64 / blob data in local development mode
_local_media_store = {}

def upload_user_file(uid: str, folder: str, filename: str, file_bytes: bytes, content_type: str = "image/jpeg") -> str:
    """
    Uploads a file to Firebase Storage under users/{uid}/{folder}/{filename}.
    Returns the storage path or accessible URL.
    """
    storage_path = f"users/{uid}/{folder}/{filename}"

    if is_firebase_ready():
        bucket = get_storage_bucket()
        if bucket:
            try:
                blob = bucket.blob(storage_path)
                blob.upload_from_string(file_bytes, content_type=content_type)
                logger.info(f"Uploaded file to Firebase Storage: {storage_path}")
                return storage_path
            except Exception as e:
                logger.error(f"Failed to upload file to Firebase Storage: {e}")

    # Fallback storage: store base64 data url for preview
    data_url = f"data:{content_type};base64,{base64.b64encode(file_bytes).decode('utf-8')}"
    _local_media_store[storage_path] = data_url
    return storage_path

def get_file_url(storage_path: str) -> Optional[str]:
    """Returns local base64 or storage reference."""
    if storage_path in _local_media_store:
        return _local_media_store[storage_path]
    return f"/media/{storage_path}"

def delete_user_file(storage_path: str, uid: str) -> bool:
    """Delete file if it belongs to user."""
    if not storage_path.startswith(f"users/{uid}/"):
        return False

    if is_firebase_ready():
        bucket = get_storage_bucket()
        if bucket:
            try:
                blob = bucket.blob(storage_path)
                blob.delete()
                return True
            except Exception as e:
                logger.error(f"Failed to delete Firebase Storage file {storage_path}: {e}")

    if storage_path in _local_media_store:
        del _local_media_store[storage_path]
        return True
    return False

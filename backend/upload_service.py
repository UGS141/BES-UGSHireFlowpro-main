import os
import uuid
import logging
from typing import Optional
from fastapi import UploadFile
from fastapi.responses import JSONResponse
from db import db
from models import FileRef, now_iso, new_id
from storage import put_object, APP_NAME

logger = logging.getLogger("ugs.upload_service")

# Validation Profiles
PROFILES = {
    "resume": {
        "allowed_extensions": {"pdf"},
        "max_size": 5 * 1024 * 1024,  # 5 MB
        "invalid_ext_msg": "Only PDF resumes are accepted.",
        "too_large_msg": "Maximum allowed file size is 5 MB.",
        "invalid_ext_code": "INVALID_FILE_TYPE",
        "too_large_code": "FILE_TOO_LARGE",
    },
    "placement_image": {
        "allowed_extensions": {"jpg", "jpeg", "png", "webp"},
        "max_size": 5 * 1024 * 1024,  # 5 MB
        "invalid_ext_msg": "Only JPG, JPEG, PNG, or WEBP images are accepted.",
        "too_large_msg": "Maximum allowed file size is 5 MB.",
        "invalid_ext_code": "INVALID_FILE_TYPE",
        "too_large_code": "FILE_TOO_LARGE",
    },
    "logo": {
        "allowed_extensions": {"png", "jpg", "jpeg", "svg"},
        "max_size": 2 * 1024 * 1024,  # 2 MB
        "invalid_ext_msg": "Only PNG, JPG, or SVG images are accepted.",
        "too_large_msg": "Maximum allowed file size is 2 MB.",
        "invalid_ext_code": "INVALID_FILE_TYPE",
        "too_large_code": "FILE_TOO_LARGE",
    },
    "default": {
        "allowed_extensions": {"pdf", "jpg", "jpeg", "png", "webp", "doc", "docx"},
        "max_size": 10 * 1024 * 1024,  # 10 MB
        "invalid_ext_msg": "Unsupported file format.",
        "too_large_msg": "File size exceeds 10 MB limit.",
        "invalid_ext_code": "INVALID_FILE_TYPE",
        "too_large_code": "FILE_TOO_LARGE",
    }
}

LOCAL_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")


class UploadValidationError(Exception):
    def __init__(self, error_code: str, message: str, details: str = ""):
        self.error_code = error_code
        self.message = message
        self.details = details


def get_profile_for_label(label: str) -> dict:
    lbl = (label or "").lower().strip()
    if lbl == "resume":
        return PROFILES["resume"]
    elif lbl in ("placement", "placement_candidate", "candidate_photo", "photo"):
        return PROFILES["placement_image"]
    elif lbl in ("logo", "company_logo", "organization_logo"):
        return PROFILES["logo"]
    else:
        return PROFILES["default"]


async def process_and_save_upload(
    file: UploadFile,
    owner_id: Optional[str] = None,
    candidate_id: Optional[str] = None,
    label: Optional[str] = "document"
) -> dict:
    """
    Unified upload service that validates files based on label profiles,
    attempts remote object storage upload, falls back to local storage if remote fails,
    and returns a FileRef model dict.
    Raises UploadValidationError on failure.
    """
    if not file or not file.filename:
        raise UploadValidationError("UPLOAD_FAILED", "No file was uploaded.", "UploadFile object is empty.")

    # 1. Determine profile and validate extension
    profile = get_profile_for_label(label)
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
    
    if ext not in profile["allowed_extensions"]:
        raise UploadValidationError(
            error_code=profile["invalid_ext_code"],
            message=profile["invalid_ext_msg"],
            details=f"File extension '{ext}' is not allowed for label '{label}'."
        )

    # 2. Read and validate size
    try:
        data = await file.read()
    except Exception as e:
        logger.error(f"Read upload stream failed: {e}")
        raise UploadValidationError("UPLOAD_FAILED", "Unable to read uploaded file.", str(e))

    size = len(data)
    if size > profile["max_size"]:
        raise UploadValidationError(
            error_code=profile["too_large_code"],
            message=profile["too_large_msg"],
            details=f"File size {size} bytes exceeds maximum allowed {profile['max_size']} bytes."
        )

    # 3. Storage
    storage_path = None
    is_local = False
    
    cloudinary_cloud = os.environ.get("CLOUDINARY_CLOUD_NAME")
    cloudinary_key = os.environ.get("CLOUDINARY_API_KEY")
    cloudinary_secret = os.environ.get("CLOUDINARY_API_SECRET")
    
    if cloudinary_cloud and cloudinary_key and cloudinary_secret:
        try:
            import cloudinary
            import cloudinary.uploader
            
            cloudinary.config(
                cloud_name=cloudinary_cloud,
                api_key=cloudinary_key,
                api_secret=cloudinary_secret,
                secure=True
            )
            
            clean_filename = f"{new_id()}"
            public_id = f"ugs-hireflow/uploads/{owner_id or 'public'}/{clean_filename}"
            
            logger.info(f"Uploading file to Cloudinary: {public_id}")
            result = cloudinary.uploader.upload(
                data,
                public_id=public_id,
                resource_type="auto"
            )
            
            storage_path = result.get("secure_url")
            if not storage_path:
                raise Exception("Cloudinary secure_url is missing from upload result")
                
            logger.info(f"Successfully uploaded to Cloudinary: {storage_path}")
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {e}")
            if os.environ.get("EMERGENT_LLM_KEY"):
                try:
                    logger.info("Attempting fallback to Emergent Object Storage...")
                    remote_path = f"{APP_NAME}/uploads/{owner_id or 'public'}/{new_id()}.{ext}"
                    result = put_object(remote_path, data, file.content_type or "application/octet-stream")
                    storage_path = result["path"]
                except Exception as ex:
                    logger.error(f"Emergent Object Storage fallback failed: {ex}")
                    raise UploadValidationError(
                        error_code="UPLOAD_FAILED",
                        message="Cloudinary and fallback remote storage failed.",
                        details=f"Cloudinary: {e}. Fallback: {ex}"
                    )
            else:
                raise UploadValidationError(
                    error_code="UPLOAD_FAILED",
                    message="Cloudinary upload failed.",
                    details=str(e)
                )
    else:
        # Fall back to Emergent Object Storage if configured
        if os.environ.get("EMERGENT_LLM_KEY"):
            try:
                remote_path = f"{APP_NAME}/uploads/{owner_id or 'public'}/{new_id()}.{ext}"
                result = put_object(remote_path, data, file.content_type or "application/octet-stream")
                storage_path = result["path"]
            except Exception as e:
                logger.error(f"Emergent Object Storage upload failed: {e}")
                if os.environ.get("RENDER") or os.environ.get("PORT"):
                    raise UploadValidationError(
                        error_code="UPLOAD_FAILED",
                        message="Remote storage failed.",
                        details=str(e)
                    )
                else:
                    is_local = True
        else:
            if os.environ.get("RENDER") or os.environ.get("PORT"):
                raise UploadValidationError(
                    error_code="STORAGE_MISCONFIGURED",
                    message="Remote storage is not configured.",
                    details="Neither Cloudinary nor Emergent Object Storage is configured in this environment."
                )
            else:
                is_local = True

    # 4. Fallback local storage (only for development/local environment)
    if is_local:
        user_folder = os.path.join(LOCAL_UPLOAD_DIR, owner_id or "public")
        try:
            os.makedirs(user_folder, exist_ok=True)
            filename = f"{new_id()}.{ext}"
            full_local_path = os.path.join(user_folder, filename)
            
            with open(full_local_path, "wb") as f:
                f.write(data)
                
            relative_path = os.path.join("uploads", owner_id or "public", filename).replace("\\", "/")
            storage_path = f"local://{relative_path}"
        except Exception as le:
            logger.error(f"Local storage fallback failed: {le}")
            raise UploadValidationError(
                error_code="UPLOAD_FAILED",
                message="Unable to upload file locally.",
                details=str(le)
            )

    # 5. Create FileRef
    file_ref = FileRef(
        storage_path=storage_path,
        original_filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        size=size,
        owner_id=owner_id
    )

    # 6. DB write
    try:
        await db.files.insert_one(file_ref.model_dump())
    except Exception as db_err:
        logger.error(f"FileRef DB insert failed: {db_err}")
        raise UploadValidationError(
            error_code="DATABASE_ERROR",
            message="File upload database sync failed.",
            details=str(db_err)
        )

    # 7. Candidate Update if candidate_id provided
    if candidate_id:
        try:
            if label in ("resume", "photo"):
                await db.candidates.update_one(
                    {"id": candidate_id},
                    {"$set": {f"{label}_file_id": file_ref.id, "updated_at": now_iso()}}
                )
            else:
                await db.candidates.update_one(
                    {"id": candidate_id},
                    {"$push": {
                        "documents": {
                            "id": new_id(),
                            "label": label,
                            "file_id": file_ref.id,
                            "uploaded_at": now_iso()
                        }
                    }, "$set": {"updated_at": now_iso()}}
                )
        except Exception as cand_err:
            logger.error(f"Candidate file link update failed: {cand_err}")
            raise UploadValidationError(
                error_code="DATABASE_ERROR",
                message="Failed to link uploaded file to candidate record.",
                details=str(cand_err)
            )

    return file_ref.model_dump()

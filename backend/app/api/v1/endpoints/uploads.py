
import os
import uuid
import io
import asyncio

import cloudinary
import cloudinary.uploader

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.models.user import User
from app.api.deps import require_staff
from app.core.config import settings

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_MODEL_EXTENSIONS = {".glb", ".gltf"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def check_cloudinary_config():
    if not all([
        settings.CLOUDINARY_CLOUD_NAME,
        settings.CLOUDINARY_API_KEY,
        settings.CLOUDINARY_API_SECRET,
    ]):
        raise HTTPException(
            status_code=503,
            detail="Cloudinary storage is not configured."
        )

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


async def upload_to_cloudinary(content, **options):
    try:
        return await asyncio.to_thread(
            cloudinary.uploader.upload,
            io.BytesIO(content),
            **options
        )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="File upload to cloud storage failed."
        )


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    staff: User = Depends(require_staff)
):
    check_cloudinary_config()

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format. Use JPEG, PNG, WEBP or GIF."
        )

    content = await file.read(MAX_FILE_SIZE + 1)

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds maximum 50MB limit."
        )

    filename = f"img_{uuid.uuid4().hex[:12]}"

    result = await upload_to_cloudinary(
        content,
        resource_type="image",
        folder="itflow3d/images",
        public_id=filename,
    )

    return {
        "url": result["secure_url"],
        "filename": result["public_id"],
        "content_type": file.content_type
    }


@router.post("/model")
async def upload_3d_model(
    file: UploadFile = File(...),
    staff: User = Depends(require_staff)
):
    check_cloudinary_config()

    ext = os.path.splitext(file.filename or "")[1].lower()

    if ext not in ALLOWED_MODEL_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported 3D model format. Use .glb or .gltf."
        )

    content = await file.read(MAX_FILE_SIZE + 1)

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds maximum 50MB limit."
        )

    filename = f"model_{uuid.uuid4().hex[:12]}{ext}"

    result = await upload_to_cloudinary(
        content,
        resource_type="raw",
        folder="itflow3d/models",
        public_id=filename,
    )

    return {
        "url": result["secure_url"],
        "filename": result["public_id"],
        "format": ext.replace(".", "")
    }

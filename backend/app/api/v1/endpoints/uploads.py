import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.models.user import User
from app.api.deps import require_staff

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_MODEL_EXTENSIONS = {".glb", ".gltf"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    staff: User = Depends(require_staff)
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image format '{file.content_type}'. Supported: JPEG, PNG, WEBP, GIF."
        )

    ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
    filename = f"img_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = os.path.join("uploads", "images", filename)

    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    async with aiofiles.open(dest_path, "wb") as out_file:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds maximum 50MB limit.")
        await out_file.write(content)

    return {
        "url": f"/uploads/images/{filename}",
        "filename": filename,
        "content_type": file.content_type
    }


@router.post("/model")
async def upload_3d_model(
    file: UploadFile = File(...),
    staff: User = Depends(require_staff)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_MODEL_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid 3D model format '{ext}'. Supported formats: .glb, .gltf."
        )

    filename = f"model_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = os.path.join("uploads", "models", filename)

    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    async with aiofiles.open(dest_path, "wb") as out_file:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds maximum 50MB limit.")
        await out_file.write(content)

    return {
        "url": f"/uploads/models/{filename}",
        "filename": filename,
        "format": ext.replace(".", "")
    }

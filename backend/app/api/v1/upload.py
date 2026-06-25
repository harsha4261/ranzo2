import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", response_model=dict)
async def upload_file(file: UploadFile = File(...)):
    try:
        # Generate a unique filename
        ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_url = f"/uploads/{unique_filename}"
        return {"url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

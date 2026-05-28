"""
KrishiMitra — Leaf Disease Diagnosis Router
=============================================
POST /diagnose — Upload a leaf image, get disease diagnosis.
Uses Gemini Vision under the hood.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException  # type: ignore[import]
from ..services.gemini_vision import analyze_leaf_image
router = APIRouter()


@router.post("/")
async def diagnose_leaf(image: UploadFile = File(...)):
    """
    Upload a leaf image to receive a disease diagnosis and treatment advice.
    Accepts: JPEG, PNG, WEBP images up to 10MB.
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {image.content_type}. Allowed: {allowed_types}"  # IgnoreNonFunctionalErrors
        )
    try:
        # Read image bytes
        image_bytes = await image.read()

        # Analyze using Gemini Vision service
        result = await analyze_leaf_image(image_bytes, image.content_type)

        if result["status"] == "error":
            raise HTTPException(status_code=502, detail=result["message"])

        return {
            "status": "success",
            "filename": image.filename,
            "diagnosis": result["diagnosis"]
        }

    except HTTPException:
        raise
    except Exception as e:
        detail = f"Failed to process diagnosis: {e}"
        raise HTTPException(
            status_code=500,
            detail=detail,
        ) from e

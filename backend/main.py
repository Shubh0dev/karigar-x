import logging
import os
from datetime import datetime
from typing import List, Optional

from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend/.env regardless of current working directory
_BACKEND_DIR = Path(__file__).resolve().parent
_ENV_FILE = _BACKEND_DIR / ".env"
if _ENV_FILE.is_file():
    load_dotenv(dotenv_path=_ENV_FILE, override=True)
else:
    load_dotenv(override=True)


from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.ai_provider import AIProvider, ProductAnalysis, CatalogueResult
from services.demo_provider import DemoProvider
from services.gemini_provider import GeminiProvider
from services.photo_studio_service import (
    get_photo_studio_provider,
    PhotoStyle,
)
from services.pricing_service import PricingRequest, PricingResponse, predict_fair_price

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="KARIGAR X API",
    description="AI-Driven Market Linkage & Smart Cataloging Backend for Marginalized Artisans",
    version="0.3.0",
)

# Configure CORS for local frontend development (any local network origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AI Provider Selection ---
# Uses Gemini if GOOGLE_API_KEY is set, otherwise Demo Mode
_ai_provider: AIProvider

if os.environ.get("GOOGLE_API_KEY"):
    _ai_provider = GeminiProvider()
    logger.info("AI Provider: Google Gemini Flash (free-tier)")
else:
    _ai_provider = DemoProvider()
    logger.info("AI Provider: Demo Mode (no API key configured)")

# --- Photo Studio Provider Selection ---
# Uses StabilityProvider if STABILITY_API_KEY is set, otherwise DemoStudioProvider.
# SECURITY: The key is read here and stored inside the provider. It is NEVER
# forwarded to the frontend, logged, or included in any API response.
_photo_studio_provider = get_photo_studio_provider()

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}


# ─── Core Endpoints ────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    provider_name = type(_ai_provider).__name__
    studio_provider_name = type(_photo_studio_provider).__name__
    return {
        "name": "KARIGAR X Backend Service",
        "status": "online",
        "ai_provider": provider_name,
        "photo_studio_provider": studio_provider_name,
        "message": "Welcome to KARIGAR X API Service",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    provider_name = type(_ai_provider).__name__
    studio_provider_name = type(_photo_studio_provider).__name__
    return {
        "status": "ok",
        "service": "KARIGAR X Backend",
        "version": "0.3.0",
        "ai_provider": provider_name,
        "photo_studio_provider": studio_provider_name,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


# ─── Product Analysis & Catalogue ─────────────────────────────────────────────

@app.post("/api/product/analyze", response_model=ProductAnalysis)
async def analyze_product_image(image: UploadFile = File(...)):
    """
    Analyze a product image and extract structured craft attributes.

    Accepts: multipart/form-data with 'image' file field.
    Returns: ProductAnalysis JSON with category, material, craft_type, colors, style, visible_features.
    """
    if image.content_type and image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type '{image.content_type}'. Allowed: JPEG, PNG, WEBP, HEIC.",
        )

    image_bytes = await image.read()
    if len(image_bytes) > MAX_IMAGE_SIZE:
        size_mb = len(image_bytes) / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"Image too large ({size_mb:.1f} MB). Maximum allowed: 10 MB.",
        )

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file received.")

    logger.info(
        f"Analyzing image: {image.filename} ({len(image_bytes)} bytes, {image.content_type})"
    )

    result = await _ai_provider.analyze_image(image_bytes, image.filename or "upload.jpg")
    return result


class CatalogueRequest(BaseModel):
    """Request body for catalogue generation."""
    analysis: ProductAnalysis
    transcript: str = ""


@app.post("/api/product/catalogue", response_model=CatalogueResult)
async def generate_product_catalogue(request: CatalogueRequest):
    """
    Generate a structured product catalogue from image analysis + voice transcript.

    Accepts: JSON body with 'analysis' (ProductAnalysis) and 'transcript' (string).
    Returns: CatalogueResult JSON with title, description, features, tags, category, material, craft_type.
    """
    logger.info(
        f"Generating catalogue for category='{request.analysis.category}', "
        f"transcript_len={len(request.transcript)}"
    )

    result = await _ai_provider.generate_catalogue(request.analysis, request.transcript)
    return result


# ─── Pricing ──────────────────────────────────────────────────────────────────

@app.post("/api/pricing/predict", response_model=PricingResponse)
async def predict_pricing(req: PricingRequest):
    """
    Predict fair selling price for a product using XGBoost ML module.
    Returns predicted price, range, and cost breakdown.
    """
    logger.info(
        f"Predicting price for {req.category} "
        f"(Material Cost: {req.material_cost}, Labour: {req.labour_hours}h @ {req.labour_rate}/h)"
    )
    result = predict_fair_price(req)
    return result


# ─── Photo Studio ──────────────────────────────────────────────────────────────

def _validate_studio_image(image: UploadFile, image_bytes: bytes) -> None:
    """Shared validation for photo studio uploads."""
    if image.content_type and image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type '{image.content_type}'. Allowed: JPEG, PNG, WEBP, HEIC.",
        )
    if len(image_bytes) > MAX_IMAGE_SIZE:
        size_mb = len(image_bytes) / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"Image too large ({size_mb:.1f} MB). Maximum: 10 MB.",
        )
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file received.")


class DetectedObjectOut(BaseModel):
    index: int
    label: str
    label_hi: str
    confidence: float
    is_primary_candidate: bool
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float


class StudioAnalyzeResponse(BaseModel):
    detected_objects: List[DetectedObjectOut]
    primary_object_index: int
    object_count: int
    is_multi_object: bool
    demo_mode: bool
    method: str


class StudioEnhanceResponse(BaseModel):
    success: bool
    result_image_base64: str
    stages_completed: List[str]
    method: str
    demo_mode: bool
    style: str
    warning: Optional[str] = None
    error_code: Optional[str] = None
    message: Optional[str] = None


@app.post("/api/photo-studio/analyze", response_model=StudioAnalyzeResponse)
async def photo_studio_analyze(image: UploadFile = File(...)):
    """
    KARIGAR X AI Photo Studio — Step 1: Object Detection

    Detects distinct objects in the artisan's photo and identifies the primary
    product candidate. Returns bounding boxes and confidence scores for each
    detected object so the artisan can select their hero product.

    Accepts: multipart/form-data with 'image' file field (JPEG/PNG/WEBP).
    Returns: StudioAnalyzeResponse with detected_objects list and primary_object_index.
    """
    image_bytes = await image.read()
    _validate_studio_image(image, image_bytes)

    logger.info(
        f"[PhotoStudio] analyze — {image.filename} "
        f"({len(image_bytes)} bytes, {image.content_type})"
    )

    result = await _photo_studio_provider.analyze_image(
        image_bytes,
        image.filename or "product.jpg",
        image.content_type or "image/jpeg",
    )

    return StudioAnalyzeResponse(
        detected_objects=[
            DetectedObjectOut(
                index=obj.index,
                label=obj.label,
                label_hi=obj.label_hi,
                confidence=obj.confidence,
                is_primary_candidate=obj.is_primary_candidate,
                bbox_x=obj.bbox_x,
                bbox_y=obj.bbox_y,
                bbox_w=obj.bbox_w,
                bbox_h=obj.bbox_h,
            )
            for obj in result.detected_objects
        ],
        primary_object_index=result.primary_object_index,
        object_count=result.object_count,
        is_multi_object=result.is_multi_object,
        demo_mode=result.demo_mode,
        method=result.method,
    )


@app.post("/api/photo-studio/enhance", response_model=StudioEnhanceResponse)
async def photo_studio_enhance(
    image: UploadFile = File(...),
    style: str = Form("marketplace"),
    selected_object_index: int = Form(0),
    use_demo: bool = Form(False),
    crop_x: Optional[float] = Form(None),
    crop_y: Optional[float] = Form(None),
    crop_w: Optional[float] = Form(None),
    crop_h: Optional[float] = Form(None),
):
    """
    KARIGAR X AI Photo Studio — Full Enhancement Pipeline
    Quality Pipeline V2: isolates primary product crop, generates Bria cutout,
    applies studio background, grounding contact shadow, and 2x fidelity enhancement.
    """
    image_bytes = await image.read()
    _validate_studio_image(image, image_bytes)

    # Validate and normalise style
    try:
        photo_style = PhotoStyle(style.lower())
    except ValueError:
        photo_style = PhotoStyle.MARKETPLACE

    crop = None
    if crop_x is not None and crop_y is not None and crop_w is not None and crop_h is not None:
        crop = (float(crop_x), float(crop_y), float(crop_w), float(crop_h))

    logger.info(
        f"[PhotoStudio] enhance — {image.filename} "
        f"({len(image_bytes)} bytes), style={photo_style.value}, "
        f"selected_object={selected_object_index}, crop={crop}, use_demo={use_demo}"
    )

    provider = _photo_studio_provider
    if use_demo:
        from services.demo_studio_provider import DemoStudioProvider
        provider = DemoStudioProvider()

    result = await provider.enhance_product(
        image_bytes,
        image.filename or "product.jpg",
        image.content_type or "image/jpeg",
        photo_style,
        selected_object_index,
        crop=crop,
    )

    return StudioEnhanceResponse(
        success=result.success,
        result_image_base64=result.result_image_base64,
        stages_completed=result.stages_completed,
        method=result.method,
        demo_mode=result.demo_mode,
        style=result.style,
        warning=result.warning,
        error_code=result.error_code,
        message=result.message,
    )

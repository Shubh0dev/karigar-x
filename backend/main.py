import logging
import os
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.ai_provider import AIProvider, ProductAnalysis, CatalogueResult
from services.demo_provider import DemoProvider
from services.gemini_provider import GeminiProvider

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="KARIGAR X API",
    description="AI-Driven Market Linkage & Smart Cataloging Backend for Marginalized Artisans",
    version="0.2.0",
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

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}


@app.get("/")
def read_root():
    provider_name = type(_ai_provider).__name__
    return {
        "name": "KARIGAR X Backend Service",
        "status": "online",
        "ai_provider": provider_name,
        "message": "Welcome to KARIGAR X API Service",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    provider_name = type(_ai_provider).__name__
    return {
        "status": "ok",
        "service": "KARIGAR X Backend",
        "version": "0.2.0",
        "ai_provider": provider_name,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@app.post("/api/product/analyze", response_model=ProductAnalysis)
async def analyze_product_image(image: UploadFile = File(...)):
    """
    Analyze a product image and extract structured craft attributes.
    
    Accepts: multipart/form-data with 'image' file field.
    Returns: ProductAnalysis JSON with category, material, craft_type, colors, style, visible_features.
    """
    # Validate content type
    if image.content_type and image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type '{image.content_type}'. Allowed: JPEG, PNG, WEBP, HEIC.",
        )

    # Read and validate size
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

from services.pricing_service import PricingRequest, PricingResponse, predict_fair_price

@app.post("/api/pricing/predict", response_model=PricingResponse)
async def predict_pricing(req: PricingRequest):
    """
    Predict fair selling price for a product using XGBoost ML module.
    Returns predicted price, range, and cost breakdown.
    """
    logger.info(f"Predicting price for {req.category} (Material Cost: {req.material_cost}, Labour: {req.labour_hours}h @ {req.labour_rate}/h)")
    result = predict_fair_price(req)
    return result


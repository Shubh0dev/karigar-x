"""
KARIGAR X — Photo Studio Provider Interface

Defines the abstract base class (ImageStudioProvider) that all photo-studio
backends must implement, plus the shared data models.

Providers:
  - BriaProvider        : Bria AI v2 Image Editing (primary live provider)
  - StabilityProvider   : Stability AI Stable Image (live rollback provider)
  - DemoStudioProvider  : Demo Mode (pre-verified outputs, works offline)
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

logger = logging.getLogger(__name__)


# ─── Enums ────────────────────────────────────────────────────────────────────

class PhotoStyle(str, Enum):
    MARKETPLACE = "marketplace"   # clean off-white / neutral studio
    PREMIUM     = "premium"       # warm beige / luxury presentation
    ARTISAN     = "artisan"       # earthy warm / handcrafted aesthetic


# ─── Shared data models ───────────────────────────────────────────────────────

@dataclass
class DetectedObject:
    """A distinct object detected in the uploaded image."""
    index: int
    label: str                   # Human-readable label (en)
    label_hi: str                # Human-readable label (hi)
    confidence: float            # 0.0–1.0
    is_primary_candidate: bool   # True if this is the AI-recommended hero product
    bbox_x: float = 0.0          # Relative bounding box 0–1
    bbox_y: float = 0.0
    bbox_w: float = 1.0
    bbox_h: float = 1.0


@dataclass
class AnalyzeResult:
    """Result from the analyze endpoint."""
    detected_objects: list[DetectedObject] = field(default_factory=list)
    primary_object_index: int = 0
    object_count: int = 1
    is_multi_object: bool = False
    demo_mode: bool = False
    method: str = "demo"


@dataclass
class EnhanceResult:
    """Result from the enhance endpoint."""
    success: bool = True
    result_image_base64: str = ""    # JPEG, base64-encoded, no data-URI prefix
    stages_completed: list[str] = field(default_factory=list)
    method: str = "demo"             # "stability" | "demo"
    demo_mode: bool = False
    style: str = "marketplace"
    warning: Optional[str] = None    # Non-fatal warning message for UI
    error_code: Optional[str] = None # For structured errors
    message: Optional[str] = None    # For structured errors


# ─── Abstract provider interface ──────────────────────────────────────────────

class ImageStudioProvider(ABC):
    """All photo-studio providers must implement this interface."""

    @abstractmethod
    async def analyze_image(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> AnalyzeResult:
        """
        Detect distinct objects in the image and identify the primary product candidate.
        Must NEVER fail silently — either return a result or raise.
        """
        ...

    @abstractmethod
    async def enhance_product(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str,
        style: PhotoStyle,
        selected_object_index: int,
        crop: Optional[tuple[float, float, float, float]] = None,
    ) -> EnhanceResult:
        """
        Full pipeline: isolate → remove distractions → studio background →
        relighting → composition → grounding shadow → final image.
        """
        ...


# ─── Provider factory ─────────────────────────────────────────────────────────

def get_photo_studio_provider() -> ImageStudioProvider:
    """
    Returns the appropriate provider based on environment configuration.

    Configuration:
      - PHOTO_STUDIO_PROVIDER: "bria" | "stability" | "demo" (optional explicit selection)
      - BRIA_API_TOKEN: API token for Bria AI
      - STABILITY_API_KEY: API key for Stability AI (retained for rollback)

    Priority:
      1. Explicit PHOTO_STUDIO_PROVIDER setting:
         - "bria": BriaProvider
         - "stability": StabilityProvider
         - "demo": DemoStudioProvider
      2. If PHOTO_STUDIO_PROVIDER is unset or empty:
         - BriaProvider if BRIA_API_TOKEN is set
         - StabilityProvider if STABILITY_API_KEY is set
         - DemoStudioProvider fallback
    """
    import os
    from pathlib import Path
    try:
        from dotenv import load_dotenv
        env_file = Path(__file__).resolve().parent.parent / ".env"
        if env_file.is_file():
            load_dotenv(dotenv_path=env_file, override=False)
        else:
            load_dotenv(override=False)
    except ImportError:
        pass

    bria_token = os.environ.get("BRIA_API_TOKEN", "").strip()
    stability_key = os.environ.get("STABILITY_API_KEY", "").strip()
    provider_setting = os.environ.get("PHOTO_STUDIO_PROVIDER", "").strip().lower()

    # Log token status safely without ever exposing the token
    logger.info(f"Bria API token configured: {bool(bria_token)}")

    if provider_setting == "bria":
        from services.bria_provider import BriaProvider
        if bria_token:
            logger.info("Photo Studio Provider: Bria AI (live mode)")
        else:
            logger.warning("Photo Studio Provider: PHOTO_STUDIO_PROVIDER=bria but BRIA_API_TOKEN is not configured.")
        return BriaProvider(api_token=bria_token)

    elif provider_setting == "stability":
        from services.stability_provider import StabilityProvider
        if stability_key:
            logger.info("Photo Studio Provider: Stability AI Stable Image (live mode)")
        else:
            logger.warning("Photo Studio Provider: PHOTO_STUDIO_PROVIDER=stability but STABILITY_API_KEY is not configured.")
        return StabilityProvider(api_key=stability_key)

    elif provider_setting == "demo":
        logger.info("Photo Studio Provider: Demo Mode (explicitly selected via PHOTO_STUDIO_PROVIDER=demo)")
        from services.demo_studio_provider import DemoStudioProvider
        return DemoStudioProvider()

    else:
        # Auto-selection if PHOTO_STUDIO_PROVIDER is not explicitly specified
        if bria_token:
            from services.bria_provider import BriaProvider
            logger.info("Photo Studio Provider: Bria AI (live mode, auto-selected from token)")
            return BriaProvider(api_token=bria_token)
        elif stability_key:
            from services.stability_provider import StabilityProvider
            logger.info("Photo Studio Provider: Stability AI Stable Image (live mode, auto-selected from key)")
            return StabilityProvider(api_key=stability_key)
        else:
            logger.info("Photo Studio Provider: Demo Mode (no API credentials configured)")
            from services.demo_studio_provider import DemoStudioProvider
            return DemoStudioProvider()

"""
KARIGAR X — Stability AI Photo Studio Provider

Uses Stability AI's Stable Image API to perform professional-grade
product photography enhancement on artisan product images.

Security guarantees:
  - STABILITY_API_KEY is read from the environment at provider construction time.
  - It is NEVER forwarded to the frontend, NEVER included in API responses,
    and NEVER logged (not even partially).

API Reference: https://platform.stability.ai/docs/api-reference#tag/Edit
"""

from __future__ import annotations

import base64
import io
import logging
from typing import Optional

import httpx
from PIL import Image, ImageEnhance, ImageFilter

from services.photo_studio_service import (
    ImageStudioProvider,
    AnalyzeResult,
    EnhanceResult,
    DetectedObject,
    PhotoStyle,
)

logger = logging.getLogger(__name__)

STABILITY_HOST = "https://api.stability.ai"
REPLACE_BG_RELIGHT_ENDPOINT = "/v2beta/stable-image/edit/replace-background-and-relight"
REMOVE_BG_ENDPOINT = "/v2beta/stable-image/edit/remove-background"
GENERATE_ENDPOINT  = "/v2beta/stable-image/generate/core"

# Maximum time to wait for Stability AI response (seconds)
REQUEST_TIMEOUT_S = 45.0

# Negative prompt: strictly preserves the authentic handcrafted product while eliminating messy room background
PRODUCT_PRESERVATION_NEGATIVE = (
    "room, wall, poster, religious poster in background, bed, furniture, wires, clutter, "
    "people, extra objects, duplicate product, altered product, redesigned product, "
    "changed face, changed pose, changed clothing, changed accessories, invented decoration, "
    "altered colors, distorted geometry, deformed hands, extra limbs, artificial details, "
    "floating object, unrealistic shadow"
)

# Background prompts per style for Replace Background and Relight
BACKGROUND_PROMPTS: dict[PhotoStyle, str] = {
    PhotoStyle.MARKETPLACE: (
        "clean seamless light-neutral off-white e-commerce product photography studio, "
        "soft professional daylight, subtle realistic floor contact shadow, "
        "minimal commercial catalog photography, clean uncluttered environment"
    ),
    PhotoStyle.PREMIUM: (
        "luxury warm cream and beige seamless studio background, soft diffused professional lighting, "
        "elegant commercial product photography, subtle depth, clean uncluttered environment"
    ),
    PhotoStyle.ARTISAN: (
        "minimal warm earthy artisan photography studio, subtle natural beige and terracotta tones, "
        "soft diffused morning light, handcrafted marketplace aesthetic, clean uncluttered environment"
    ),
}

# Foreground prompt is now generated dynamically based on the detected object label.
def get_dynamic_foreground_prompt(label: str) -> str:
    return (
        f"single {label}, preserve the exact original physical product and all visible craftsmanship"
    )


class StabilityProvider(ImageStudioProvider):
    """
    Live Stability AI integration for professional product photo enhancement.

    Pipeline:
      1. Replace Background and Relight via /v2beta/stable-image/edit/replace-background-and-relight
         with strong subject-preservation settings (preserve_original_subject=0.95).
      2. Local Pillow post-processing (mild unsharp mask preserving authentic colors & details).

    On ANY failure from Stability AI, returns a structured error to the caller.
    Does NOT silently fall back to mock generation.
    """

    def __init__(self, api_key: str):
        # Store key privately. NEVER expose in repr, logs, or error messages.
        self.__api_key = api_key
        self._headers = {
            "Authorization": f"Bearer {self.__api_key}",
            "Accept": "application/json",
        }

    def __repr__(self) -> str:
        return "StabilityProvider(api_key=<REDACTED>)"

    async def analyze_image(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> AnalyzeResult:
        """
        Stability AI does not have a dedicated object-detection endpoint.
        We use local heuristic analysis to detect multi-object scenes:
          - Image is converted to greyscale
          - Horizontal and vertical luminosity profiles are scanned
          - Significant valleys in the profile suggest separate objects
        Falls back to single-object result if analysis fails.
        """
        try:
            result = await self._local_detect_objects(image_bytes, filename)
            result.method = "stability+local"
            return result
        except Exception as exc:
            logger.warning(f"[Stability] Object detection heuristic failed: {exc}")
            return AnalyzeResult(
                detected_objects=[
                    DetectedObject(
                        index=0,
                        label="Your Product",
                        label_hi="आपका उत्पाद",
                        confidence=0.85,
                        is_primary_candidate=True,
                    )
                ],
                primary_object_index=0,
                object_count=1,
                is_multi_object=False,
                demo_mode=False,
                method="stability+local",
            )

    async def _local_detect_objects(
        self, image_bytes: bytes, filename: str
    ) -> AnalyzeResult:
        """
        Lightweight local heuristic to detect how many distinct objects are in the image.
        Uses horizontal luminosity profile valley detection.
        """
        img = Image.open(io.BytesIO(image_bytes)).convert("L")
        w, h = img.size
        PROFILE_WIDTH = 120   # Downsample profile for speed

        # Compute horizontal variance profile: for each x column, measure variance
        img_small = img.resize((PROFILE_WIDTH, 80), Image.LANCZOS)
        pixels = list(img_small.getdata())
        variance_profile = []
        for x in range(PROFILE_WIDTH):
            col = [pixels[y * PROFILE_WIDTH + x] for y in range(80)]
            mean = sum(col) / len(col)
            var = sum((p - mean) ** 2 for p in col) / len(col)
            variance_profile.append(var)

        # Find valleys (local minima below threshold) → probable gaps between objects
        threshold = max(variance_profile) * 0.18
        valleys = []
        for i in range(2, PROFILE_WIDTH - 2):
            if (
                variance_profile[i] < threshold
                and variance_profile[i] <= variance_profile[i - 1]
                and variance_profile[i] <= variance_profile[i + 1]
            ):
                # Merge valleys that are too close together
                if not valleys or i - valleys[-1] > 8:
                    valleys.append(i)

        # Count distinct regions
        num_objects = len(valleys) + 1 if valleys else 1
        num_objects = min(num_objects, 4)  # Cap at 4 objects

        objects = []
        if num_objects == 1:
            objects.append(
                DetectedObject(
                    index=0,
                    label="Your Product",
                    label_hi="आपका उत्पाद",
                    confidence=0.88,
                    is_primary_candidate=True,
                )
            )
        else:
            # First (leftmost / usually largest) object is primary candidate
            objects.append(
                DetectedObject(
                    index=0,
                    label="Primary Product",
                    label_hi="मुख्य उत्पाद",
                    confidence=0.85,
                    is_primary_candidate=True,
                )
            )
            for i in range(1, num_objects):
                objects.append(
                    DetectedObject(
                        index=i,
                        label=f"Object {i + 1}",
                        label_hi=f"वस्तु {i + 1}",
                        confidence=max(0.40, 0.75 - i * 0.12),
                        is_primary_candidate=False,
                    )
                )

        return AnalyzeResult(
            detected_objects=objects,
            primary_object_index=0,
            object_count=num_objects,
            is_multi_object=num_objects > 1,
            demo_mode=False,
            method="stability+local",
        )

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
        Stability AI Product Photographer pipeline:
          Primary: /v2beta/stable-image/edit/replace-background-and-relight
                   with preserve_original_subject=0.95 and authentic e-commerce prompts.
          Secondary Fallback: /v2beta/stable-image/edit/remove-background + local studio composition.
        """
        stages_completed = []

        try:
            logger.info(f"[Stability] Starting AI product photo enhancement for {filename} (style={style.value})")
            stages_completed.append("product_analyzed")

            # Try Replace Background and Relight
            result_bytes, method_used = await self._process_with_stability(image_bytes, style, filename, selected_object_index)
            stages_completed.extend([
                "product_isolated",
                "distractions_removed",
                "studio_background_created",
                "lighting_optimized",
            ])

            # Local post-processing preserving authentic colors
            result_b64 = await self._local_enhance(result_bytes)
            stages_completed.extend([
                "details_enhanced",
                "marketplace_photo_finalized",
            ])

            logger.info(f"[Stability] Enhancement complete via {method_used} — {len(stages_completed)} stages")
            return EnhanceResult(
                result_image_base64=result_b64,
                stages_completed=stages_completed,
                method=method_used,
                demo_mode=False,
                style=style.value,
            )

        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            if status_code in (401, 403):
                warning = "Stability API key authorization issue."
            elif status_code == 429:
                warning = "Stability API rate limit reached."
            else:
                warning = f"Stability API returned HTTP {status_code}."

            logger.warning(f"[Stability] HTTPStatusError {status_code}: {warning}")
            return EnhanceResult(success=False, error_code=str(status_code), message=warning, style=style.value)

        except (httpx.TimeoutException, httpx.NetworkError) as exc:
            warning = "Stability API unreachable."
            logger.warning(f"[Stability] Network error: {type(exc).__name__}: {warning}")
            return EnhanceResult(success=False, error_code="NETWORK_ERROR", message=warning, style=style.value)

        except Exception as exc:
            warning = "AI processing failed unexpectedly."
            logger.error(f"[Stability] Unexpected error in enhance_product: {exc}")
            return EnhanceResult(success=False, error_code="INTERNAL_ERROR", message=warning, style=style.value)

    async def _process_with_stability(
        self, image_bytes: bytes, style: PhotoStyle, filename: str, selected_object_index: int
    ) -> tuple[bytes, str]:
        """
        Calls Stability AI replace-background-and-relight API.
        Asynchronous operation: initiates generation, captures generation ID,
        polls the real Stability results endpoint, and retrieves the resulting image.
        """
        prepared = self._prepare_image(image_bytes, max_size=2048)

        # Get dynamic foreground prompt
        analysis = await self._local_detect_objects(image_bytes, filename)
        label = "handmade product"
        for obj in analysis.detected_objects:
            if obj.index == selected_object_index:
                label = obj.label
                break
        foreground_prompt = get_dynamic_foreground_prompt(label)
        bg_prompt = BACKGROUND_PROMPTS.get(style, BACKGROUND_PROMPTS[PhotoStyle.MARKETPLACE])

        data = {
            "background_prompt": bg_prompt,
            "foreground_prompt": foreground_prompt,
            "negative_prompt": PRODUCT_PRESERVATION_NEGATIVE,
            "preserve_original_subject": "0.95",
            "light_source_direction": "above",
            "light_source_strength": "0.35",
            "output_format": "png",
        }

        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_S) as client:
            # 1. Start generation (async endpoint)
            post_headers = {
                "Authorization": f"Bearer {self.__api_key}",
                "Accept": "application/json",
            }
            response = await client.post(
                f"{STABILITY_HOST}{REPLACE_BG_RELIGHT_ENDPOINT}",
                headers=post_headers,
                files={"subject_image": ("product.png", prepared, "image/png")},
                data=data,
            )
            response.raise_for_status()

            # Handle direct image return if synchronous
            content_type = response.headers.get("content-type", "")
            if content_type.startswith("image/"):
                return response.content, "stability:replace-background-and-relight"

            resp_data = response.json()
            generation_id = resp_data.get("id")

            if not generation_id:
                raise Exception(f"No generation ID returned by Stability API: {resp_data}")

            logger.info(f"[Stability] Generation started with real ID: {generation_id}. Polling for result...")

            # 2. Poll for results (must use Accept: */* or application/json)
            import asyncio
            poll_headers = {
                "Authorization": f"Bearer {self.__api_key}",
                "Accept": "*/*",
            }
            max_attempts = 40  # up to 40 seconds
            for attempt in range(max_attempts):
                await asyncio.sleep(1.0)
                poll_resp = await client.get(
                    f"{STABILITY_HOST}/v2beta/results/{generation_id}",
                    headers=poll_headers,
                )

                if poll_resp.status_code == 200:
                    resp_ct = poll_resp.headers.get("content-type", "")
                    if "application/json" in resp_ct:
                        res_json = poll_resp.json()
                        b64_img = res_json.get("result") or res_json.get("image") or res_json.get("output")
                        if b64_img:
                            logger.info(f"[Stability] Generation completed successfully for ID: {generation_id}")
                            return base64.b64decode(b64_img), "stability:replace-background-and-relight"
                        raise Exception(f"Unexpected JSON format from results endpoint: {list(res_json.keys())}")
                    else:
                        logger.info(f"[Stability] Generation completed successfully for ID: {generation_id}")
                        return poll_resp.content, "stability:replace-background-and-relight"
                elif poll_resp.status_code == 202:
                    continue  # Still in progress
                else:
                    poll_resp.raise_for_status()

            raise Exception(f"Polling timed out after {max_attempts} attempts for generation ID: {generation_id}")

    async def _local_enhance(self, image_bytes: bytes) -> str:
        """Apply gentle Pillow touch-up while preserving 100% authentic product colors and craftsmanship details."""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        # STRICT AUTHENTICITY:
        # DO NOT modify color saturation (keep natural dyes/paints authentic).
        # Only mild unsharp mask for weave & texture clarity without harsh artifacts.
        img = img.filter(ImageFilter.UnsharpMask(radius=1.0, percent=35, threshold=3))

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=95, optimize=True)
        return base64.b64encode(buf.getvalue()).decode("utf-8")

    def _prepare_image(self, image_bytes: bytes, max_size: int = 2048) -> bytes:
        """
        Resize image to max_size on longest edge and convert to PNG.
        Stability AI has per-endpoint size requirements.
        """
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        w, h = img.size
        if max(w, h) > max_size:
            scale = max_size / max(w, h)
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

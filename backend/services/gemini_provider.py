"""
Google Gemini Flash AI Provider for KARIGAR X.

Uses the free-tier Gemini Flash vision model (15 RPM / 1M tokens per day free).
Only activated when the GOOGLE_API_KEY environment variable is set.
Falls back to DemoProvider on any error.

API keys are NEVER exposed to the frontend — they exist only here in the backend.
"""

import json
import logging
import os

from .ai_provider import AIProvider, ProductAnalysis, CatalogueResult
from .demo_provider import DemoProvider

logger = logging.getLogger(__name__)

_ANALYZE_PROMPT = """You are a handicraft product analyst for Indian artisans.
Analyze this product image and return ONLY a JSON object with these exact fields:
{
  "category": "Primary craft category (e.g. Terracotta & Clay, Blue Pottery, Dhokra Brass, Carved Woodwork, Handloom Textiles, Folk Paintings)",
  "material": "Primary material used",
  "craft_type": "Crafting technique used",
  "colors": ["list", "of", "dominant", "colors"],
  "style": "Artistic style or regional tradition",
  "visible_features": ["list", "of", "key", "visual", "features"]
}
Return ONLY valid JSON. No markdown, no explanation."""

_CATALOGUE_PROMPT = """You are an AI catalogue generator for Indian handicraft products.
Given the product analysis and artisan's voice description, generate a structured catalogue listing.

Product Analysis:
{analysis_json}

Artisan's Description:
"{transcript}"

Return ONLY a JSON object with these exact fields:
{{
  "title": "Product listing title (compelling, descriptive, under 80 chars)",
  "description": "Rich product description combining craft story and artisan's words (2-3 sentences)",
  "features": ["list", "of", "5-7", "key", "product", "features"],
  "tags": ["list", "of", "5-8", "searchable", "tags"],
  "category": "Final craft category",
  "material": "Primary material",
  "craft_type": "Craft technique"
}}
Return ONLY valid JSON. No markdown, no explanation."""


class GeminiProvider(AIProvider):
    """Google Gemini Flash vision provider (free-tier)."""

    def __init__(self):
        self._api_key = os.environ.get("GOOGLE_API_KEY", "")
        self._fallback = DemoProvider()
        self._client = None

        if self._api_key:
            try:
                from google import genai

                self._client = genai.Client(api_key=self._api_key)
                logger.info("Gemini provider initialized successfully")
            except ImportError:
                logger.warning(
                    "google-genai package not installed. Falling back to Demo Mode."
                )
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini client: {e}")

    def _parse_json_response(self, text: str) -> dict:
        """Extract JSON from Gemini response, handling markdown code blocks."""
        cleaned = text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            # Remove first line (```json) and last line (```)
            json_lines = []
            in_block = False
            for line in lines:
                if line.strip().startswith("```") and not in_block:
                    in_block = True
                    continue
                elif line.strip() == "```" and in_block:
                    break
                elif in_block:
                    json_lines.append(line)
            cleaned = "\n".join(json_lines)

        return json.loads(cleaned)

    async def analyze_image(self, image_bytes: bytes, filename: str) -> ProductAnalysis:
        if not self._client:
            logger.info("No Gemini client available, using Demo fallback")
            return await self._fallback.analyze_image(image_bytes, filename)

        try:
            from google.genai import types

            # Determine MIME type
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpeg"
            mime_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
            mime_type = mime_map.get(ext, "image/jpeg")

            response = self._client.models.generate_content(
                model="gemini-2.0-flash",
                contents=[
                    types.Content(
                        parts=[
                            types.Part(text=_ANALYZE_PROMPT),
                            types.Part(inline_data=types.Blob(mime_type=mime_type, data=image_bytes)),
                        ]
                    )
                ],
            )

            data = self._parse_json_response(response.text)
            return ProductAnalysis(**data)

        except Exception as e:
            logger.error(f"Gemini analyze_image failed: {e}. Falling back to Demo.")
            return await self._fallback.analyze_image(image_bytes, filename)

    async def generate_catalogue(
        self, analysis: ProductAnalysis, transcript: str
    ) -> CatalogueResult:
        if not self._client:
            return await self._fallback.generate_catalogue(analysis, transcript)

        try:
            prompt = _CATALOGUE_PROMPT.format(
                analysis_json=analysis.model_dump_json(indent=2),
                transcript=transcript[:500],
            )

            response = self._client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )

            data = self._parse_json_response(response.text)
            return CatalogueResult(**data)

        except Exception as e:
            logger.error(f"Gemini generate_catalogue failed: {e}. Falling back to Demo.")
            return await self._fallback.generate_catalogue(analysis, transcript)

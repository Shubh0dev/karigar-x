"""
AI Provider abstraction layer for KARIGAR X.

This module defines the abstract interface and Pydantic models
that all AI providers (Demo, Gemini, future Ollama, etc.) must implement.
The backend selects the active provider at startup based on environment variables.
"""

from abc import ABC, abstractmethod
from pydantic import BaseModel, Field


class ProductAnalysis(BaseModel):
    """Structured attributes extracted from a product image."""

    category: str = Field(description="Primary craft category, e.g. Terracotta, Pottery")
    material: str = Field(description="Primary material, e.g. Clay, Brass, Teak Wood")
    craft_type: str = Field(description="Craft technique, e.g. Hand-molded, Lost-wax casting")
    colors: list[str] = Field(default_factory=list, description="Dominant colors visible")
    style: str = Field(description="Artistic style, e.g. Traditional Bankura, Mughal Floral")
    visible_features: list[str] = Field(
        default_factory=list,
        description="Key visual features, e.g. ['horse figurine', 'ochre pigment', 'kiln-fired']",
    )


class CatalogueResult(BaseModel):
    """Structured catalogue listing generated from image analysis + voice transcript."""

    title: str = Field(description="Product listing title")
    description: str = Field(description="Rich craft story / product description")
    features: list[str] = Field(default_factory=list, description="Key product feature bullet points")
    tags: list[str] = Field(default_factory=list, description="Searchable marketplace tags")
    category: str = Field(description="Final craft category")
    material: str = Field(description="Primary material")
    craft_type: str = Field(description="Craft technique")


class AIProvider(ABC):
    """Abstract base class for AI service providers."""

    @abstractmethod
    async def analyze_image(self, image_bytes: bytes, filename: str) -> ProductAnalysis:
        """Analyze a product image and return structured attributes."""
        ...

    @abstractmethod
    async def generate_catalogue(
        self, analysis: ProductAnalysis, transcript: str
    ) -> CatalogueResult:
        """Combine image analysis + voice transcript into a structured catalogue listing."""
        ...

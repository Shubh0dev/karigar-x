"""
Demo Mode AI Provider for KARIGAR X.

Returns deterministic, realistic Indian handicraft product analysis
and catalogue results. Always available — no external dependencies.

This is the default provider when no AI API key is configured.
"""

import hashlib
from .ai_provider import AIProvider, ProductAnalysis, CatalogueResult


# Deterministic demo responses keyed by simple hash buckets
_DEMO_ANALYSES = [
    ProductAnalysis(
        category="Terracotta & Clay",
        material="Natural Alluvial Clay",
        craft_type="Hand-molded & Kiln-fired",
        colors=["Earthy Red", "Ochre", "Brown"],
        style="Traditional Bankura Heritage",
        visible_features=[
            "Horse figurine",
            "Hand-wheel molded body",
            "Natural earth pigment coating",
            "Wood-kiln fired finish",
            "Folk art detailing",
        ],
    ),
    ProductAnalysis(
        category="Blue Pottery & Ceramics",
        material="Quartz Powder & Glass Frit",
        craft_type="Quartz-glazed Hand-painted",
        colors=["Cobalt Blue", "White", "Turquoise"],
        style="Mughal Floral Jaipur",
        visible_features=[
            "Floral vine motifs",
            "Cobalt oxide hand-painting",
            "Glossy glaze finish",
            "Symmetrical design",
            "Vase form factor",
        ],
    ),
    ProductAnalysis(
        category="Dhokra & Brass Craft",
        material="Recycled Bell Metal Brass",
        craft_type="Lost-wax (Cire Perdue) Casting",
        colors=["Antique Gold", "Dark Bronze", "Patina Green"],
        style="Bastar Tribal Folk Art",
        visible_features=[
            "Peacock lamp motif",
            "Hand-spun wax wirework",
            "Tribal geometric patterns",
            "Hollow-cast body",
            "Oil lamp reservoir",
        ],
    ),
    ProductAnalysis(
        category="Carved Woodwork",
        material="Seasoned Sheesham / Teak Wood",
        craft_type="Hand-carved & Brass Inlay",
        colors=["Dark Walnut", "Honey Brown", "Brass Gold"],
        style="Saharanpur Jaali Work",
        visible_features=[
            "Intricate jaali lattice pattern",
            "Brass wire inlay border",
            "Jewelry box form",
            "Hinged lid with clasp",
            "Polished lacquer finish",
        ],
    ),
    ProductAnalysis(
        category="Handloom Textiles",
        material="Handspun Cotton & Silk Blend",
        craft_type="Handwoven Ikat / Pochampally",
        colors=["Indigo Blue", "Crimson Red", "Ivory White"],
        style="Pochampally Double Ikat",
        visible_features=[
            "Geometric diamond ikat pattern",
            "Resist-dyed warp and weft",
            "Selvedge border design",
            "Soft drape fabric",
            "Natural dye undertones",
        ],
    ),
    ProductAnalysis(
        category="Folk Paintings",
        material="Handmade Paper & Natural Pigments",
        craft_type="Hand-painted Madhubani / Mithila",
        colors=["Vermillion Red", "Black", "Turmeric Yellow", "Leaf Green"],
        style="Madhubani Bharni Style",
        visible_features=[
            "Fish & lotus motifs",
            "Double-line border technique",
            "Cross-hatching fill pattern",
            "Mythological scene depiction",
            "Natural ink outlines",
        ],
    ),
]


def _hash_to_index(data: bytes) -> int:
    """Deterministic hash → index mapping for consistent demo responses."""
    h = hashlib.md5(data[:2048]).hexdigest()
    return int(h, 16) % len(_DEMO_ANALYSES)


class DemoProvider(AIProvider):
    """Demo Mode provider returning deterministic craft analysis."""

    async def analyze_image(self, image_bytes: bytes, filename: str) -> ProductAnalysis:
        idx = _hash_to_index(image_bytes) if image_bytes else 0
        return _DEMO_ANALYSES[idx]

    async def generate_catalogue(
        self, analysis: ProductAnalysis, transcript: str
    ) -> CatalogueResult:
        # Build a rich catalogue from the analysis + transcript
        transcript_snippet = transcript.strip()[:200] if transcript else ""

        title = f"Handcrafted {analysis.category} — {analysis.style}"

        description_parts = [
            f"Authentic {analysis.craft_type.lower()} craftsmanship using {analysis.material.lower()}.",
        ]
        if transcript_snippet:
            description_parts.append(
                f"In the artisan's own words: \"{transcript_snippet}\""
            )
        description_parts.append(
            f"This piece showcases the {analysis.style.lower()} tradition "
            f"with {', '.join(analysis.colors[:2]).lower()} tones."
        )
        description = " ".join(description_parts)

        features = [
            f"Material: {analysis.material}",
            f"Technique: {analysis.craft_type}",
            f"Style: {analysis.style}",
            f"Colors: {', '.join(analysis.colors)}",
        ] + [f"Feature: {f}" for f in analysis.visible_features[:3]]

        tags = [
            analysis.category.split("&")[0].strip().lower().replace(" ", "-"),
            analysis.material.split("/")[0].strip().lower().replace(" ", "-"),
            analysis.craft_type.split("(")[0].strip().lower().replace(" ", "-"),
            "indian-handicraft",
            "artisan-made",
            "fair-trade",
            "handmade",
        ]

        return CatalogueResult(
            title=title,
            description=description,
            features=features,
            tags=tags,
            category=analysis.category,
            material=analysis.material,
            craft_type=analysis.craft_type,
        )

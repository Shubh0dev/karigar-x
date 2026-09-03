/**
 * KARIGAR X API Client
 *
 * Communicates with the FastAPI backend for AI product analysis and catalogue generation.
 * Falls back to client-side demo data if the backend is unreachable.
 */

import { ProductAnalysis, CatalogueResult, PricingPrediction } from "./types";

const BACKEND_URL = "http://localhost:8000";

// ---- Demo Fallback Data ----
const DEMO_ANALYSIS: ProductAnalysis = {
  category: "Terracotta & Clay",
  material: "Natural Alluvial Clay",
  craft_type: "Hand-molded & Kiln-fired",
  colors: ["Earthy Red", "Ochre", "Brown"],
  style: "Traditional Bankura Heritage",
  visible_features: [
    "Horse figurine",
    "Hand-wheel molded body",
    "Natural earth pigment coating",
    "Wood-kiln fired finish",
    "Folk art detailing",
  ],
};

const DEMO_CATALOGUE: CatalogueResult = {
  title: "Handcrafted Terracotta Heritage Horse — Traditional Bankura",
  description:
    "Authentic hand-molded & kiln-fired craftsmanship using natural alluvial clay. This piece showcases the traditional Bankura heritage tradition with earthy red and ochre tones. A masterwork of folk artisan heritage passed down through generations.",
  features: [
    "Material: Natural Alluvial Clay",
    "Technique: Hand-molded & Kiln-fired",
    "Style: Traditional Bankura Heritage",
    "Colors: Earthy Red, Ochre, Brown",
    "Feature: Horse figurine",
    "Feature: Hand-wheel molded body",
    "Feature: Natural earth pigment coating",
  ],
  tags: [
    "terracotta",
    "natural-alluvial-clay",
    "hand-molded",
    "indian-handicraft",
    "artisan-made",
    "fair-trade",
    "handmade",
  ],
  category: "Terracotta & Clay",
  material: "Natural Alluvial Clay",
  craft_type: "Hand-molded & Kiln-fired",
};

/**
 * Send a product image to the backend for AI analysis.
 * Falls back to demo data if backend is unreachable.
 */
export async function analyzeProductImage(
  imageFile: File
): Promise<{ data: ProductAnalysis; isDemo: boolean }> {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(`${BACKEND_URL}/api/product/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data: ProductAnalysis = await response.json();
    return { data, isDemo: false };
  } catch (err) {
    console.warn("Backend unreachable for /api/product/analyze, using Demo Mode:", err);
    return { data: DEMO_ANALYSIS, isDemo: true };
  }
}

/**
 * Generate a structured catalogue from image analysis + voice transcript.
 * Falls back to demo data if backend is unreachable.
 */
export async function generateCatalogue(
  analysis: ProductAnalysis,
  transcript: string
): Promise<{ data: CatalogueResult; isDemo: boolean }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/product/catalogue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis, transcript }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data: CatalogueResult = await response.json();
    return { data, isDemo: false };
  } catch (err) {
    console.warn("Backend unreachable for /api/product/catalogue, using Demo Mode:", err);

    // Build demo catalogue incorporating the real transcript if available
    const demoResult = { ...DEMO_CATALOGUE };
    if (transcript.trim()) {
      demoResult.description = `${DEMO_CATALOGUE.description} In the artisan's own words: "${transcript.trim().slice(0, 200)}"`;
    }
    if (analysis.category) {
      demoResult.category = analysis.category;
      demoResult.material = analysis.material;
      demoResult.craft_type = analysis.craft_type;
    }
    return { data: demoResult, isDemo: true };
  }
}

export async function predictPrice(features: any): Promise<PricingPrediction> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/pricing/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.warn("Backend unreachable for /api/pricing/predict, falling back.", err);
    throw err;
  }
}

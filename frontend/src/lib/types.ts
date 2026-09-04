export type Language = "en" | "hi";

export interface CraftCategory {
  id: string;
  nameEn: string;
  nameHi: string;
  iconName: string;
  descriptionEn: string;
  descriptionHi: string;
  color: string;
  sampleImage: string;
}

export interface PriceBreakdown {
  rawMaterialCost: number;
  laborHours: number;
  laborHourlyRate: number;
  complexityGrade: number; // 1 to 5
  artisanExperienceYears: number;
  demandIndex: number; // 1.0 to 1.5 multiplier
  minimumFairPrice: number;
  suggestedB2BPrice: number;
}

export interface ProductItem {
  id: string;
  titleEn: string;
  titleHi: string;
  category: string;
  categoryNameEn: string;
  categoryNameHi: string;
  craftStoryEn: string;
  craftStoryHi: string;
  materialsEn: string[];
  materialsHi: string[];
  dimensions: string;
  weight: string;
  image: string;
  pricing: PriceBreakdown;
  status: "draft" | "ready" | "published" | "sold";
  createdAt: string;
  qrCodeId: string;
  voiceTranscriptEn?: string;
  voiceTranscriptHi?: string;
}

export interface PricingPrediction {
  predicted_price: number;
  lower_bound: number;
  upper_bound: number;
  fair_price_breakdown: {
    material_cost: number;
    labor_cost: number;
    craftsmanship_premium: number;
    demand_adjustment: number;
  };
  top_contributing_factors: string[];
  explanation: string;
  is_demo: boolean;
}

export interface ArtisanProfile {
  id: string;
  name: string;
  craftSpecialtyEn: string;
  craftSpecialtyHi: string;
  locationEn: string;
  locationHi: string;
  experienceYears: number;
  verificationBadge: string;
  avatar: string;
  totalProducts: number;
  totalEarningsInr: number;
}

export interface ProductAnalysis {
  category: string;
  material: string;
  craft_type: string;
  colors: string[];
  style: string;
  visible_features: string[];
}

export interface CatalogueResult {
  title: string;
  description: string;
  features: string[];
  tags: string[];
  category: string;
  material: string;
  craft_type: string;
}

export interface ProductDraft {
  // 1. Category
  categoryId?: string;
  categoryNameEn?: string;
  categoryNameHi?: string;

  // 2 & 3. Images
  originalImage?: string; // base64
  processedImage?: string; // base64
  
  // 3. Vision Analysis
  material?: string;
  craftType?: string;
  colors?: string[];
  style?: string;
  visibleFeatures?: string[];
  
  // 4. Voice
  transcriptEn?: string;
  transcriptHi?: string;
  
  // 5 & 6. Catalogue
  titleEn?: string;
  titleHi?: string;
  descriptionEn?: string;
  descriptionHi?: string;
  featuresEn?: string[];
  featuresHi?: string[];
  tagsEn?: string[];
  tagsHi?: string[];
  
  // 7 & 8. Pricing
  predictedPrice?: number;
  priceRange?: { min: number; max: number };
  priceFactors?: {
    topFactors: string[];
    explanation: string;
  };
  
  lastUpdated?: number;
}

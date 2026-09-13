/**
 * KARIGAR X — Photo Studio Types
 *
 * Shared TypeScript types for the AI Product Photo Studio feature.
 * These mirror the FastAPI backend response models exactly.
 *
 * SECURITY: These types contain NO API keys. All AI processing is done
 * server-side. The frontend only receives image data and metadata.
 */

// ─── Style Options ────────────────────────────────────────────────────────────

export type PhotoStyle = "marketplace" | "premium" | "artisan";

export const PHOTO_STYLES: {
  id: PhotoStyle;
  labelEn: string;
  labelHi: string;
  descEn: string;
  descHi: string;
  bgClass: string;
  accentClass: string;
}[] = [
  {
    id: "marketplace",
    labelEn: "Marketplace",
    labelHi: "बाज़ार",
    descEn: "Clean white studio background — perfect for online selling",
    descHi: "साफ़ सफ़ेद बैकग्राउंड — ऑनलाइन बिक्री के लिए बेहतरीन",
    bgClass: "from-slate-50 to-gray-100",
    accentClass: "border-blue-400 text-blue-700",
  },
  {
    id: "premium",
    labelEn: "Premium",
    labelHi: "प्रीमियम",
    descEn: "Warm beige luxury backdrop — for high-value artisan pieces",
    descHi: "गर्म बेज बैकग्राउंड — उच्च मूल्य के कारीगरी उत्पादों के लिए",
    bgClass: "from-amber-50 to-stone-100",
    accentClass: "border-amber-500 text-amber-700",
  },
  {
    id: "artisan",
    labelEn: "Artisan",
    labelHi: "कारीगरी",
    descEn: "Earthy warm tones — authentic handcrafted aesthetic",
    descHi: "मिट्टी के गर्म रंग — असली हस्तकला का अनुभव",
    bgClass: "from-orange-50 to-stone-100",
    accentClass: "border-orange-500 text-orange-700",
  },
];

// ─── Backend API Response Shapes ──────────────────────────────────────────────

export interface DetectedObject {
  index: number;
  label: string;
  label_hi: string;
  confidence: number;
  is_primary_candidate: boolean;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
}

export interface StudioAnalyzeResponse {
  detected_objects: DetectedObject[];
  primary_object_index: number;
  object_count: number;
  is_multi_object: boolean;
  demo_mode: boolean;
  method: string;
}

export interface StudioEnhanceResponse {
  success: boolean;
  message?: string;
  error_code?: string;
  result_image_base64: string; // JPEG, no data-URI prefix
  stages_completed: string[];
  method: string;
  demo_mode: boolean;
  style: PhotoStyle;
  warning: string | null;
}

export interface CropRegion {
  x: number;      // 0.0 - 1.0 (relative left)
  y: number;      // 0.0 - 1.0 (relative top)
  width: number;  // 0.0 - 1.0 (relative width)
  height: number; // 0.0 - 1.0 (relative height)
}

// ─── Internal UI State ────────────────────────────────────────────────────────

export type StudioStep =
  | "upload"        // Step 1: Upload or capture photo
  | "analyzing"     // Step 2: Backend analyzing objects
  | "select"        // Step 3: Multi-object selection & crop
  | "style"         // Step 4: Choose backdrop style
  | "processing"    // Step 5: AI enhancement running (8 stages)
  | "result";       // Step 6: Before/after result + actions

export interface ProcessingStage {
  id: string;
  labelEn: string;
  labelHi: string;
  completed: boolean;
  active: boolean;
}

export const PROCESSING_STAGES: Omit<ProcessingStage, "completed" | "active">[] = [
  { id: "analyzing_image",            labelEn: "Analyzing image",               labelHi: "फ़ोटो का विश्लेषण" },
  { id: "finding_product",            labelEn: "Finding your product",          labelHi: "उत्पाद की पहचान" },
  { id: "confirming_product",         labelEn: "Confirming product",            labelHi: "उत्पाद की पुष्टि" },
  { id: "isolating_product",          labelEn: "Isolating product",             labelHi: "उत्पाद को अलग करना" },
  { id: "creating_background",        labelEn: "Creating studio background",    labelHi: "स्टूडियो बैकग्राउंड निर्माण" },
  { id: "adding_natural_lighting",    labelEn: "Adding natural lighting",       labelHi: "प्राकृतिक रोशनी जोड़ना" },
  { id: "optimizing_composition",     labelEn: "Optimizing composition",        labelHi: "संरचना अनुकूलन" },
  { id: "finalizing_marketplace",     labelEn: "Finalizing marketplace photo",  labelHi: "बाज़ार फ़ोटो तैयार" },
];


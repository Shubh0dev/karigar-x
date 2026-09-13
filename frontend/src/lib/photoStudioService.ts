/**
 * KARIGAR X — Photo Studio Service (Frontend)
 *
 * Handles all communication with the KARIGAR X backend for the AI Photo Studio.
 *
 * SECURITY GUARANTEES:
 *   - This module NEVER calls Stability AI directly.
 *   - All requests go to the KARIGAR X backend (/api/photo-studio/*).
 *   - No API keys are ever present in this file or in any network request
 *     made from this module.
 *   - The backend handles key management, validation, and provider selection.
 */

import {
  PhotoStyle,
  StudioAnalyzeResponse,
  StudioEnhanceResponse,
  CropRegion,
} from "./photoStudioTypes";

// Backend URL — reads from Next.js env vars (set in .env.local)
// Falls back to localhost for development.
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// ─── Error Handling ───────────────────────────────────────────────────────────

export class PhotoStudioError extends Error {
  constructor(
    public type: "NETWORK_ERROR" | "HTTP_ERROR" | "API_ERROR",
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "PhotoStudioError";
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a base64 string (no data-URI prefix) to a data-URI for use in <img> src.
 */
export function base64ToDataUri(
  base64: string,
  mimeType: "image/jpeg" | "image/png" = "image/jpeg"
): string {
  if (base64.startsWith("http")) return base64; // accept raw URLs for offline fallback
  if (base64.startsWith("data:")) return base64; // already a data-URI
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Convert a File or Blob to base64 string (with data-URI prefix).
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a data-URI (or plain base64 string) to a File object.
 * Useful for re-submitting processed images to the backend.
 */
export function dataUriToFile(dataUri: string, filename: string): File {
  const [header, b64] = dataUri.includes(",")
    ? dataUri.split(",")
    : ["data:image/jpeg;base64", dataUri];
  const mime = header.split(":")[1]?.split(";")[0] ?? "image/jpeg";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Step 1 — Analyze the uploaded image for object detection.
 *
 * Calls POST /api/photo-studio/analyze with the image file.
 * Returns the list of detected objects + primary candidate.
 */
export async function analyzeProductImage(
  imageFile: File
): Promise<StudioAnalyzeResponse> {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch(`${BACKEND_URL}/api/photo-studio/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Photo Studio analyze failed (HTTP ${response.status}): ${errorText}`
    );
  }

  return response.json() as Promise<StudioAnalyzeResponse>;
}

/**
 * Step 2 — Full Enhancement Pipeline.
 *
 * Calls POST /api/photo-studio/enhance with:
 *   - image: the original uploaded file
 *   - style: "marketplace" | "premium" | "artisan"
 *   - selected_object_index: which object was selected by the artisan
 *
 * Returns the enhanced product image as a base64 JPEG string (no data-URI prefix).
 * Use base64ToDataUri() to convert for use in <img> src.
 *
 * On backend failure (Stability API down, rate-limited, etc.),
 * the backend automatically returns a Demo Mode result — this function
 * always resolves unless there is a network error.
 */
export async function enhanceProductImage(
  imageFile: File,
  style: PhotoStyle = "marketplace",
  selectedObjectIndex: number = 0,
  useDemo: boolean = false,
  crop?: CropRegion,
  onProgress?: (stageIndex: number, totalStages: number) => void
): Promise<StudioEnhanceResponse> {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("style", style);
  formData.append("selected_object_index", String(selectedObjectIndex));
  formData.append("use_demo", String(useDemo));

  if (crop) {
    formData.append("crop_x", String(crop.x));
    formData.append("crop_y", String(crop.y));
    formData.append("crop_w", String(crop.width));
    formData.append("crop_h", String(crop.height));
  }

  // Simulate progressive stage updates during the request (Quality Pipeline V2 has 8 stages)
  const TOTAL_STAGES = 8;
  let simulatedStage = 0;
  let progressInterval: ReturnType<typeof setInterval> | null = null;

  if (onProgress) {
    onProgress(0, TOTAL_STAGES);
    progressInterval = setInterval(() => {
      simulatedStage = Math.min(simulatedStage + 1, TOTAL_STAGES - 1);
      onProgress(simulatedStage, TOTAL_STAGES);
    }, 1500);
  }

  try {
    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/api/photo-studio/enhance`, {
        method: "POST",
        body: formData,
      });
    } catch (networkErr: any) {
      if (useDemo) {
        if (onProgress) onProgress(TOTAL_STAGES, TOTAL_STAGES);
        return {
          success: true,
          result_image_base64: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=90",
          stages_completed: ["product_analyzed", "demo_asset_loaded", "marketplace_photo_finalized"],
          method: "demo_local_fallback",
          demo_mode: true,
          style: style,
          warning: "Demo Mode: Running offline local fallback.",
        };
      }
      throw new PhotoStudioError("NETWORK_ERROR", "Backend is unreachable. Please check your connection.");
    }

    if (!response.ok) {
      if (useDemo) {
        if (onProgress) onProgress(TOTAL_STAGES, TOTAL_STAGES);
        return {
          success: true,
          result_image_base64: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=90",
          stages_completed: ["product_analyzed", "demo_asset_loaded", "marketplace_photo_finalized"],
          method: "demo_local_fallback",
          demo_mode: true,
          style: style,
          warning: "Demo Mode: Running offline local fallback.",
        };
      }
      const errorText = await response.text().catch(() => "Unknown error");
      throw new PhotoStudioError(
        "HTTP_ERROR",
        `Backend error (HTTP ${response.status}): ${errorText}`,
        response.status
      );
    }

    const result = await (response.json() as Promise<StudioEnhanceResponse>);

    if (!result.success) {
      throw new PhotoStudioError(
        "API_ERROR",
        result.message || "Stability API encountered an error.",
        parseInt(result.error_code || "0") || 500
      );
    }

    if (onProgress) {
      onProgress(TOTAL_STAGES, TOTAL_STAGES);
    }

    return result;
  } finally {
    if (progressInterval !== null) {
      clearInterval(progressInterval);
    }
  }
}


export interface PhotoStudioStatusInfo {
  available: boolean;
  provider: string;
  isLive: boolean;
  label: "BRIA AI" | "LIVE AI" | "DEMO MODE" | "STANDBY" | "OFFLINE";
  colorClass: string;
}

/**
 * Specifically query the backend for photo_studio_provider status.
 * Note: Never uses the general ai_provider to determine Photo Studio status.
 */
export async function getPhotoStudioProviderStatus(): Promise<PhotoStudioStatusInfo> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!response.ok) {
      return {
        available: false,
        provider: "unknown",
        isLive: false,
        label: "OFFLINE",
        colorClass: "text-slate-400 border-slate-300",
      };
    }
    const data = await response.json();
    // Specifically inspect photo_studio_provider
    const studioProvider: string = data.photo_studio_provider;

    if (studioProvider === "BriaProvider") {
      return {
        available: true,
        provider: "BriaProvider",
        isLive: true,
        label: "BRIA AI",
        colorClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      };
    } else if (studioProvider === "StabilityProvider") {
      return {
        available: true,
        provider: "StabilityProvider",
        isLive: true,
        label: "LIVE AI",
        colorClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      };
    } else if (
      studioProvider === "DemoProvider" ||
      studioProvider === "DemoStudioProvider"
    ) {
      return {
        available: true,
        provider: studioProvider,
        isLive: false,
        label: "DEMO MODE",
        colorClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    } else {
      return {
        available: true,
        provider: studioProvider || "unknown",
        isLive: false,
        label: "STANDBY",
        colorClass: "bg-slate-500/20 text-slate-300 border-slate-500/40",
      };
    }
  } catch {
    return {
      available: false,
      provider: "unknown",
      isLive: false,
      label: "OFFLINE",
      colorClass: "text-slate-400 border-slate-300",
    };
  }
}

/**
 * Check if the photo studio backend is reachable and operational.
 * Returns true if the backend is available, false otherwise.
 * Does NOT throw — safe to use for health-check polling.
 */
export async function checkPhotoStudioHealth(): Promise<{
  available: boolean;
  provider: string;
  demoMode: boolean;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) return { available: false, provider: "unknown", demoMode: true };
    const data = await response.json();
    const provider: string = data.photo_studio_provider ?? "DemoStudioProvider";
    return {
      available: true,
      provider,
      demoMode: provider === "DemoStudioProvider" || provider === "DemoProvider",
    };
  } catch {
    return { available: false, provider: "unknown", demoMode: true };
  }
}


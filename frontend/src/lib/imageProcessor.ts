/**
 * KARIGAR X — imageProcessor.ts
 *
 * Backward-compatible adapter — delegates to ImageStudioService.
 * The `processProductImage` API is preserved so existing call sites
 * (voice page, result page, etc.) continue to work unchanged.
 *
 * All actual processing logic lives in imageStudioService.ts.
 */

import { runFullPipeline, PIPELINE_STAGES, type PipelineStage } from "./imageStudioService";

// ── Re-exported types (unchanged public surface) ──────────────────────────────

export interface ProcessingProgress {
  stage:
    | "loading-model"
    | "removing-bg"
    | "cropping"
    | "centering"
    | "resizing"
    | "compositing"
    | "done"
    | "fallback";
  percent: number;
  message: string;
}

export interface ProcessedImageResult {
  originalUrl: string;
  enhancedUrl: string;
  enhancedBlob: Blob;
  usedFallback: boolean;
  stats: {
    bgRemoved: boolean;
    autoCropped: boolean;
    centered: boolean;
    resized: boolean;
  };
}

// ── Internal: map new pipeline stages → legacy progress shape ─────────────────

const STAGE_LEGACY_MAP: Record<
  PipelineStage["id"],
  ProcessingProgress["stage"]
> = {
  analyzing: "loading-model",
  segmenting: "removing-bg",
  detecting: "loading-model",
  selecting: "loading-model",
  cleaning: "removing-bg",
  background: "compositing",
  cropping: "cropping",
  lighting: "centering",
  sharpening: "resizing",
  composing: "compositing",
  done: "done",
  fallback: "fallback",
};

// ── Public API (backward-compatible) ─────────────────────────────────────────

export async function processProductImage(
  imageSource: string | Blob,
  onProgress?: (p: ProcessingProgress) => void
): Promise<ProcessedImageResult> {
  const result = await runFullPipeline(imageSource, (stage, _idx) => {
    if (!onProgress) return;
    onProgress({
      stage: STAGE_LEGACY_MAP[stage.id] ?? "loading-model",
      percent: stage.percent,
      message: stage.labelEn,
    });
  });

  // Map new StudioResult → legacy ProcessedImageResult
  const hasSegmented = result.completedStages.some(
    (s) => s.stage === "segmenting" && s.success
  );
  const hasCropped = result.completedStages.some(
    (s) => s.stage === "cropping" && s.success
  );
  const hasCentered = result.completedStages.some(
    (s) => s.stage === "cropping" && s.success
  );
  const hasComposed = result.completedStages.some(
    (s) => s.stage === "composing" && s.success
  );

  onProgress?.({
    stage: "done",
    percent: 100,
    message: "Enhancement complete!",
  });

  return {
    originalUrl: result.originalUrl,
    enhancedUrl: result.enhancedUrl,
    enhancedBlob: result.enhancedBlob,
    usedFallback: result.usedFallback,
    stats: {
      bgRemoved: hasSegmented,
      autoCropped: hasCropped,
      centered: hasCentered,
      resized: hasComposed,
    },
  };
}

// Re-export pipeline stages for direct use in the new enhance page
export { PIPELINE_STAGES };
export type { PipelineStage };

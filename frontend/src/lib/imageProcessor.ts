/**
 * KARIGAR X — AI Product Image Processor
 *
 * Client-side image enhancement pipeline:
 *   Original → Background Removal (ONNX) → Auto-Crop → Center → Pad → Resize → White BG
 *
 * Uses @imgly/background-removal for in-browser inference (ISNet ONNX via WASM).
 * Falls back to canvas-based enhancement if the AI model is unavailable.
 *
 * All processing happens in the browser — no server calls, no paid APIs.
 */

// ---- Types ----

export interface ProcessingProgress {
  stage: "loading-model" | "removing-bg" | "cropping" | "centering" | "resizing" | "compositing" | "done" | "fallback";
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

// ---- Constants ----

const CATALOGUE_SIZE = 800; // px — square catalogue target
const PADDING_RATIO = 0.08; // 8% padding around product
const BG_REMOVAL_TIMEOUT_MS = 60_000; // 60s timeout for AI model

// ---- Helper: load image from source ----

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
    img.src = src;
  });
}

// ---- Helper: image source to Blob ----

async function imageSourceToBlob(imageSource: string | Blob): Promise<Blob> {
  if (imageSource instanceof Blob) return imageSource;

  // Object URL or data URL → fetch as blob
  const response = await fetch(imageSource);
  return response.blob();
}

// ---- Helper: blob to canvas ----

function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load blob as image"));
    };
    img.src = url;
  });
}

// ---- Step 1: Background Removal (AI) ----

async function removeBackground(
  imageSource: string | Blob,
  onProgress?: (p: ProcessingProgress) => void
): Promise<Blob> {
  onProgress?.({
    stage: "loading-model",
    percent: 10,
    message: "Loading AI model...",
  });

  // Dynamic import to avoid bundling the heavy ONNX model at page load
  const { removeBackground: removeBg } = await import("@imgly/background-removal");

  onProgress?.({
    stage: "removing-bg",
    percent: 30,
    message: "Removing background...",
  });

  const blob = await imageSourceToBlob(imageSource);

  // Run with timeout
  const resultBlob = await Promise.race([
    removeBg(blob, {
      model: "isnet",
      output: {
        format: "image/png",
        quality: 0.9,
      },
    }) as Promise<Blob>,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("BG removal timeout")), BG_REMOVAL_TIMEOUT_MS)
    ),
  ]);

  onProgress?.({
    stage: "removing-bg",
    percent: 60,
    message: "Background removed!",
  });

  return resultBlob;
}

// ---- Step 2: Auto-Crop (find tight bounding box of non-transparent pixels) ----

function autoCrop(canvas: HTMLCanvasElement): {
  croppedCanvas: HTMLCanvasElement;
  bbox: { x: number; y: number; w: number; h: number };
} {
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  const alphaThreshold = 50; // Ignore nearly-transparent pixels and faint shadows

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      if (alpha > alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Fallback: if nothing visible, return original
  if (maxX <= minX || maxY <= minY) {
    return {
      croppedCanvas: canvas,
      bbox: { x: 0, y: 0, w: width, h: height },
    };
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  const cropped = document.createElement("canvas");
  cropped.width = cropW;
  cropped.height = cropH;
  const croppedCtx = cropped.getContext("2d")!;
  croppedCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

  return {
    croppedCanvas: cropped,
    bbox: { x: minX, y: minY, w: cropW, h: cropH },
  };
}

// ---- Step 3: Center product with padding ----

function centerWithPadding(
  canvas: HTMLCanvasElement,
  targetSize: number = CATALOGUE_SIZE,
  paddingRatio: number = PADDING_RATIO
): HTMLCanvasElement {
  const padding = Math.round(targetSize * paddingRatio);
  const availableSize = targetSize - padding * 2;

  const { width: srcW, height: srcH } = canvas;
  const scale = Math.min(availableSize / srcW, availableSize / srcH, 1);
  const scaledW = Math.round(srcW * scale);
  const scaledH = Math.round(srcH * scale);

  const result = document.createElement("canvas");
  result.width = targetSize;
  result.height = targetSize;
  const ctx = result.getContext("2d")!;

  // Transparent background (will be composited later)
  ctx.clearRect(0, 0, targetSize, targetSize);

  // Center the product
  const offsetX = Math.round((targetSize - scaledW) / 2);
  const offsetY = Math.round((targetSize - scaledH) / 2);
  ctx.drawImage(canvas, 0, 0, srcW, srcH, offsetX, offsetY, scaledW, scaledH);

  return result;
}

// ---- Step 4: Composite on white background ----

function compositeOnWhite(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const result = document.createElement("canvas");
  result.width = canvas.width;
  result.height = canvas.height;
  const ctx = result.getContext("2d")!;

  // White background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, result.width, result.height);

  // Draw product on top
  ctx.drawImage(canvas, 0, 0);

  return result;
}

// ---- Step 5: Canvas to Blob ----

function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png", quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob returned null"));
      },
      type,
      quality
    );
  });
}

// ---- Fallback: Canvas-only enhancement (no AI) ----

async function fallbackEnhance(
  imageSource: string | Blob,
  onProgress?: (p: ProcessingProgress) => void
): Promise<ProcessedImageResult> {
  onProgress?.({
    stage: "fallback",
    percent: 20,
    message: "Applying basic enhancement...",
  });

  const blob = await imageSourceToBlob(imageSource);
  const originalUrl = URL.createObjectURL(blob);
  const canvas = await blobToCanvas(blob);

  const { width, height } = canvas;
  const ctx = canvas.getContext("2d")!;

  // Apply brightness/contrast boost
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const brightness = 10;
  const contrast = 1.15;

  for (let i = 0; i < data.length; i += 4) {
    // Contrast
    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128 + brightness));
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128 + brightness));
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128 + brightness));
  }
  ctx.putImageData(imageData, 0, 0);

  onProgress?.({
    stage: "fallback",
    percent: 50,
    message: "Centering & resizing...",
  });

  // Center and resize
  const centered = centerWithPadding(canvas, CATALOGUE_SIZE, 0.05);
  const final = compositeOnWhite(centered);

  onProgress?.({
    stage: "done",
    percent: 100,
    message: "Basic enhancement complete!",
  });

  const enhancedBlob = await canvasToBlob(final, "image/jpeg", 0.92);
  const enhancedUrl = URL.createObjectURL(enhancedBlob);

  return {
    originalUrl,
    enhancedUrl,
    enhancedBlob,
    usedFallback: true,
    stats: {
      bgRemoved: false,
      autoCropped: false,
      centered: true,
      resized: true,
    },
  };
}

// ---- Main Pipeline ----

export async function processProductImage(
  imageSource: string | Blob,
  onProgress?: (p: ProcessingProgress) => void
): Promise<ProcessedImageResult> {
  const blob = await imageSourceToBlob(imageSource);
  const originalUrl = URL.createObjectURL(blob);

  try {
    // Step 1: AI Background Removal
    const bgRemovedBlob = await removeBackground(imageSource, onProgress);

    // Step 2: Auto-Crop
    onProgress?.({
      stage: "cropping",
      percent: 65,
      message: "Auto-cropping product...",
    });
    const bgRemovedCanvas = await blobToCanvas(bgRemovedBlob);
    const { croppedCanvas } = autoCrop(bgRemovedCanvas);

    // Step 3: Center with padding
    onProgress?.({
      stage: "centering",
      percent: 75,
      message: "Centering product...",
    });
    const centered = centerWithPadding(croppedCanvas, CATALOGUE_SIZE);

    // Step 4: Resize & Composite on white
    onProgress?.({
      stage: "compositing",
      percent: 85,
      message: "Preparing catalogue image...",
    });
    const final = compositeOnWhite(centered);

    // Step 5: Export
    onProgress?.({
      stage: "resizing",
      percent: 95,
      message: "Finalizing...",
    });
    const enhancedBlob = await canvasToBlob(final, "image/jpeg", 0.92);
    const enhancedUrl = URL.createObjectURL(enhancedBlob);

    onProgress?.({
      stage: "done",
      percent: 100,
      message: "Enhancement complete!",
    });

    return {
      originalUrl,
      enhancedUrl,
      enhancedBlob,
      usedFallback: false,
      stats: {
        bgRemoved: true,
        autoCropped: true,
        centered: true,
        resized: true,
      },
    };
  } catch (err) {
    console.warn("AI background removal failed, using fallback:", err);

    // Fallback: canvas-only enhancement
    return fallbackEnhance(imageSource, onProgress);
  }
}

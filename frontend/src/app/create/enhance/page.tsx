"use client";

/**
 * KARIGAR X — AI Product Photo Studio
 *
 * Complete rewrite using the new b2ackend-first architecture.
 * All AI processing happens on the backend (FastAPI + Stability AI / Pillow Demo Mode).
 * This page is a pure UI orchestrator — it uploads images and displays results.
 *
 * Flow:
 *   1. UPLOAD     → Artisan uploads or captures product photo
 *   2. ANALYZING  → Backend detects objects
 *   3. SELECT     → (if multi-object) Artisan picks hero product
 *   4. STYLE      → Artisan chooses backdrop style
 *   5. PROCESSING → Backend runs 7-stage pipeline, progress shown
 *   6. RESULT     → Before/after drag-compare + actions
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Camera,
  ImagePlus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  ScanSearch,
  Eraser,
  SunMedium,
  Focus,
  Layers,
  Cpu,
  LayoutDashboard,
  Check,
  Package,
  Wand2,
  ChevronRight,
  Info,
  ShoppingBag,
  Gem,
  Leaf,
  Crop,
  Sliders,
} from "lucide-react";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";
import {
  analyzeProductImage,
  enhanceProductImage,
  base64ToDataUri,
  fileToBase64,
  PhotoStudioError,
  getPhotoStudioProviderStatus,
  type PhotoStudioStatusInfo,
} from "@/lib/photoStudioService";
import {
  PHOTO_STYLES,
  PROCESSING_STAGES,
  type PhotoStyle,
  type StudioStep,
  type StudioAnalyzeResponse,
  type StudioEnhanceResponse,
  type ProcessingStage,
  type CropRegion,
} from "@/lib/photoStudioTypes";

// ─── Stage Icon Map ────────────────────────────────────────────────────────────

const STAGE_ICONS: Record<string, React.ReactNode> = {
  // Quality Pipeline V2 Stages
  analyzing_image: <ScanSearch className="w-4 h-4" />,
  finding_product: <Package className="w-4 h-4" />,
  confirming_product: <CheckCircle2 className="w-4 h-4" />,
  isolating_product: <Cpu className="w-4 h-4" />,
  creating_background: <Layers className="w-4 h-4" />,
  adding_natural_lighting: <SunMedium className="w-4 h-4" />,
  optimizing_composition: <LayoutDashboard className="w-4 h-4" />,
  finalizing_marketplace: <Sparkles className="w-4 h-4" />,
  // Legacy mappings for backwards compatibility
  product_analyzed: <ScanSearch className="w-4 h-4" />,
  product_isolated: <Cpu className="w-4 h-4" />,
  distractions_removed: <Eraser className="w-4 h-4" />,
  studio_background_created: <Layers className="w-4 h-4" />,
  lighting_optimized: <SunMedium className="w-4 h-4" />,
  details_enhanced: <Focus className="w-4 h-4" />,
  marketplace_photo_finalized: <Sparkles className="w-4 h-4" />,
};

const STYLE_ICONS: Record<PhotoStyle, React.ReactNode> = {
  marketplace: <ShoppingBag className="w-5 h-5" />,
  premium: <Gem className="w-5 h-5" />,
  artisan: <Leaf className="w-5 h-5" />,
};

// ─── Comparison Slider ────────────────────────────────────────────────────────

function ComparisonSlider({
  originalSrc,
  enhancedSrc,
}: {
  originalSrc: string;
  enhancedSrc: string;
}) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging.current) handleMove(e.clientX);
    },
    [handleMove]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isDragging.current) handleMove(e.touches[0].clientX);
    },
    [handleMove]
  );

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", () => (isDragging.current = false));
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", () => (isDragging.current = false));
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", () => (isDragging.current = false));
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", () => (isDragging.current = false));
    };
  }, [onMouseMove, onTouchMove]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square rounded-2xl overflow-hidden cursor-ew-resize select-none touch-none shadow-2xl"
      onMouseDown={() => (isDragging.current = true)}
      onTouchStart={() => (isDragging.current = true)}
    >
      {/* Enhanced image (right layer — full width) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={enhancedSrc}
        alt="AI Enhanced"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Original image (left layer — clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={originalSrc}
          alt="Original"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: `${(100 / position) * 100}%`, maxWidth: "none" }}
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
        style={{ left: `${position}%` }}
      >
        {/* Drag handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center gap-0.5 border-2 border-artisan-terracotta/40">
          <div className="w-1 h-5 rounded-full bg-artisan-terracotta/60" />
          <div className="w-1 h-5 rounded-full bg-artisan-terracotta/60" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-3 left-3 z-10">
        <span className="bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
          BEFORE
        </span>
      </div>
      <div className="absolute bottom-3 right-3 z-10">
        <span className="bg-artisan-terracotta text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
          KARIGAR X ✨
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AIPhotoStudioPage() {
  const router = useRouter();
  const { language, productDraft, updateProductDraft } = useDemo();
  const t = (key: Parameters<typeof getTranslation>[1]) =>
    getTranslation(language, key);

  // ── State ────────────────────────────────────────────────────────────────────

  const [step, setStep] = useState<StudioStep>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(
    productDraft.originalImage ?? null
  );

  // Analysis state
  const [analyzeResult, setAnalyzeResult] = useState<StudioAnalyzeResponse | null>(null);
  const [selectedObjectIndex, setSelectedObjectIndex] = useState<number>(0);
  const [selectedCrop, setSelectedCrop] = useState<CropRegion | null>(null);
  const [isManualAdjustOpen, setIsManualAdjustOpen] = useState<boolean>(false);

  // Style state
  const [selectedStyle, setSelectedStyle] = useState<PhotoStyle>("marketplace");

  // Processing state
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>(
    PROCESSING_STAGES.map((s) => ({ ...s, completed: false, active: false }))
  );
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  // Result state
  const [enhanceResult, setEnhanceResult] = useState<StudioEnhanceResponse | null>(null);
  const [enhancedSrc, setEnhancedSrc] = useState<string | null>(null);

  // Provider Status state
  const [providerStatus, setProviderStatus] = useState<PhotoStudioStatusInfo | null>(null);

  useEffect(() => {
    let active = true;
    getPhotoStudioProviderStatus().then((res) => {
      if (active) setProviderStatus(res);
    });
    return () => {
      active = false;
    };
  }, []);

  // Error state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [canUseDemo, setCanUseDemo] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Restore draft image on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (productDraft.originalImage && !imageSrc) {
      setImageSrc(productDraft.originalImage);
    }
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImageFile(file);
      const b64 = await fileToBase64(file);
      setImageSrc(b64);
      updateProductDraft({ originalImage: b64 });
      setErrorMsg(null);
      setSelectedCrop(null);
    },
    [updateProductDraft]
  );

  const handleAnalyze = useCallback(async () => {
    if (!imageFile && !imageSrc) {
      setErrorMsg("Please upload a product photo first.");
      return;
    }

    setStep("analyzing");
    setErrorMsg(null);

    try {
      let file = imageFile;
      if (!file && imageSrc) {
        // Reconstruct File from base64 draft
        const res = await fetch(imageSrc);
        const blob = await res.blob();
        file = new File([blob], "product.jpg", { type: blob.type || "image/jpeg" });
      }

      const result = await analyzeProductImage(file!);
      setAnalyzeResult(result);
      setSelectedObjectIndex(result.primary_object_index);

      // Initialize selected crop to detected primary object's region or central product default
      const primary = result.detected_objects?.[result.primary_object_index] || result.detected_objects?.[0];
      if (primary && primary.bbox_w > 0 && primary.bbox_h > 0) {
        setSelectedCrop({
          x: primary.bbox_x,
          y: primary.bbox_y,
          width: primary.bbox_w,
          height: primary.bbox_h,
        });
      } else {
        // Default central primary product crop (focusing on center item)
        setSelectedCrop({ x: 0.15, y: 0.12, width: 0.70, height: 0.76 });
      }

      // Always enter the select step to confirm the primary product
      setStep("select");
    } catch (err) {
      console.error("analyze error:", err);
      // Fallback on error: allow manual selection with default central crop
      setAnalyzeResult({
        detected_objects: [
          {
            index: 0,
            label: "Primary Product",
            label_hi: "मुख्य उत्पाद",
            confidence: 0.90,
            is_primary_candidate: true,
            bbox_x: 0.15,
            bbox_y: 0.12,
            bbox_w: 0.70,
            bbox_h: 0.76,
          }
        ],
        primary_object_index: 0,
        object_count: 1,
        is_multi_object: false,
        demo_mode: false,
        method: "fallback",
      });
      setSelectedCrop({ x: 0.15, y: 0.12, width: 0.70, height: 0.76 });
      setSelectedObjectIndex(0);
      setStep("select");
    }
  }, [imageFile, imageSrc]);

  const handleEnhance = useCallback(
    async (forceDemo = false) => {
      let file = imageFile;
      if (!file && imageSrc) {
        try {
          const res = await fetch(imageSrc);
          const blob = await res.blob();
          file = new File([blob], "product.jpg", { type: blob.type || "image/jpeg" });
        } catch {
          setErrorMsg("Could not load image. Please re-upload.");
          setStep("upload");
          return;
        }
      }

      if (!file) {
        setErrorMsg("No image found. Please upload a photo.");
        setStep("upload");
        return;
      }

      setStep("processing");
      setErrorMsg(null);
      setCanUseDemo(false);
      setCurrentStageIndex(0);
      setProcessingStages(
        PROCESSING_STAGES.map((s, i) => ({
          ...s,
          completed: false,
          active: i === 0,
        }))
      );

      try {
        const result = await enhanceProductImage(
          file,
          selectedStyle,
          selectedObjectIndex,
          forceDemo,
          selectedCrop ?? undefined,
          (stageIdx, _total) => {
            setCurrentStageIndex(stageIdx);
            setProcessingStages((prev) =>
              prev.map((s, i) => ({
                ...s,
                completed: i < stageIdx,
                active: i === stageIdx,
              }))
            );
          }
        );

        // Mark all stages complete
        setProcessingStages((prev) => prev.map((s) => ({ ...s, completed: true, active: false })));

        setEnhanceResult(result);
        const dataUri = base64ToDataUri(result.result_image_base64);
        setEnhancedSrc(dataUri);
        updateProductDraft({ processedImage: dataUri });
        setStep("result");
      } catch (err: any) {
        console.error("enhance error:", err);
        
        if (err?.name === "PhotoStudioError") {
          const pError = err as import("@/lib/photoStudioService").PhotoStudioError;
          
          if (pError.type === "NETWORK_ERROR" || pError.type === "HTTP_ERROR") {
            setErrorMsg("AI Studio is temporarily unavailable.");
            setCanUseDemo(true);
          } else if (pError.type === "API_ERROR") {
            if (pError.statusCode === 401 || pError.statusCode === 403) {
              setErrorMsg("Live AI is not configured. You can continue in Demo Mode.");
              setCanUseDemo(true);
            } else {
              setErrorMsg("AI Studio is temporarily unavailable.");
              setCanUseDemo(true);
            }
          }
        } else {
          // Genuine image issue or unexpected client error
          setErrorMsg(err?.message || "AI processing failed. Please try again or use original photo.");
          setCanUseDemo(false);
        }
        setStep("style");
      }
    },
    [imageFile, imageSrc, selectedStyle, selectedObjectIndex, selectedCrop, updateProductDraft]
  );

  const handleUsePhoto = useCallback(() => {
    router.push("/create/voice");
  }, [router]);

  const handleDownload = useCallback(() => {
    if (!enhancedSrc) return;
    const a = document.createElement("a");
    a.href = enhancedSrc;
    a.download = "karigarx-product-photo.jpg";
    a.click();
  }, [enhancedSrc]);

  const handleRetake = useCallback(() => {
    setStep("upload");
    setImageFile(null);
    setImageSrc(null);
    setAnalyzeResult(null);
    setEnhanceResult(null);
    setEnhancedSrc(null);
    setErrorMsg(null);
  }, []);

  // ── Render helpers ────────────────────────────────────────────────────────────

  // ── STEP 1: Upload ───────────────────────────────────────────────────────────

  if (step === "upload") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-artisan-terracotta/20">
        <div className="max-w-md mx-auto px-4 py-6">
          <StepIndicator currentStep={3} />

          {/* Header */}
          <div className="text-center mb-6 mt-4">
            <div className="inline-flex items-center gap-2 bg-artisan-terracotta/15 border border-artisan-terracotta/30 rounded-full px-4 py-1.5 mb-3">
              <Sparkles className="w-4 h-4 text-artisan-terracotta" />
              <span className="text-artisan-terracotta text-sm font-semibold">
                AI PRODUCT PHOTOGRAPHER
              </span>
              <span className="text-slate-500">•</span>
              {providerStatus?.provider === "BriaProvider" ? (
                <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  BRIA AI
                </span>
              ) : providerStatus?.provider === "StabilityProvider" ? (
                <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  LIVE AI
                </span>
              ) : providerStatus?.provider === "DemoProvider" || providerStatus?.provider === "DemoStudioProvider" ? (
                <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  DEMO MODE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-500/20 border border-slate-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  STANDBY
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {t("enhanceTitle")}
            </h1>
            <p className="text-slate-400 text-sm">
              {language === "hi"
                ? "साधारण फोटो को प्रोफेशनल मार्केटप्लेस फोटो में बदलें"
                : "Transform your artisan photo into a professional marketplace image"}
            </p>
          </div>

          {/* Upload Area */}
          <div
            className="relative border-2 border-dashed border-slate-600 rounded-2xl overflow-hidden cursor-pointer hover:border-artisan-terracotta/60 transition-all duration-300 group bg-slate-800/40 backdrop-blur-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {imageSrc ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt="Product"
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="text-white text-center">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm font-semibold">Change Photo</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="success" className="text-xs">
                    <Check className="w-3 h-3" /> Photo Ready
                  </Badge>
                </div>
              </>
            ) : (
              <div className="aspect-square flex flex-col items-center justify-center gap-4 p-8">
                <div className="w-20 h-20 rounded-2xl bg-slate-700/60 border border-slate-600 flex items-center justify-center group-hover:bg-artisan-terracotta/10 group-hover:border-artisan-terracotta/40 transition-all">
                  <ImagePlus className="w-9 h-9 text-slate-500 group-hover:text-artisan-terracotta transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-lg mb-1">
                    {language === "hi" ? "फोटो अपलोड करें" : "Upload Product Photo"}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {language === "hi"
                      ? "JPEG, PNG या WEBP • अधिकतम 10 MB"
                      : "JPEG, PNG or WEBP • Max 10 MB"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
            onChange={handleFileChange}
            id="photo-upload-input"
          />

          {/* Camera / Gallery buttons */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-700/60 border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:border-slate-500 transition-all"
              onClick={() => fileInputRef.current?.click()}
              id="btn-gallery-upload"
            >
              <ImagePlus className="w-4 h-4" />
              {t("studioSimulateUpload")}
            </button>
            <button
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-700/60 border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:border-slate-500 transition-all"
              onClick={() => fileInputRef.current?.click()}
              id="btn-camera-capture"
            >
              <Camera className="w-4 h-4" />
              {t("studioSimulateCamera")}
            </button>
          </div>

          {errorMsg && (
            <div className="mt-3 flex items-center gap-2 bg-red-900/30 border border-red-700/40 rounded-xl px-4 py-3 text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* What AI will do */}
          <div className="mt-6 bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              {language === "hi" ? "AI क्या करेगा" : "What AI will do"}
            </p>
            <div className="space-y-2">
              {[
                { icon: <ScanSearch className="w-3.5 h-3.5" />, labelEn: "Detect & isolate your product", labelHi: "उत्पाद की पहचान और अलगाव" },
                { icon: <Eraser className="w-3.5 h-3.5" />, labelEn: "Remove distracting background", labelHi: "बैकग्राउंड और अनावश्यक चीज़ें हटाना" },
                { icon: <Layers className="w-3.5 h-3.5" />, labelEn: "Add professional studio backdrop", labelHi: "प्रोफेशनल स्टूडियो बैकग्राउंड" },
                { icon: <SunMedium className="w-3.5 h-3.5" />, labelEn: "Optimize lighting & exposure", labelHi: "रोशनी और एक्सपोज़र सुधार" },
                { icon: <Focus className="w-3.5 h-3.5" />, labelEn: "Enhance product details & texture", labelHi: "उत्पाद की बनावट निखारना" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-slate-300">
                  <span className="text-artisan-terracotta">{item.icon}</span>
                  <span className="text-sm">
                    {language === "hi" ? item.labelHi : item.labelEn}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/create/studio")}
              id="btn-back-studio"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t("btnBack")}
            </Button>
            <Button
              variant="primary"
              className="flex-2"
              disabled={!imageSrc}
              onClick={handleAnalyze}
              id="btn-start-ai-analyze"
            >
              <Wand2 className="w-4 h-4 mr-1.5" />
              {language === "hi" ? "AI Photo Studio शुरू करें" : "Start AI Photo Studio"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: Analyzing ────────────────────────────────────────────────────────

  if (step === "analyzing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-artisan-terracotta/20 flex items-center justify-center">
        <div className="max-w-sm mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-artisan-terracotta/10 border-2 border-artisan-terracotta/30 flex items-center justify-center animate-pulse">
            <ScanSearch className="w-9 h-9 text-artisan-terracotta" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {language === "hi" ? "आपकी फोटो का विश्लेषण..." : "Analyzing your photo..."}
          </h2>
          <p className="text-slate-400 text-sm">
            {language === "hi"
              ? "AI आपके उत्पाद को पहचान रहा है"
              : "AI is detecting products in your image"}
          </p>
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-artisan-terracotta animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 3: Select Product ───────────────────────────────────────────────────

  if (step === "select" && analyzeResult) {
    const currentCrop = selectedCrop || { x: 0.15, y: 0.12, width: 0.70, height: 0.76 };

    const snapCrop = (x: number, y: number, w: number, h: number) => {
      setSelectedCrop({
        x: Math.max(0, Math.min(1 - w, x)),
        y: Math.max(0, Math.min(1 - h, y)),
        width: Math.min(1, Math.max(0.2, w)),
        height: Math.min(1, Math.max(0.2, h)),
      });
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-artisan-terracotta/20">
        <div className="max-w-md mx-auto px-4 py-6">
          <StepIndicator currentStep={3} />

          <div className="mt-4 mb-4 text-center">
            <h2 className="text-xl font-bold text-white mb-1">
              {language === "hi" ? "आप कौन सा उत्पाद बेच रहे हैं?" : "Which product are you selling?"}
            </h2>
            <p className="text-slate-400 text-xs px-2">
              {language === "hi"
                ? "मुख्य उत्पाद चुनें। अतिरिक्त सामान और बैकग्राउंड को साफ़ हटा दिया जाएगा।"
                : "Select the primary product to isolate. Secondary items & messy background will be cleanly removed."}
            </p>
          </div>

          {/* Show original image with bounding box overlays & active crop box */}
          {imageSrc && (
            <div className="relative rounded-2xl overflow-hidden mb-4 shadow-xl border border-slate-700/60 bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt="Product"
                className="w-full aspect-square object-cover opacity-90"
              />

              {/* Darkened overlay outside crop */}
              <div className="absolute inset-0 pointer-events-none bg-black/40" />

              {/* Active Cutout Target Box (Clear cutout window) */}
              <div
                className="absolute border-2 border-artisan-terracotta bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] rounded-lg transition-all duration-300 pointer-events-none"
                style={{
                  left: `${currentCrop.x * 100}%`,
                  top: `${currentCrop.y * 100}%`,
                  width: `${currentCrop.width * 100}%`,
                  height: `${currentCrop.height * 100}%`,
                }}
              >
                {/* Corner indicator handles */}
                <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-artisan-terracotta rounded-full" />
                <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-artisan-terracotta rounded-full" />
                <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-artisan-terracotta rounded-full" />
                <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-artisan-terracotta rounded-full" />

                {/* Top Badge */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2">
                  <span className="bg-artisan-terracotta text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-md flex items-center gap-1">
                    <Crop className="w-3 h-3" />
                    {language === "hi" ? "चयनित उत्पाद" : "Primary Product"}
                  </span>
                </div>
              </div>

              {/* Detected Objects Overlays (Interactive click-to-select) */}
              {analyzeResult.detected_objects.map((obj) => (
                <button
                  key={obj.index}
                  className={`absolute border rounded-lg transition-all ${
                    selectedObjectIndex === obj.index
                      ? "border-emerald-400 bg-emerald-500/20 z-10"
                      : "border-white/40 bg-black/20 hover:border-white hover:bg-black/40"
                  }`}
                  style={{
                    left: `${obj.bbox_x * 100}%`,
                    top: `${obj.bbox_y * 100}%`,
                    width: `${obj.bbox_w * 100}%`,
                    height: `${obj.bbox_h * 100}%`,
                  }}
                  onClick={() => {
                    setSelectedObjectIndex(obj.index);
                    snapCrop(obj.bbox_x, obj.bbox_y, obj.bbox_w, obj.bbox_h);
                  }}
                  id={`btn-select-object-${obj.index}`}
                >
                  <div className="absolute bottom-1 left-1 right-1 flex justify-center">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow ${
                        selectedObjectIndex === obj.index
                          ? "bg-emerald-600 text-white"
                          : "bg-black/70 text-slate-200"
                      }`}
                    >
                      {language === "hi" ? obj.label_hi : obj.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick Region Selector & Fallback Presets */}
          <div className="mb-4 bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Crop className="w-3.5 h-3.5 text-artisan-terracotta" />
                {language === "hi" ? "त्वरित चयन" : "Target Region Presets"}
              </span>
              <button
                onClick={() => setIsManualAdjustOpen(!isManualAdjustOpen)}
                className="text-[11px] text-artisan-terracotta hover:underline font-medium flex items-center gap-1"
                id="btn-toggle-manual-adjust"
              >
                <Sliders className="w-3 h-3" />
                {isManualAdjustOpen
                  ? (language === "hi" ? "समायोजन छिपाएं" : "Hide Sliders")
                  : (language === "hi" ? "मैन्युअल समायोजन" : "Fine Tune")}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                className="bg-slate-700/70 hover:bg-slate-600 text-white text-[11px] py-1.5 px-2 rounded-lg font-medium transition-colors border border-slate-600"
                onClick={() => {
                  setSelectedObjectIndex(0);
                  snapCrop(0.18, 0.14, 0.64, 0.72);
                }}
                id="btn-preset-center"
              >
                🎯 {language === "hi" ? "केंद्रीय टोकरी/उत्पाद" : "Central Product"}
              </button>
              <button
                type="button"
                className="bg-slate-700/70 hover:bg-slate-600 text-white text-[11px] py-1.5 px-2 rounded-lg font-medium transition-colors border border-slate-600"
                onClick={() => {
                  snapCrop(0.04, 0.22, 0.46, 0.68);
                }}
                id="btn-preset-left"
              >
                ⬅️ {language === "hi" ? "बायाँ उत्पाद" : "Left Item"}
              </button>
              <button
                type="button"
                className="bg-slate-700/70 hover:bg-slate-600 text-white text-[11px] py-1.5 px-2 rounded-lg font-medium transition-colors border border-slate-600"
                onClick={() => {
                  snapCrop(0.50, 0.22, 0.46, 0.68);
                }}
                id="btn-preset-right"
              >
                ➡️ {language === "hi" ? "दायाँ उत्पाद" : "Right Item"}
              </button>
            </div>

            {/* Fine tune sliders */}
            {isManualAdjustOpen && (
              <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-16 flex-shrink-0 text-slate-400">Position X:</span>
                  <input
                    type="range"
                    min="0"
                    max="0.6"
                    step="0.02"
                    value={currentCrop.x}
                    onChange={(e) => snapCrop(parseFloat(e.target.value), currentCrop.y, currentCrop.width, currentCrop.height)}
                    className="flex-1 accent-artisan-terracotta"
                  />
                  <span className="w-8 text-right font-mono">{Math.round(currentCrop.x * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 flex-shrink-0 text-slate-400">Position Y:</span>
                  <input
                    type="range"
                    min="0"
                    max="0.6"
                    step="0.02"
                    value={currentCrop.y}
                    onChange={(e) => snapCrop(currentCrop.x, parseFloat(e.target.value), currentCrop.width, currentCrop.height)}
                    className="flex-1 accent-artisan-terracotta"
                  />
                  <span className="w-8 text-right font-mono">{Math.round(currentCrop.y * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 flex-shrink-0 text-slate-400">Size:</span>
                  <input
                    type="range"
                    min="0.3"
                    max="1.0"
                    step="0.02"
                    value={currentCrop.width}
                    onChange={(e) => {
                      const sz = parseFloat(e.target.value);
                      snapCrop(currentCrop.x, currentCrop.y, sz, sz);
                    }}
                    className="flex-1 accent-artisan-terracotta"
                  />
                  <span className="w-8 text-right font-mono">{Math.round(currentCrop.width * 100)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Object list */}
          <div className="space-y-2 mb-5">
            {analyzeResult.detected_objects.map((obj) => (
              <button
                key={obj.index}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  selectedObjectIndex === obj.index
                    ? "border-artisan-terracotta bg-artisan-terracotta/10"
                    : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                }`}
                onClick={() => {
                  setSelectedObjectIndex(obj.index);
                  snapCrop(obj.bbox_x, obj.bbox_y, obj.bbox_w, obj.bbox_h);
                }}
                id={`btn-list-select-object-${obj.index}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    selectedObjectIndex === obj.index
                      ? "bg-artisan-terracotta text-white"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {selectedObjectIndex === obj.index ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Package className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">
                    {language === "hi" ? obj.label_hi : obj.label}
                  </p>
                  <p className="text-slate-400 text-xs">
                    {obj.is_primary_candidate
                      ? (language === "hi" ? "AI द्वारा अनुशंसित मुख्य उत्पाद" : "AI recommended primary product")
                      : (language === "hi" ? "द्वितीयक वस्तु" : "Secondary item")}
                    {" "}
                    · {Math.round(obj.confidence * 100)}% confidence
                  </p>
                </div>
                {obj.is_primary_candidate && (
                  <Badge variant="success" className="text-xs flex-shrink-0">
                    {language === "hi" ? "सुझाव" : "Suggested"}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep("upload")}
              id="btn-back-from-select"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t("btnBack")}
            </Button>
            <Button
              variant="primary"
              className="flex-2"
              onClick={() => setStep("style")}
              id="btn-confirm-product-selection"
            >
              <Check className="w-4 h-4 mr-1.5" />
              {language === "hi" ? "उत्पाद चयन की पुष्टि करें" : "Confirm Primary Product"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 4: Choose Style ─────────────────────────────────────────────────────

  if (step === "style") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-artisan-terracotta/20">
        <div className="max-w-md mx-auto px-4 py-6">
          <StepIndicator currentStep={3} />

          <div className="mt-4 mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                {t("backdropTitle")}
              </h2>
              <p className="text-slate-400 text-sm">
                {language === "hi"
                  ? "अपने उत्पाद के लिए सही स्टूडियो बैकग्राउंड चुनें"
                  : "Choose the studio backdrop that best suits your product"}
              </p>
            </div>
            {providerStatus?.provider === "BriaProvider" ? (
              <Badge variant="success" className="text-[10px] uppercase font-bold bg-emerald-600/90 text-white flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                BRIA AI
              </Badge>
            ) : providerStatus?.provider === "StabilityProvider" ? (
              <Badge variant="success" className="text-[10px] uppercase font-bold bg-emerald-600/90 text-white flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE AI
              </Badge>
            ) : providerStatus?.provider === "DemoProvider" || providerStatus?.provider === "DemoStudioProvider" ? (
              <Badge variant="terracotta" className="text-[10px] uppercase font-bold">
                DEMO MODE
              </Badge>
            ) : null}
          </div>

          {/* Style Cards */}
          <div className="space-y-3 mb-6">
            {PHOTO_STYLES.map((style) => (
              <button
                key={style.id}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${selectedStyle === style.id
                  ? "border-artisan-terracotta bg-artisan-terracotta/10"
                  : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                  }`}
                onClick={() => setSelectedStyle(style.id)}
                id={`btn-style-${style.id}`}
              >
                {/* Style preview swatch */}
                <div
                  className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${style.bgClass} border ${selectedStyle === style.id ? "border-artisan-terracotta" : "border-slate-600"
                    }`}
                >
                  <span className={style.accentClass}>
                    {STYLE_ICONS[style.id]}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-bold text-base">
                      {language === "hi" ? style.labelHi : style.labelEn}
                    </span>
                    {style.id === "marketplace" && (
                      <Badge variant="success" className="text-[10px]">
                        {language === "hi" ? "लोकप्रिय" : "Popular"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {language === "hi" ? style.descHi : style.descEn}
                  </p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${selectedStyle === style.id
                    ? "border-artisan-terracotta bg-artisan-terracotta"
                    : "border-slate-600"
                    }`}
                >
                  {selectedStyle === style.id && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="mb-4 bg-red-900/30 border border-red-700/40 rounded-xl px-4 py-4 text-red-300 text-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
              {canUseDemo && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-red-950 hover:bg-red-900 border-red-700/50"
                  onClick={() => handleEnhance(true)}
                  id="btn-continue-demo-mode"
                >
                  Continue in Demo Mode
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                analyzeResult?.is_multi_object
                  ? setStep("select")
                  : setStep("upload")
              }
              id="btn-back-from-style"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t("btnBack")}
            </Button>
            <Button
              variant="primary"
              className="flex-2"
              onClick={() => handleEnhance(false)}
              id="btn-start-enhancement"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              {language === "hi" ? "AI Photo बनाएं" : "Create AI Photo"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 5: Processing ───────────────────────────────────────────────────────

  if (step === "processing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-artisan-terracotta/20 flex items-center justify-center">
        <div className="max-w-sm mx-auto px-6 w-full">

          {/* Animated orb */}
          <div className="flex justify-center mb-8">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-artisan-terracotta/20 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-artisan-terracotta/30 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-2 border-artisan-terracotta/50 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-artisan-terracotta" />
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white text-center mb-2">
            {language === "hi" ? "AI Photo बन रही है..." : "Creating AI Photo..."}
          </h2>
          <p className="text-slate-400 text-sm text-center mb-8">
            {language === "hi"
              ? "आपका उत्पाद प्रोफेशनल स्टूडियो फोटो में बदल रहा है"
              : "Transforming your product into a professional studio photo"}
          </p>

          {/* Stage progress */}
          <div className="space-y-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            {processingStages.map((stage, i) => (
              <div
                key={stage.id}
                className={`flex items-center gap-3 transition-all duration-500 ${stage.completed
                  ? "opacity-100"
                  : stage.active
                    ? "opacity-100"
                    : "opacity-35"
                  }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${stage.completed
                    ? "bg-emerald-500 text-white"
                    : stage.active
                      ? "bg-artisan-terracotta text-white animate-pulse"
                      : "bg-slate-700 text-slate-500"
                    }`}
                >
                  {stage.completed ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    STAGE_ICONS[stage.id] ?? <Sparkles className="w-3.5 h-3.5" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${stage.completed
                    ? "text-emerald-400"
                    : stage.active
                      ? "text-white"
                      : "text-slate-500"
                    }`}
                >
                  {language === "hi" ? stage.labelHi : stage.labelEn}
                </span>
                {stage.active && (
                  <div className="ml-auto flex gap-1">
                    {[0, 1, 2].map((j) => (
                      <div
                        key={j}
                        className="w-1 h-1 rounded-full bg-artisan-terracotta animate-bounce"
                        style={{ animationDelay: `${j * 0.1}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-5 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-artisan-terracotta to-amber-400 rounded-full transition-all duration-700"
              style={{
                width: `${Math.round(
                  (processingStages.filter((s) => s.completed).length /
                    processingStages.length) *
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 6: Result ───────────────────────────────────────────────────────────

  if (step === "result" && enhancedSrc && imageSrc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-artisan-terracotta/20">
        <div className="max-w-md mx-auto px-4 py-6">
          <StepIndicator currentStep={3} />

          {/* Success header */}
          <div className="flex items-center gap-3 my-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {language === "hi" ? "AI Photo तैयार!" : "AI Photo Ready!"}
              </h2>
              <p className="text-slate-400 text-sm">
                {t("productReady")}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="success" className="text-xs">
              <Check className="w-3 h-3" />
              {language === "hi" ? "उत्पाद अलग किया" : "Product Isolated"}
            </Badge>
            <Badge variant="success" className="text-xs">
              <Check className="w-3 h-3" />
              {language === "hi" ? "बैकग्राउंड हटाया" : "Background Removed"}
            </Badge>
            <Badge variant="success" className="text-xs">
              <Check className="w-3 h-3" />
              {language === "hi" ? "स्टूडियो तैयार" : "Studio Ready"}
            </Badge>
            {enhanceResult?.demo_mode ? (
              <Badge variant="warning" className="text-xs font-bold">
                <Info className="w-3 h-3" />
                DEMO MODE
              </Badge>
            ) : enhanceResult?.method?.startsWith("bria") ? (
              <Badge variant="success" className="text-xs font-bold">
                <Sparkles className="w-3 h-3" />
                ✨ BRIA AI
              </Badge>
            ) : (
              <Badge variant="success" className="text-xs font-bold">
                <Sparkles className="w-3 h-3" />
                ✨ LIVE AI
              </Badge>
            )}
          </div>

          {/* Comparison Slider */}
          <ComparisonSlider originalSrc={imageSrc} enhancedSrc={enhancedSrc} />

          <p className="text-center text-slate-500 text-xs mt-2 mb-5">
            {t("dragToCompare")}
          </p>

          {/* Warning if any */}
          {enhanceResult?.warning && (
            <div className="mb-4 flex items-center gap-2 bg-amber-900/20 border border-amber-700/30 rounded-xl px-3.5 py-2.5 text-amber-300 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {enhanceResult.warning}
            </div>
          )}

          {/* Pipeline summary */}
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 mb-5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              {t("summaryTitle")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(enhanceResult?.stages_completed ?? []).map((stageId) => {
                const stage = PROCESSING_STAGES.find((s) => s.id === stageId);
                return (
                  <div key={stageId} className="flex items-center gap-1.5 text-emerald-400 text-xs">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    <span className="text-slate-300 leading-tight">
                      {stage
                        ? language === "hi"
                          ? stage.labelHi
                          : stage.labelEn
                        : stageId}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Style picker (quick switch) */}
          <div className="mb-5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              {language === "hi" ? "दूसरा स्टाइल आज़माएं" : "Try another style"}
            </p>
            <div className="flex gap-2">
              {PHOTO_STYLES.map((style) => (
                <button
                  key={style.id}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${selectedStyle === style.id
                    ? "border-artisan-terracotta bg-artisan-terracotta/15 text-artisan-terracotta"
                    : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600"
                    }`}
                  onClick={() => {
                    setSelectedStyle(style.id);
                    handleEnhance();
                  }}
                  id={`btn-restyle-${style.id}`}
                >
                  {language === "hi" ? style.labelHi : style.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleUsePhoto}
              id="btn-use-enhanced-photo"
            >
              <Check className="w-4 h-4 mr-1.5" />
              {language === "hi" ? "यह फोटो लगाएं — आगे बढ़ें" : "Use This Photo — Continue"}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <button
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-600 bg-slate-800/40 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-all"
                onClick={handleDownload}
                id="btn-download-photo"
              >
                <Download className="w-4 h-4" />
                {language === "hi" ? "डाउनलोड करें" : "Download"}
              </button>
              <button
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-600 bg-slate-800/40 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-all"
                onClick={handleRetake}
                id="btn-retake-photo"
              >
                <RotateCcw className="w-4 h-4" />
                {t("enhanceRetake")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Fallback ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-artisan-terracotta/20 flex items-center justify-center">
      <div className="text-center px-6">
        <div className="text-4xl mb-4">📸</div>
        <p className="text-slate-400">
          {language === "hi" ? "लोड हो रहा है..." : "Loading..."}
        </p>
      </div>
    </div>
  );
}

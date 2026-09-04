"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Camera,
  ImagePlus,
  CheckCircle2,
  AlertTriangle,
  ImageOff,
  Crop,
  Maximize,
  RotateCcw,
} from "lucide-react";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";
import type { ProcessingProgress, ProcessedImageResult } from "@/lib/imageProcessor";

type ProcessingState = "idle" | "processing" | "done" | "error";

export default function AIEnhancePage() {
  const router = useRouter();
  const { language, productDraft, updateProductDraft, showToast } = useDemo();

  const [processingState, setProcessingState] = useState<ProcessingState>("idle");
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [result, setResult] = useState<ProcessedImageResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const hasStartedRef = useRef(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);

  const sourceImage = productDraft.originalImage;

  const runEnhancement = useCallback(async () => {
    if (!sourceImage) return;
    setProcessingState("processing");
    setErrorMessage(null);

    try {
      const { processProductImage } = await import("@/lib/imageProcessor");
      const processedResult = await processProductImage(sourceImage, (p) => {
        setProgress(p);
      });
      setResult(processedResult);
      setProcessingState("done");

      if (processedResult.usedFallback) {
        showToast(
          getTranslation(language, "enhanceFallbackNotice"),
          "warning"
        );
      } else {
        showToast(
          getTranslation(language, "enhanceComplete"),
          "success"
        );
      }
    } catch (err) {
      console.error("Enhancement pipeline failed:", err);
      setProcessingState("error");
      setErrorMessage(
        language === "hi"
          ? "फोटो सुधारने में त्रुटि। कृपया पुनः प्रयास करें।"
          : "Enhancement failed. Please try again or continue with the original."
      );
    }
  }, [sourceImage, language, showToast]);

  // Auto-start processing when the page loads
  useEffect(() => {
    if (sourceImage && !hasStartedRef.current) {
      hasStartedRef.current = true;
      runEnhancement();
    }
  }, [sourceImage, runEnhancement]);

  const handleUseEnhanced = () => {
    if (result) {
      updateProductDraft({
        processedImage: result.enhancedUrl,
      });
      showToast(
        language === "hi" ? "सुधरी हुई फोटो लगाई गई!" : "Enhanced image applied!",
        "success"
      );
      router.push("/create/voice");
    }
  };

  const handleUseOriginal = () => {
    updateProductDraft({
      processedImage: undefined,
    });
    showToast(
      language === "hi" ? "असली फोटो रखी गई" : "Using original photo",
      "info"
    );
    router.push("/create/voice");
  };

  const handleRetake = () => {
    router.push("/create/studio");
  };

  const handleReplace = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
      galleryInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith("image/")) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const MAX_WIDTH = 1024;
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          
          updateProductDraft({ originalImage: dataUrl, processedImage: undefined });
          hasStartedRef.current = false;
          setResult(null);
          setProcessingState("idle");
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetry = () => {
    hasStartedRef.current = false;
    setResult(null);
    setProcessingState("idle");
    setErrorMessage(null);
  };

  // Redirect if no image
  if (!sourceImage) {
    return (
      <div className="space-y-4">
        <StepIndicator currentStep={3} />
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-gradient-to-b from-amber-50/80 to-orange-50/80 rounded-3xl border border-amber-200/80">
          <ImageOff className="w-12 h-12 text-slate-400" />
          <h3 className="font-bold text-base text-slate-700">
            {language === "hi" ? "कोई फोटो नहीं मिली" : "No photo found"}
          </h3>
          <p className="text-xs text-slate-500">
            {language === "hi"
              ? "कृपया पहले उत्पाद की फोटो लें।"
              : "Please capture a product photo first."}
          </p>
          <Button variant="primary" size="md" onClick={() => router.push("/create/studio")}>
            {language === "hi" ? "फोटो स्टूडियो जाएं" : "Go to Photo Studio"}
          </Button>
        </div>
      </div>
    );
  }

  // Processing state
  if (processingState === "processing") {
    const progressPercent = progress?.percent || 0;
    const stageMessages: Record<string, { en: string; hi: string }> = {
      "loading-model": { en: "Loading AI model...", hi: "AI मॉडल लोड हो रहा है..." },
      "removing-bg": { en: "Removing background...", hi: "बैकग्राउंड हटाया जा रहा है..." },
      "cropping": { en: "Auto-cropping product...", hi: "ऑटो-क्रॉप हो रहा है..." },
      "centering": { en: "Centering product...", hi: "उत्पाद सेंटर हो रहा है..." },
      "resizing": { en: "Preparing catalogue image...", hi: "कैटलॉग इमेज तैयार हो रही है..." },
      "compositing": { en: "Applying clean background...", hi: "साफ बैकग्राउंड लगाया जा रहा है..." },
      "fallback": { en: "Applying basic enhancement...", hi: "बेसिक सुधार लागू हो रहा है..." },
    };
    const currentStage = progress?.stage || "loading-model";
    const stageMsg = stageMessages[currentStage] || stageMessages["loading-model"];

    return (
      <div className="space-y-4">
        <StepIndicator currentStep={3} />

        <div className="flex flex-col items-center justify-center p-8 text-center space-y-5 bg-gradient-to-b from-amber-50/80 to-orange-50/80 rounded-3xl border border-amber-200/80 shadow-inner min-h-[360px]">
          {/* Central pulsing icon */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-20 h-20 rounded-full bg-artisan-terracotta/20 animate-ping" />
            <div className="absolute w-16 h-16 rounded-full bg-artisan-gold/30 animate-pulse" />
            <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-tr from-artisan-terracotta to-artisan-gold text-white flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>
          </div>

          <div>
            <h4 className="font-bold text-base text-artisan-indigo tracking-tight">
              {getTranslation(language, "enhanceTitle")}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              {language === "hi" ? stageMsg.hi : stageMsg.en}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xs">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-artisan-terracotta to-artisan-gold rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{progressPercent}%</p>
          </div>

          {/* Pipeline steps */}
          <div className="flex items-center gap-1.5 pt-2">
            <div className="w-1.5 h-6 bg-artisan-terracotta rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-9 bg-artisan-gold rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-5 bg-artisan-indigo rounded-full animate-bounce" />
            <div className="w-1.5 h-8 bg-artisan-terracotta rounded-full animate-bounce [animation-delay:-0.2s]" />
            <div className="w-1.5 h-4 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.4s]" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (processingState === "error") {
    return (
      <div className="space-y-4">
        <StepIndicator currentStep={3} />

        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-gradient-to-b from-rose-50 to-orange-50/50 rounded-3xl border border-rose-200/80">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-bold text-base text-slate-800">
              {language === "hi" ? "सुधार विफल" : "Enhancement Failed"}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              {errorMessage}
            </p>
          </div>
          <div className="flex gap-2 w-full max-w-xs">
            <Button variant="primary" size="md" className="flex-1" onClick={handleRetry} icon={<RotateCcw className="w-4 h-4" />}>
              {language === "hi" ? "पुनः प्रयास" : "Retry"}
            </Button>
            <Button variant="outline" size="md" className="flex-1" onClick={handleUseOriginal}>
              {getTranslation(language, "enhanceUseOriginal")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Done state — Before/After comparison
  return (
    <div className="space-y-4 pb-28">
      <StepIndicator currentStep={3} />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-artisan-indigo">
          {getTranslation(language, "enhanceTitle")}
        </h2>
        <p className="text-xs text-slate-500">
          {getTranslation(language, "enhanceSubtitle")}
        </p>
      </div>

      {/* Fallback notice */}
      {result?.usedFallback && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2 text-amber-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px]">{getTranslation(language, "enhanceFallbackNotice")}</p>
        </div>
      )}

      {/* Before / After Comparison */}
      <div className="space-y-2">
        {/* Toggle tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setShowOriginal(false)}
            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${
              !showOriginal
                ? "bg-white text-artisan-terracotta shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {language === "hi" ? "✨ सुधरी हुई" : "✨ Enhanced"}
          </button>
          <button
            onClick={() => setShowOriginal(true)}
            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${
              showOriginal
                ? "bg-white text-artisan-terracotta shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {language === "hi" ? "📷 असली" : "📷 Original"}
          </button>
        </div>

        {/* Image display */}
        <div className="relative h-72 w-full rounded-3xl overflow-hidden bg-slate-900 border-2 border-amber-900/20 shadow-xl">
          {/* Checkerboard background to show transparency */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: !showOriginal
                ? "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)"
                : "none",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
              backgroundColor: showOriginal ? "#0a0a0a" : "#ffffff",
            }}
          />

          <Image
            src={showOriginal ? (result?.originalUrl || sourceImage) : (result?.enhancedUrl || sourceImage)}
            alt={showOriginal ? "Original" : "Enhanced"}
            fill
            unoptimized
            className="object-contain relative z-10"
          />

          {/* Corner label */}
          <div className="absolute top-3 left-3 z-20">
            <Badge
              variant={showOriginal ? "default" : "success"}
              className={`${
                showOriginal
                  ? "bg-slate-900/80 text-white"
                  : "bg-emerald-600/90 text-white"
              } text-[10px] font-bold shadow-md backdrop-blur-md`}
            >
              {showOriginal ? (
                <>{language === "hi" ? "असली फोटो" : "Original"}</>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {language === "hi" ? "AI सुधरी हुई" : "AI Enhanced"}
                </>
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Enhancement stats badges */}
      {result && !showOriginal && (
        <div className="flex flex-wrap gap-1.5">
          {result.stats.bgRemoved && (
            <Badge variant="success" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
              <ImageOff className="w-3 h-3 mr-0.5" />
              {getTranslation(language, "enhanceBgRemovedTag")}
            </Badge>
          )}
          {result.stats.autoCropped && (
            <Badge variant="default" className="text-[10px] bg-blue-50 text-blue-800 border-blue-200">
              <Crop className="w-3 h-3 mr-0.5" />
              {getTranslation(language, "enhanceCroppedTag")}
            </Badge>
          )}
          {result.stats.centered && (
            <Badge variant="default" className="text-[10px] bg-indigo-50 text-indigo-800 border-indigo-200">
              <Maximize className="w-3 h-3 mr-0.5" />
              {getTranslation(language, "enhanceCenteredTag")}
            </Badge>
          )}
          {result.stats.resized && (
            <Badge variant="success" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
              <CheckCircle2 className="w-3 h-3 mr-0.5" />
              {getTranslation(language, "enhanceResizedTag")}
            </Badge>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full font-bold shadow-lg bg-emerald-700 hover:bg-emerald-800 text-sm py-3.5"
          onClick={handleUseEnhanced}
          icon={<Sparkles className="w-5 h-5" />}
          disabled={!result}
        >
          {getTranslation(language, "enhanceUseEnhanced")}
        </Button>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="md" onClick={handleUseOriginal}>
            <span className="text-[11px]">{getTranslation(language, "enhanceUseOriginal")}</span>
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={handleRetake}
            icon={<Camera className="w-3.5 h-3.5 text-artisan-terracotta" />}
          >
            <span className="text-[11px]">{getTranslation(language, "enhanceRetake")}</span>
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={handleReplace}
            icon={<ImagePlus className="w-3.5 h-3.5 text-artisan-terracotta" />}
          >
            <span className="text-[11px]">{getTranslation(language, "enhanceReplace")}</span>
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => router.push("/create/studio")}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          {getTranslation(language, "btnBack")}
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1 font-bold"
          onClick={result ? handleUseEnhanced : handleUseOriginal}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {getTranslation(language, "btnNext")}
        </Button>
      </div>
    </div>
  );
}

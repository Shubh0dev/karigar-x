"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Camera,
  ImagePlus,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Trash2,
  Sparkles,
} from "lucide-react";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LargeActionButton } from "@/components/ui/LargeActionButton";
import { AIProcessingAnimation } from "@/components/ui/AIProcessingAnimation";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";
import { analyzeProductImage } from "@/lib/api";



const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export default function ProductImageStudioPage() {
  const router = useRouter();
  const { language, productDraft, updateProductDraft, showToast } = useDemo();

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(
    productDraft.originalImage || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const processSelectedFile = (file: File) => {
    setErrorMessage(null);

    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        language === "hi"
          ? "कृपया एक वैध छवि फ़ाइल (JPEG, PNG, WEBP) चुनें।"
          : "Invalid file type. Please select a valid image (JPEG, PNG, WEBP)."
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMessage(
        language === "hi"
          ? `चित्र बहुत बड़ा है (${sizeMb} MB)। 10 MB से कम चुनें।`
          : `Image too large (${sizeMb} MB). Please select under 10 MB.`
      );
      return;
    }

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
        
        // Compress aggressively to stay under 5MB localStorage quota
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        
        setSelectedImage(dataUrl);
        setSelectedFile(file);
        updateProductDraft({ originalImage: dataUrl });
        showToast(
          language === "hi" ? "चित्र लोड हुआ!" : "Photo captured!",
          "success"
        );
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setErrorMessage(
        language === "hi"
          ? "चित्र लोड करने में विफल।"
          : "Failed to load image preview."
      );
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processSelectedFile(files[0]);
  };

  const triggerCameraInput = () => {
    setErrorMessage(null);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
      cameraInputRef.current.click();
    }
  };

  const triggerGalleryInput = () => {
    setErrorMessage(null);
    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
      galleryInputRef.current.click();
    }
  };

  const handleCancelSelection = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setErrorMessage(null);
    updateProductDraft({ originalImage: undefined, material: undefined, craftType: undefined, colors: undefined, style: undefined, visibleFeatures: undefined });
    showToast(language === "hi" ? "चित्र हटाया गया" : "Photo removed", "info");
  };

  const handleConfirmUsePhoto = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);

    try {
      if (selectedFile) {
        // Real file upload → backend AI analysis
        const { data: analysis, isDemo } = await analyzeProductImage(selectedFile);
        updateProductDraft({
          originalImage: selectedImage,
          categoryNameEn: analysis.category || productDraft.categoryNameEn,
          material: analysis.material,
          craftType: analysis.craft_type,
          colors: analysis.colors,
          style: analysis.style,
          visibleFeatures: analysis.visible_features,
        });
        showToast(
          isDemo
            ? language === "hi" ? "डेमो मोड: AI विश्लेषण (सिमुलेटेड)" : "Demo Mode: AI analysis (simulated)"
            : language === "hi" ? "AI ने आपकी हस्तकला समझ ली!" : "AI understood your craft!",
          isDemo ? "info" : "success"
        );
      } else {
        // Sample image selected (no File object) — use demo analysis
        updateProductDraft({
          originalImage: selectedImage,
          categoryNameEn: productDraft.categoryNameEn || "Terracotta & Clay",
          material: "Natural Alluvial Clay",
          craftType: "Hand-molded & Kiln-fired",
          colors: ["Earthy Red", "Ochre", "Brown"],
          style: "Traditional Bankura Heritage",
          visibleFeatures: ["Horse figurine", "Hand-wheel molded body", "Natural earth pigment"],
        });
        showToast(
          language === "hi" ? "डेमो मोड: नमूना विश्लेषण" : "Demo Mode: sample analysis loaded",
          "info"
        );
      }

      router.push("/create/enhance");
    } catch {
      setErrorMessage(
        language === "hi"
          ? "विश्लेषण विफल। कृपया पुनः प्रयास करें।"
          : "Analysis failed. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="space-y-4">
        <StepIndicator currentStep={2} />
        <AIProcessingAnimation
          title={language === "hi" ? "आपकी हस्तकला समझी जा रही है..." : "Understanding your craft..."}
          subtitle={language === "hi" ? "AI श्रेणी, सामग्री, शैली और विशेषताएं निकाल रहा है" : "AI extracting category, material, style & visible features"}
          type="vision"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StepIndicator currentStep={2} />

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-artisan-indigo">
          {getTranslation(language, "studioTitle")}
        </h2>
        <p className="text-xs text-slate-500">
          {getTranslation(language, "studioSubtitle")}
        </p>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-rose-900 text-xs shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">{language === "hi" ? "त्रुटि" : "Error"}</h4>
            <p className="text-[11px] mt-0.5">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800 p-1">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {selectedImage ? (
        <div className="space-y-3">
          <div className="relative h-72 w-full rounded-3xl overflow-hidden bg-slate-900 border-2 border-amber-900/20 shadow-xl">
            <Image src={selectedImage} alt="Craft Preview" fill unoptimized className="object-contain bg-slate-950" />
            <div className="absolute top-3 left-3">
              <Badge variant="success" className="bg-white/90 backdrop-blur-md text-emerald-800 text-[10px] font-bold shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                {language === "hi" ? "चित्र चुना गया" : "Photo Selected"}
              </Badge>
            </div>
            <button onClick={handleCancelSelection} className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors shadow-md">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-lg bg-emerald-700 hover:bg-emerald-800 text-sm py-3.5"
              onClick={handleConfirmUsePhoto}
              icon={<Sparkles className="w-5 h-5" />}
            >
              {language === "hi" ? "AI से समझें और आगे बढ़ें" : "Analyze & Continue"}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="md" onClick={triggerCameraInput} icon={<Camera className="w-4 h-4 text-artisan-terracotta" />}>
                {getTranslation(language, "btnRetakePhoto")}
              </Button>
              <Button variant="outline" size="md" onClick={triggerGalleryInput} icon={<ImagePlus className="w-4 h-4 text-artisan-terracotta" />}>
                {getTranslation(language, "studioSimulateUpload")}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 rounded-3xl p-5 border-2 border-dashed border-amber-300 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-artisan-terracotta flex items-center justify-center mx-auto shadow-inner">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800">
                {language === "hi" ? "उत्पाद की साफ़ फोटो लें" : "Capture Product Photo"}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                {language === "hi"
                  ? "अपने मोबाइल के पीछे के कैमरे से साफ़ रोशनी में फोटो खींचें।"
                  : "Use your smartphone camera to capture your craft in clear natural light."}
              </p>
            </div>
            <div className="space-y-2.5 pt-1">
              <LargeActionButton title={language === "hi" ? "उत्पाद की फोटो लें" : "Take Product Photo"} subtitle={language === "hi" ? "पीछे का कैमरा खोलें" : "Opens rear camera directly"} icon={<Camera className="w-6 h-6" />} onClick={triggerCameraInput} variant="terracotta" />
              <LargeActionButton title={language === "hi" ? "गैलरी से फोटो चुनें" : "Upload from Gallery"} subtitle={language === "hi" ? "फोन की फोटो लाइब्रेरी से चुनें" : "Choose existing photo from device"} icon={<ImagePlus className="w-6 h-6" />} onClick={triggerGalleryInput} variant="indigo" />
            </div>
          </div>


        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="ghost" size="lg" onClick={() => router.push("/create")} icon={<ArrowLeft className="w-4 h-4" />}>
          {getTranslation(language, "btnBack")}
        </Button>
        <Button variant="primary" size="lg" className="flex-1 font-bold" disabled={!selectedImage} onClick={handleConfirmUsePhoto} icon={<ArrowRight className="w-4 h-4" />}>
          {getTranslation(language, "btnNext")}
        </Button>
      </div>
    </div>
  );
}

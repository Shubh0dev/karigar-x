"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  ArrowRight,
  ArrowLeft,
  MessageSquareText,
  AlertTriangle,
  Trash2,
  Sparkles,
  Globe,
} from "lucide-react";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AIProcessingAnimation } from "@/components/ui/AIProcessingAnimation";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { generateCatalogue } from "@/lib/api";
import { sampleVoiceTranscripts } from "@/lib/mockData";

export default function VoiceCataloguerPage() {
  const router = useRouter();
  const { language, productDraft, updateProductDraft, showToast } = useDemo();

  const speech = useSpeechRecognition();

  // Voice language selection (independent of UI language)
  const [voiceLang, setVoiceLang] = useState<"en" | "hi">(language);
  const [editableTranscript, setEditableTranscript] = useState<string>(
    (voiceLang === "en" ? productDraft.transcriptEn : productDraft.transcriptHi) || ""
  );

  // Sync state if voice language changes
  useEffect(() => {
    setEditableTranscript((voiceLang === "en" ? productDraft.transcriptEn : productDraft.transcriptHi) || "");
  }, [voiceLang]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync speech transcript into editable field
  useEffect(() => {
    if (speech.transcript) {
      setEditableTranscript((prev) => {
        const newText = speech.transcript.trim();
        // If previous text was the demo sample, replace it entirely
        if (prev === sampleVoiceTranscripts.en || prev === sampleVoiceTranscripts.hi) {
          return newText;
        }
        // Otherwise append if new content
        return prev ? `${prev} ${newText}` : newText;
      });
    }
  }, [speech.transcript]);

  const handleStartRecording = () => {
    const langCode = voiceLang === "hi" ? "hi-IN" : "en-IN";
    speech.startListening(langCode);
  };

  const handleStopRecording = () => {
    speech.stopListening();
    showToast(
      language === "hi" ? "आवाज दर्ज की गई!" : "Voice recorded!",
      "success"
    );
  };

  const handleUseDemoTranscript = () => {
    const demo = voiceLang === "hi" ? sampleVoiceTranscripts.hi : sampleVoiceTranscripts.en;
    setEditableTranscript(demo);
    showToast(
      language === "hi" ? "डेमो ट्रांसक्रिप्ट लोड किया गया" : "Demo transcript loaded",
      "info"
    );
  };

  const handleClearTranscript = () => {
    setEditableTranscript("");
    speech.resetTranscript();
  };

  const handleNext = async () => {
    // Save transcript to creation flow
    updateProductDraft({ 
      transcriptEn: voiceLang === "en" ? editableTranscript : productDraft.transcriptEn,
      transcriptHi: voiceLang === "hi" ? editableTranscript : productDraft.transcriptHi 
    });

    setIsGenerating(true);

    try {
      const analysis = {
        category: productDraft.categoryNameEn || "Terracotta & Clay",
        material: productDraft.material || "Natural Alluvial Clay",
        craft_type: productDraft.craftType || "Hand-molded & Kiln-fired",
        colors: productDraft.colors || ["Earthy Red", "Ochre"],
        style: productDraft.style || "Traditional Bankura Heritage",
        visible_features: productDraft.visibleFeatures || ["Horse figurine", "Hand-wheel molded body"],
      };

      const { data: catalogue, isDemo } = await generateCatalogue(
        analysis,
        editableTranscript
      );

      updateProductDraft({
        titleEn: catalogue.title,
        descriptionEn: catalogue.description,
        featuresEn: catalogue.features,
        tagsEn: catalogue.tags,
      });

      showToast(
        isDemo
          ? language === "hi" ? "डेमो मोड: कैटलॉग तैयार" : "Demo Mode: catalogue generated"
          : language === "hi" ? "AI कैटलॉग तैयार है!" : "AI catalogue generated!",
        isDemo ? "info" : "success"
      );

      router.push("/create/result");
    } catch {
      showToast(
        language === "hi" ? "कैटलॉग बनाने में विफल" : "Failed to generate catalogue",
        "warning"
      );
      router.push("/create/result");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="space-y-4">
        <StepIndicator currentStep={4} />
        <AIProcessingAnimation
          title={language === "hi" ? "AI कैटलॉग तैयार हो रहा है..." : "Generating AI Catalogue..."}
          subtitle={language === "hi" ? "चित्र विश्लेषण + आवाज विवरण से उत्पाद सूची बनाई जा रही है" : "Combining image analysis + voice description into structured listing"}
          type="voice"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StepIndicator currentStep={4} />

      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-artisan-indigo">
          {getTranslation(language, "voiceTitle")}
        </h2>
        <p className="text-xs text-slate-500">
          {getTranslation(language, "voiceSubtitle")}
        </p>
      </div>

      {/* Voice Language Selector */}
      <div className="flex items-center justify-center gap-2">
        <Globe className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-600 font-semibold">
          {language === "hi" ? "बोलने की भाषा:" : "Speaking Language:"}
        </span>
        <div className="flex rounded-full bg-white border border-amber-900/10 p-0.5 shadow-xs">
          <button
            onClick={() => setVoiceLang("en")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              voiceLang === "en"
                ? "bg-artisan-terracotta text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setVoiceLang("hi")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              voiceLang === "hi"
                ? "bg-artisan-terracotta text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            हिन्दी
          </button>
        </div>
      </div>

      {/* Speech Recognition Error / Unsupported Banner */}
      {!speech.isSupported && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">
              {language === "hi" ? "वॉइस रिकॉग्निशन उपलब्ध नहीं" : "Voice Recognition Unavailable"}
            </h4>
            <p className="text-[11px] mt-0.5">
              {language === "hi"
                ? "यह ब्राउज़र वॉइस रिकॉग्निशन का समर्थन नहीं करता। कृपया Chrome या Safari का उपयोग करें, या मैन्युअल रूप से टाइप करें।"
                : "This browser doesn't support speech recognition. Please use Chrome or Safari, or type manually below."}
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={handleUseDemoTranscript}>
              {language === "hi" ? "डेमो ट्रांसक्रिप्ट लोड करें" : "Load Demo Transcript"}
            </Button>
          </div>
        </div>
      )}

      {speech.error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-900">
          <p className="font-semibold">{speech.error}</p>
        </div>
      )}

      {/* Microphone Button + Recording Animation */}
      <div className="glass-panel p-6 rounded-3xl text-center space-y-4 border border-amber-900/10 shadow-lg">
        <button
          onClick={speech.isListening ? handleStopRecording : handleStartRecording}
          disabled={!speech.isSupported && !speech.isListening}
          className={`relative mx-auto w-24 h-24 rounded-full flex items-center justify-center text-white transition-all duration-300 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
            speech.isListening
              ? "bg-rose-600 ring-8 ring-rose-500/30 animate-pulse"
              : "bg-gradient-to-tr from-artisan-terracotta to-artisan-gold hover:scale-105"
          }`}
        >
          {speech.isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
        </button>

        <div>
          <h3 className="font-bold text-sm text-slate-800">
            {speech.isListening
              ? getTranslation(language, "voiceListening")
              : getTranslation(language, "btnRecordVoice")}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
            {getTranslation(language, "voiceInstruction")}
          </p>
        </div>

        {/* Live Waveform Animation */}
        {speech.isListening && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5 py-2">
              <span className="w-2 h-6 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-10 bg-rose-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-14 bg-rose-700 rounded-full animate-bounce" />
              <span className="w-2 h-8 bg-rose-600 rounded-full animate-bounce [animation-delay:-0.2s]" />
              <span className="w-2 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.4s]" />
            </div>

            {/* Live Interim Transcript */}
            {speech.interimTranscript && (
              <p className="text-xs text-slate-500 italic bg-white/60 rounded-xl p-2 border border-slate-100">
                {speech.interimTranscript}...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Editable Transcript Box */}
      <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <MessageSquareText className="w-4 h-4 text-artisan-terracotta" />
            {getTranslation(language, "voiceTranscribed")}
          </span>
          <div className="flex items-center gap-1.5">
            {editableTranscript && (
              <button
                onClick={handleClearTranscript}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Clear"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <Badge variant="success" className="text-[10px]">
              {voiceLang === "hi" ? "हिन्दी" : "English"}
            </Badge>
          </div>
        </div>

        <textarea
          value={editableTranscript}
          onChange={(e) => setEditableTranscript(e.target.value)}
          placeholder={
            language === "hi"
              ? "यहाँ बोलकर दर्ज करें या टाइप करें..."
              : "Speak or type your product description here..."
          }
          rows={4}
          className="w-full text-xs text-slate-700 bg-white p-3 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-artisan-terracotta/40 leading-relaxed font-medium resize-none"
        />

        {!editableTranscript && (
          <Button variant="ghost" size="sm" onClick={handleUseDemoTranscript} icon={<Sparkles className="w-3 h-3 text-artisan-terracotta" />}>
            {language === "hi" ? "डेमो विवरण लोड करें" : "Load Demo Description"}
          </Button>
        )}
      </div>

      {/* Analysis Preview (if available) */}
      {productDraft.material && (
        <div className="glass-panel p-3 rounded-2xl border border-amber-900/10 space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {language === "hi" ? "AI चित्र विश्लेषण:" : "AI Image Analysis:"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="terracotta" className="text-[10px]">{productDraft.categoryNameEn}</Badge>
            <Badge variant="outline" className="text-[10px]">{productDraft.material}</Badge>
            <Badge variant="outline" className="text-[10px]">{productDraft.craftType}</Badge>
            {productDraft.colors?.slice(0, 3).map((c, i) => (
              <Badge key={i} variant="default" className="text-[10px]">{c}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex gap-2 pt-2">
        <Button variant="ghost" size="lg" onClick={() => router.push("/create/studio")} icon={<ArrowLeft className="w-4 h-4" />}>
          {getTranslation(language, "btnBack")}
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1 font-bold"
          onClick={handleNext}
          disabled={!editableTranscript.trim() && !productDraft.material}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {getTranslation(language, "btnNext")} (AI Catalogue)
        </Button>
      </div>
    </div>
  );
}

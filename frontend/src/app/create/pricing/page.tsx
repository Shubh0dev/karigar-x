"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Info,
  TrendingUp,
  Cpu,
  RefreshCw,
  Wallet,
  Clock,
  Layers,
  Banknote,
  Mic,
  CheckCircle2
} from "lucide-react";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AIProcessingAnimation } from "@/components/ui/AIProcessingAnimation";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";
import { predictPrice } from "@/lib/api";
import { PricingPrediction } from "@/lib/types";

export default function SmartPricingPage() {
  const router = useRouter();
  const { language, productDraft, updateProductDraft, showToast } = useDemo();

  const [isLoading, setIsLoading] = useState(true);
  const [prediction, setPrediction] = useState<PricingPrediction | null>(null);
  
  // ── Read voice interview data to pre-fill inputs ────────────────────────────
  const vid = productDraft.voiceInterviewData;

  // Pre-fill from voice: production_time_hours → laborHours, people → complexity
  const defaultLaborHours =
    productDraft.voiceLaborHours ??
    (vid?.production_time_hours ?? 12);

  // Complexity: 1 person = grade 2, 2 = 3, 3+ = 4, no data = 3
  const voiceComplexity = vid?.people_involved
    ? Math.min(5, Math.max(1, vid.people_involved + 1))
    : 3;

  // Interactive inputs for real-time recalculation
  const [materialCost, setMaterialCost] = useState(250);
  const [laborHours, setLaborHours] = useState(defaultLaborHours);
  const [laborRate, setLaborRate] = useState(100);

  // Track which fields came from voice (for the badge)
  const voiceFieldsUsed: string[] = [];
  if (vid?.production_time_hours) voiceFieldsUsed.push(language === "hi" ? "बनाने का समय" : "Production Time");
  if (vid?.people_involved)       voiceFieldsUsed.push(language === "hi" ? "लोग" : "People Involved");
  if (vid?.craft_technique)       voiceFieldsUsed.push(language === "hi" ? "कारीगरी" : "Craft Technique");
  if (vid?.materials?.length)     voiceFieldsUsed.push(language === "hi" ? "सामग्री" : "Materials");
  if (vid?.dimensions)            voiceFieldsUsed.push(language === "hi" ? "आकार" : "Dimensions");

  const fetchPrediction = async () => {
    setIsLoading(true);
    try {
      const features = {
        category:    productDraft.categoryNameEn || vid?.product_type || "Terracotta & Clay",
        material:    vid?.materials?.join(", ") || productDraft.material || "Natural Clay",
        material_cost: materialCost,
        labour_hours:  laborHours,
        labour_rate:   laborRate,
        quality_score: 4.0,
        craftsmanship_complexity: voiceComplexity,
        size_scale: 3,
        season_demand_index: 1.1,
        market_reference_price: 0,
        ...(vid?.craft_technique ? { craft_technique: vid.craft_technique } : {}),
        ...(vid?.dimensions      ? { dimensions: vid.dimensions }            : {}),
      };
      
      const res = await predictPrice(features);
      setPrediction(res);
      
      showToast(
        res.is_demo 
          ? (language === "hi" ? "मूल्य गणना पूर्ण" : "Price calculated")
          : (language === "hi" ? "AI मूल्य विश्लेषण पूर्ण" : "Price analysis complete"),
        res.is_demo ? "info" : "success"
      );
    } catch (err) {
      showToast(
        language === "hi" ? "मूल्य गणना में त्रुटि" : "Failed to calculate price",
        "warning"
      );
      // Fallback dummy prediction if backend fails
      setPrediction({
        predicted_price: 1850,
        lower_bound: 1650,
        upper_bound: 2100,
        fair_price_breakdown: {
          material_cost: materialCost,
          labor_cost: laborHours * laborRate,
          craftsmanship_premium: 350,
          demand_adjustment: 50
        },
        top_contributing_factors: [
          ...(vid?.production_time ? ["Production Time"] : []),
          ...(vid?.craft_technique ? ["Craft Technique"] : []),
          "Material",
        ],
        explanation: language === "hi"
          ? "अनुमानित मूल्य (API उपलब्ध नहीं) — आवाज़ से मिली जानकारी के आधार पर।"
          : "Estimated price (API unavailable) — based on voice-provided information.",
        is_demo: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecalculate = () => {
    fetchPrediction();
  };

  const handleNext = () => {
    if (prediction) {
      updateProductDraft({
        predictedPrice: prediction.predicted_price,
        priceRange: { min: prediction.lower_bound, max: prediction.upper_bound },
        priceFactors: {
          topFactors: prediction.top_contributing_factors,
          explanation: prediction.explanation
        }
      });
    }
    router.push("/create/marketplace");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <StepIndicator currentStep={6} />
        <AIProcessingAnimation
          title={language === "hi" ? "उचित मूल्य की गणना की जा रही है..." : "Calculating Fair Market Price..."}
          subtitle={language === "hi" ? "सामग्री, मेहनत और बाज़ार की मांग का विश्लेषण" : "Analyzing materials, labor, and live market demand via ML"}
          type="pricing"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StepIndicator currentStep={6} />

      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-artisan-indigo">
          {getTranslation(language, "pricingTitle") || "Smart Pricing ML"}
        </h2>
        <p className="text-xs text-slate-500">
          {getTranslation(language, "pricingSubtitle") || "AI-recommended fair selling price"}
        </p>
      </div>

      {prediction && (
        <>
          {/* Voice Data Used banner */}
          {voiceFieldsUsed.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-artisan-terracotta/10 flex items-center justify-center">
                  <Mic className="w-3.5 h-3.5 text-artisan-terracotta" />
                </div>
                <h4 className="text-xs font-bold text-amber-900">
                  {language === "hi" ? "🎙️ आवाज़ से मिली जानकारी का उपयोग" : "🎙️ Voice Interview Data Used"}
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {voiceFieldsUsed.map((field, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 rounded-full px-2.5 py-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Factors Considered */}
          {prediction.top_contributing_factors.length > 0 && (
            <div className="glass-panel p-3.5 rounded-2xl border border-emerald-200 space-y-2">
              <h4 className="text-xs font-bold text-emerald-800">
                {language === "hi" ? "मूल्य में शामिल कारक:" : "Factors Considered:"}
              </h4>
              <div className="space-y-1">
                {prediction.top_contributing_factors.map((factor, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                    <span className="text-emerald-500">✓</span>
                    {factor}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Price Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 right-0 p-4 opacity-10">
              <Cpu className="w-24 h-24" />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">
                  {language === "hi" ? "AI अनुशंसित मूल्य सीमा" : "AI Suggested Price Range"}
                </span>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-[10px]">
                  {prediction.is_demo ? "Local Engine" : "XGBoost ML"}
                </Badge>
              </div>

              <div className="flex items-end gap-2">
                <span className="text-4xl font-black">₹{prediction.predicted_price.toLocaleString()}</span>
                <span className="text-sm text-emerald-200 font-medium mb-1.5">/ item</span>
              </div>

              <div className="bg-black/20 rounded-xl p-3 flex items-center justify-between backdrop-blur-md border border-white/10">
                <div className="space-y-0.5">
                  <span className="block text-[10px] text-emerald-200/80 font-semibold uppercase">
                    {language === "hi" ? "न्यूनतम मूल्य" : "Lower Bound"}
                  </span>
                  <span className="block text-sm font-bold">₹{prediction.lower_bound.toLocaleString()}</span>
                </div>
                <div className="h-6 w-px bg-white/20" />
                <div className="space-y-0.5 text-right">
                  <span className="block text-[10px] text-emerald-200/80 font-semibold uppercase">
                    {language === "hi" ? "अधिकतम मूल्य" : "Upper Bound"}
                  </span>
                  <span className="block text-sm font-bold">₹{prediction.upper_bound.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Explanation & Breakdown */}
          <div className="space-y-3">
            <div className="glass-panel p-4 rounded-2xl border border-amber-900/10 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-artisan-terracotta" />
                {language === "hi" ? "मूल्य का विवरण" : "Price Breakdown"}
              </h4>
              
              <div className="space-y-2 text-xs font-medium text-slate-600">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Material Cost</span>
                  <span className="text-slate-900 font-bold">₹{prediction.fair_price_breakdown.material_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Labor Cost</span>
                  <span className="text-slate-900 font-bold">₹{prediction.fair_price_breakdown.labor_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center bg-amber-50 p-2 rounded-lg text-amber-800">
                  <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Craftsmanship Premium</span>
                  <span className="font-bold">+ ₹{prediction.fair_price_breakdown.craftsmanship_premium.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg text-emerald-800">
                  <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Market Demand Adj.</span>
                  <span className="font-bold">+ ₹{prediction.fair_price_breakdown.demand_adjustment.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100 flex gap-3 text-xs text-indigo-900 shadow-inner">
              <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{prediction.explanation}</p>
            </div>
          </div>

          {/* Interactive Adjustments */}
          <div className="glass-panel p-4 rounded-2xl border border-amber-900/10 space-y-3">
             <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-artisan-terracotta" />
                {language === "hi" ? "लागत बदलें" : "Adjust Costs"}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Material (₹)</label>
                  <input 
                    type="number" 
                    value={materialCost} 
                    onChange={(e) => setMaterialCost(Number(e.target.value))}
                    className="w-full text-sm font-bold text-slate-800 bg-white p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-artisan-terracotta/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Labor Hours</label>
                  <input 
                    type="number" 
                    value={laborHours} 
                    onChange={(e) => setLaborHours(Number(e.target.value))}
                    className="w-full text-sm font-bold text-slate-800 bg-white p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-artisan-terracotta/30"
                  />
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleRecalculate} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                Recalculate Price
              </Button>
          </div>
        </>
      )}

      {/* Navigation Footer */}
      <div className="flex gap-2 pt-2">
        <Button variant="ghost" size="lg" onClick={() => router.push("/create/result")} icon={<ArrowLeft className="w-4 h-4" />}>
          {getTranslation(language, "btnBack")}
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1 font-bold"
          onClick={handleNext}
          icon={<ArrowRight className="w-4 h-4" />}
          disabled={!prediction}
        >
          {getTranslation(language, "btnNext")} (Publish)
        </Button>
      </div>
    </div>
  );
}

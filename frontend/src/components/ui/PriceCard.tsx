"use client";

import React from "react";
import { ShieldCheck, TrendingUp, Info } from "lucide-react";
import { PriceBreakdown } from "@/lib/types";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";

interface PriceCardProps {
  pricing: PriceBreakdown;
  onPricingChange?: (updated: PriceBreakdown) => void;
}

export const PriceCard: React.FC<PriceCardProps> = ({ pricing, onPricingChange }) => {
  const { language } = useDemo();

  const handleMaterialChange = (val: number) => {
    if (!onPricingChange) return;
    const newMaterial = Math.max(50, val);
    const laborTotal = pricing.laborHours * pricing.laborHourlyRate;
    const minFair = Math.round((newMaterial + laborTotal) * 1.1);
    const b2b = Math.round(minFair * pricing.demandIndex * (1 + pricing.complexityGrade * 0.05));
    onPricingChange({
      ...pricing,
      rawMaterialCost: newMaterial,
      minimumFairPrice: minFair,
      suggestedB2BPrice: b2b,
    });
  };

  const handleLaborHoursChange = (val: number) => {
    if (!onPricingChange) return;
    const newHours = Math.max(1, val);
    const laborTotal = newHours * pricing.laborHourlyRate;
    const minFair = Math.round((pricing.rawMaterialCost + laborTotal) * 1.1);
    const b2b = Math.round(minFair * pricing.demandIndex * (1 + pricing.complexityGrade * 0.05));
    onPricingChange({
      ...pricing,
      laborHours: newHours,
      minimumFairPrice: minFair,
      suggestedB2BPrice: b2b,
    });
  };

  return (
    <div className="space-y-4">
      {/* Primary Price Recommendation Banner */}
      <div className="bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            {getTranslation(language, "pricingFairGuarantee")}
          </div>
          <span className="text-[10px] text-emerald-200/80 font-mono">XGBoost ML v0.1</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <span className="text-[11px] text-emerald-100/80 uppercase font-semibold tracking-wide block">
              {getTranslation(language, "pricingMinimumFair")}
            </span>
            <span className="text-2xl font-extrabold text-amber-300">
              ₹{pricing.minimumFairPrice.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="border-l border-white/20 pl-3">
            <span className="text-[11px] text-emerald-100/80 uppercase font-semibold tracking-wide flex items-center gap-1">
              {getTranslation(language, "pricingSuggestedB2B")}
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
            </span>
            <span className="text-2xl font-extrabold text-white">
              ₹{pricing.suggestedB2BPrice.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Breakdown Controls */}
      <div className="glass-panel rounded-2xl p-4 space-y-4 border border-amber-900/10">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {language === "hi" ? "दाम ब्रेकडाउन (कैलकुलेटर)" : "Cost & Pricing Parameters"}
          </h4>
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            {language === "hi" ? "बदलने के लिए खिसकाएँ" : "Slide to adjust"}
          </span>
        </div>

        {/* Material Cost Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>{getTranslation(language, "pricingMaterialCost")}</span>
            <span className="font-bold text-artisan-terracotta">₹{pricing.rawMaterialCost}</span>
          </div>
          <input
            type="range"
            min="100"
            max="1500"
            step="50"
            value={pricing.rawMaterialCost}
            onChange={(e) => handleMaterialChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-artisan-terracotta"
          />
        </div>

        {/* Labor Hours Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>{getTranslation(language, "pricingLaborHours")}</span>
            <span className="font-bold text-artisan-terracotta">{pricing.laborHours} hrs</span>
          </div>
          <input
            type="range"
            min="2"
            max="40"
            step="1"
            value={pricing.laborHours}
            onChange={(e) => handleLaborHoursChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-artisan-terracotta"
          />
        </div>

        {/* Static Metrics */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 text-[10px] block">
              {getTranslation(language, "pricingComplexity")}
            </span>
            <span className="font-bold text-slate-800">
              Grade {pricing.complexityGrade} / 5
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 text-[10px] block">
              {language === "hi" ? "बाज़ार मांग सूचकांक" : "Market Demand Index"}
            </span>
            <span className="font-bold text-emerald-700">
              {pricing.demandIndex}x High
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

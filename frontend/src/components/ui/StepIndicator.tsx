"use client";

import React from "react";
import { Check } from "lucide-react";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";

interface StepIndicatorProps {
  currentStep: number; // 1 to 7
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const { language } = useDemo();

  const steps = [
    { number: 1, label: getTranslation(language, "step1Category") },
    { number: 2, label: getTranslation(language, "step2Studio") },
    { number: 3, label: getTranslation(language, "step3Enhance") },
    { number: 4, label: getTranslation(language, "step4Voice") },
    { number: 5, label: getTranslation(language, "step5Result") },
    { number: 6, label: getTranslation(language, "step6Pricing") },
    { number: 7, label: getTranslation(language, "step7Market") },
  ];

  return (
    <div className="w-full bg-white/90 rounded-2xl p-3 border border-amber-900/10 shadow-xs mb-4">
      <div className="flex items-center justify-between relative">
        {/* Connecting Line */}
        <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-slate-200 -z-0" />
        <div
          className="absolute top-3.5 left-4 h-0.5 bg-artisan-terracotta transition-all duration-300 -z-0"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 90}%` }}
        />

        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <div key={step.number} className="flex flex-col items-center z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? "bg-emerald-600 text-white shadow-xs"
                    : isCurrent
                    ? "bg-artisan-terracotta text-white ring-4 ring-artisan-terracotta/20 scale-110 shadow-md"
                    : "bg-slate-100 text-slate-400 border border-slate-300"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.number}
              </div>
              <span
                className={`text-[9px] mt-1 font-semibold max-w-[48px] text-center leading-tight truncate ${
                  isCurrent ? "text-artisan-terracotta font-bold" : "text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

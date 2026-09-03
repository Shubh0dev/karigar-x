import React from "react";
import { Sparkles, Cpu, Wand2 } from "lucide-react";

interface AIProcessingAnimationProps {
  title: string;
  subtitle?: string;
  type?: "voice" | "vision" | "pricing";
}

export const AIProcessingAnimation: React.FC<AIProcessingAnimationProps> = ({
  title,
  subtitle,
  type = "vision",
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-gradient-to-b from-amber-50/80 to-orange-50/80 rounded-3xl border border-amber-200/80 shadow-inner">
      <div className="relative flex items-center justify-center">
        {/* Outer Pulsing Rings */}
        <div className="absolute w-20 h-20 rounded-full bg-artisan-terracotta/20 animate-ping" />
        <div className="absolute w-16 h-16 rounded-full bg-artisan-gold/30 animate-pulse" />

        {/* Central Icon */}
        <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-tr from-artisan-terracotta to-artisan-gold text-white flex items-center justify-center shadow-lg">
          {type === "pricing" ? (
            <Cpu className="w-7 h-7 animate-bounce" />
          ) : type === "voice" ? (
            <Wand2 className="w-7 h-7 animate-spin" />
          ) : (
            <Sparkles className="w-7 h-7 animate-pulse" />
          )}
        </div>
      </div>

      <div>
        <h4 className="font-bold text-base text-artisan-indigo tracking-tight">
          {title}
        </h4>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Audio / Processing Wave Visualizer */}
      <div className="flex items-center gap-1.5 pt-2">
        <div className="w-1.5 h-6 bg-artisan-terracotta rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-9 bg-artisan-gold rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-5 bg-artisan-indigo rounded-full animate-bounce" />
        <div className="w-1.5 h-8 bg-artisan-terracotta rounded-full animate-bounce [animation-delay:-0.2s]" />
        <div className="w-1.5 h-4 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.4s]" />
      </div>
    </div>
  );
};

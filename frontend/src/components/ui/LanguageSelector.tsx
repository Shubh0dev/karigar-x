"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useDemo } from "@/context/DemoContext";

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useDemo();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "hi" : "en")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100/80 text-artisan-terracotta hover:bg-amber-200/80 border border-amber-300/60 shadow-xs transition-all active:scale-95"
      title="Switch Language / भाषा बदलें"
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{language === "en" ? "हिन्दी" : "English"}</span>
    </button>
  );
};

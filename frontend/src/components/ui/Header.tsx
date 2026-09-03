"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "./Badge";
import { LanguageSelector } from "./LanguageSelector";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";

export const Header: React.FC = () => {
  const { language } = useDemo();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-900/10 px-4 py-3 shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-artisan-terracotta to-artisan-gold flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-lg leading-none tracking-tight text-artisan-indigo">
                {getTranslation(language, "appName")}
              </h1>
              <Badge variant="terracotta" className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider">
                {getTranslation(language, "demoMode")}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
              {getTranslation(language, "tagline")}
            </p>
          </div>
        </Link>

        <LanguageSelector />
      </div>
    </header>
  );
};

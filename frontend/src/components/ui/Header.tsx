"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { LanguageSelector } from "./LanguageSelector";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";

export const Header: React.FC = () => {
  const { language } = useDemo();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-full overflow-hidden shadow-xs border border-slate-200/80 group-hover:scale-105 transition-transform bg-white shrink-0">
            <Image
              src="/logo.png"
              alt="KariGarX Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-none tracking-tight text-artisan-indigo flex items-center gap-0.5">
              <span>KariGar</span>
              <span className="text-orange-600">X</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
              {getTranslation(language, "tagline")}
            </p>
          </div>
        </Link>

        <LanguageSelector />
      </div>
    </header>
  );
};

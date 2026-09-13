"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Badge } from "./Badge";
import { LanguageSelector } from "./LanguageSelector";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";
import {
  getPhotoStudioProviderStatus,
  PhotoStudioStatusInfo,
} from "@/lib/photoStudioService";

export const Header: React.FC = () => {
  const { language } = useDemo();
  const pathname = usePathname();
  const [studioStatus, setStudioStatus] = useState<PhotoStudioStatusInfo | null>(null);

  useEffect(() => {
    let active = true;
    getPhotoStudioProviderStatus().then((status) => {
      if (active) {
        setStudioStatus(status);
      }
    });
    return () => {
      active = false;
    };
  }, [pathname]);

  const isPhotoStudio =
    pathname?.startsWith("/create/studio") ||
    pathname?.startsWith("/create/enhance");

  const renderBadge = () => {
    // If user is on Photo Studio routes, show status based specifically on photo_studio_provider
    if (isPhotoStudio) {
      if (!studioStatus) {
        return (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider text-slate-400 border-slate-300"
          >
            CHECKING...
          </Badge>
        );
      }

      if (studioStatus.provider === "BriaProvider") {
        return (
          <Badge
            variant="success"
            className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider bg-emerald-600 text-white border-emerald-500 flex items-center gap-1 shadow-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse inline-block" />
            BRIA AI
          </Badge>
        );
      }

      if (studioStatus.provider === "StabilityProvider") {
        return (
          <Badge
            variant="success"
            className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider bg-emerald-600 text-white border-emerald-500 flex items-center gap-1 shadow-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse inline-block" />
            LIVE AI
          </Badge>
        );
      }

      if (
        studioStatus.provider === "DemoProvider" ||
        studioStatus.provider === "DemoStudioProvider"
      ) {
        return (
          <Badge
            variant="terracotta"
            className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider"
          >
            DEMO MODE
          </Badge>
        );
      }

      // Neutral status when provider cannot be determined
      return (
        <Badge
          variant="outline"
          className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider text-slate-500 border-slate-300"
        >
          {studioStatus.label === "OFFLINE" ? "OFFLINE" : "STANDBY"}
        </Badge>
      );
    }

    // Default general app header badge
    return (
      <Badge
        variant="terracotta"
        className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider"
      >
        {getTranslation(language, "demoMode")}
      </Badge>
    );
  };

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
              {renderBadge()}
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

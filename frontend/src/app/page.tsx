"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Mic, Store, Award } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LargeActionButton } from "@/components/ui/LargeActionButton";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";

export default function LandingPage() {
  const { language } = useDemo();

  return (
    <div className="space-y-5">
      {/* High Impact Hero Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-artisan-terracotta via-amber-700 to-artisan-indigo p-6 text-white shadow-xl">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-3">
          <Badge variant="terracotta" className="bg-white/20 text-white border-white/30 backdrop-blur-xs text-[10px]">
            <Sparkles className="w-3 h-3 text-amber-300 mr-1" /> SIH 26090
          </Badge>
          <span className="text-[11px] text-amber-100 font-medium">Bilingual Mobile Prototype</span>
        </div>

        <h2 className="text-2xl font-black tracking-tight leading-tight mb-2">
          KARIGAR <span className="text-amber-300">X</span>
        </h2>
        <p className="text-xs text-amber-100/90 leading-relaxed mb-5">
          {language === "hi"
            ? "हाशियाकृत कारीगरों के लिए AI-संचालित स्मार्ट कैटलॉगिंग, सही दाम मूल्यांकन और सीधा बाज़ार जुड़ाव।"
            : "AI-powered virtual business manager for marginalized artisans. Voice cataloging, XGBoost fair pricing & direct B2B market linkage."}
        </p>

        <Link href="/dashboard" className="block">
          <Button
            variant="white"
            size="lg"
            className="w-full text-artisan-terracotta bg-white hover:bg-amber-50 font-extrabold text-sm shadow-xl py-3.5"
            icon={<ArrowRight className="w-4 h-4 text-artisan-terracotta" />}
          >
            {language === "hi" ? "कारीगर ऐप शुरू करें (डैशबोर्ड)" : "Launch Artisan Experience"}
          </Button>
        </Link>

        <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-amber-100/80">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" /> 100% Demo Mode
          </span>
          <span>No Paid APIs Required</span>
        </div>
      </section>

      {/* Low Literacy High Contrast Action Launcher */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          {language === "hi" ? "मुख्य सुविधाएँ" : "Core Mobile Features"}
        </h3>

        <Link href="/create" className="block">
          <LargeActionButton
            title={language === "hi" ? "नया उत्पाद जोड़ें" : "Create New Product"}
            subtitle={language === "hi" ? "फोटो खींचें और बोलकर 2 मिनट में बनाएं" : "Camera + Voice cataloging in 2 mins"}
            icon={<Mic className="w-6 h-6" />}
            variant="terracotta"
            badge="Step 1"
          />
        </Link>


      </section>

      {/* Key Innovation Pillars */}
      <section className="grid grid-cols-2 gap-3">
        <div className="glass-panel p-3.5 rounded-2xl border border-amber-900/10 space-y-1">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-artisan-terracotta flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-800">Voice Cataloguer</h4>
          <p className="text-[11px] text-slate-500 leading-tight">
            Hindi/English natural voice speech-to-text cataloging.
          </p>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-amber-900/10 space-y-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-800">B2B Linkage</h4>
          <p className="text-[11px] text-slate-500 leading-tight">
            Direct export portal & GeM emporium connection.
          </p>
        </div>
      </section>

      {/* Artisan Identity Badge */}
      <section className="bg-white/90 p-4 rounded-2xl border border-amber-900/10 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-artisan-indigo text-white flex items-center justify-center font-bold text-sm shrink-0">
          <Award className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800">
            {language === "hi" ? "डिजिटल कारीगर पहचान" : "Digital Craft Passport"}
          </h4>
          <p className="text-[11px] text-slate-500">
            {language === "hi"
              ? "पहचान कारीगर कार्ड और प्रमाण पत्र के साथ सत्यापित प्रोफाइल"
              : "Verified artisan profile with Pahchan Card integration"}
          </p>
        </div>
      </section>
    </div>
  );
}

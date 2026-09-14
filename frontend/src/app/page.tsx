"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Camera, Mic, IndianRupee, Store, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDemo } from "@/context/DemoContext";

export default function LandingPage() {
  const { language } = useDemo();

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-artisan-terracotta via-amber-700 to-artisan-indigo p-6 text-white shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/80 shadow-md bg-white shrink-0">
            <Image src="/logo.png" alt="KariGarX Logo" fill className="object-cover" priority />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight leading-none">
              KariGar<span className="text-amber-300">X</span>
            </h2>
            <span className="text-[10px] text-amber-200 font-medium tracking-wider uppercase">Artisan AI Assistant</span>
          </div>
        </div>

        <p className="text-sm text-amber-100/90 leading-relaxed mb-6">
          {language === "hi"
            ? "अपनी हस्तकला की फोटो लें, बोलकर विवरण दें, सही दाम जानें और सीधे बाज़ार से जुड़ें।"
            : "Photograph your craft, describe it by voice, get fair pricing, and connect directly with buyers."}
        </p>

        <Link href="/dashboard" className="block">
          <Button
            variant="white"
            size="lg"
            className="w-full text-artisan-terracotta bg-white hover:bg-amber-50 font-bold text-sm shadow-xl py-3.5"
            icon={<ArrowRight className="w-4 h-4 text-artisan-terracotta" />}
          >
            {language === "hi" ? "शुरू करें" : "Get Started"}
          </Button>
        </Link>

        <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-center gap-2 text-[11px] text-amber-200/90">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
          <span className="font-medium">
            {language === "hi" ? "पहचान कार्ड से सत्यापित कारीगर प्रोफाइल" : "Verified Artisan Profiles via Pahchan Card"}
          </span>
        </div>
      </section>

      {/* Features — 3 clean cards */}
      <section className="grid grid-cols-3 gap-2.5">
        {[
          {
            icon: <Camera className="w-5 h-5" />,
            bg: "bg-orange-100 text-orange-700",
            label: language === "hi" ? "फोटो कैटलॉग" : "Photo Catalog",
          },
          {
            icon: <Mic className="w-5 h-5" />,
            bg: "bg-indigo-100 text-indigo-700",
            label: language === "hi" ? "आवाज़ से विवरण" : "Voice Story",
          },
          {
            icon: <IndianRupee className="w-5 h-5" />,
            bg: "bg-emerald-100 text-emerald-700",
            label: language === "hi" ? "सही दाम" : "Fair Price",
          },
        ].map((f) => (
          <div key={f.label} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/80 border border-slate-100 shadow-xs">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.bg}`}>
              {f.icon}
            </div>
            <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">{f.label}</span>
          </div>
        ))}
      </section>

      {/* Market Linkage */}
      <section className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/80 border border-slate-100 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
          <Store className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-800">
            {language === "hi" ? "सीधा बाज़ार जुड़ाव" : "Direct Market Access"}
          </h4>
          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
            {language === "hi"
              ? "B2B एक्सपोर्ट और GeM पोर्टल से जुड़ें"
              : "Connect with B2B export buyers & GeM portal"}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </section>
    </div>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

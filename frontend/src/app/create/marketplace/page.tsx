"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, QrCode, Share2, Globe, Building2, Store, ArrowRight, ArrowLeft } from "lucide-react";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";

export default function MarketplaceReadyPage() {
  const router = useRouter();
  const { language, productDraft, saveCurrentProductToInventory } = useDemo();
  const [isPublished, setIsPublished] = useState<boolean>(false);

  const title =
    language === "hi"
      ? productDraft.titleHi || "हस्तनिर्मित टेराकोटा पारंपरिक घोड़ा"
      : productDraft.titleEn || "Handmade Terracotta Heritage Horse";

  const handlePublishNow = () => {
    saveCurrentProductToInventory();
    setIsPublished(true);
    setTimeout(() => {
      router.push("/products");
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <StepIndicator currentStep={7} />

      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-artisan-indigo">
          {getTranslation(language, "marketTitle")}
        </h2>
        <p className="text-xs text-slate-500">
          {getTranslation(language, "marketSubtitle")}
        </p>
      </div>

      {/* Celebration Header Banner */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white rounded-3xl p-5 shadow-xl text-center space-y-3 relative overflow-hidden">
        <div className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-8 h-8 text-amber-300 stroke-[2.5]" />
        </div>
        <div>
          <Badge variant="terracotta" className="bg-amber-300 text-amber-950 font-bold mb-1">
            {getTranslation(language, "marketSuccessMsg")}
          </Badge>
          <h3 className="text-lg font-black">{title}</h3>
          <p className="text-xs text-emerald-100/90 mt-1">
            {language === "hi"
              ? "आपका उत्पाद अब B2B निर्यात पोर्टल पर दृश्यमान है।"
              : "Listed for B2B wholesale, global buyers & government emporiums."}
          </p>
        </div>
      </div>

      {/* Generated Craft Tag & QR Code Simulator */}
      <div className="glass-panel rounded-2xl p-4 border border-amber-900/10 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            {language === "hi" ? "डिजिटल क्राफ्ट टैग" : "Digital Craft Tag"}
          </span>
          <h4 className="text-xs font-bold text-slate-800">QR-KGX-808-NEW</h4>
          <p className="text-[10px] text-slate-500">
            {language === "hi" ? "स्कैन करके प्रामाणिकता और सही मूल्य देखें" : "Scan to verify artisan authenticity & fair price"}
          </p>
        </div>

        <div className="w-16 h-16 bg-white p-2 rounded-xl border border-slate-300 flex items-center justify-center text-slate-900 shadow-xs shrink-0">
          <QrCode className="w-12 h-12" />
        </div>
      </div>

      {/* Multi-Channel Distribution Status */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          {language === "hi" ? "सक्रिय वितरण चैनल" : "Active Distribution Channels"}
        </h4>

        <div className="grid gap-2">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-100 text-artisan-terracotta">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-800">
                  {getTranslation(language, "marketChannelB2B")}
                </h5>
                <p className="text-[10px] text-slate-500">Global Wholesale Export Buyers</p>
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-800">
                  {getTranslation(language, "marketChannelGovt")}
                </h5>
                <p className="text-[10px] text-slate-500">Government Procurement Portal</p>
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-800">
                  {getTranslation(language, "marketChannelDirect")}
                </h5>
                <p className="text-[10px] text-slate-500">Artisan Web Storefront</p>
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => router.push("/create/pricing")}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          {getTranslation(language, "btnBack")}
        </Button>

        <Button
          variant="primary"
          size="lg"
          className="flex-1 font-bold shadow-lg"
          onClick={handlePublishNow}
          disabled={isPublished}
          icon={<CheckCircle2 className="w-4 h-4" />}
        >
          {isPublished
            ? language === "hi" ? "सहेजा जा रहा है..." : "Saving..."
            : getTranslation(language, "btnPublish")}
        </Button>
      </div>
    </div>
  );
}

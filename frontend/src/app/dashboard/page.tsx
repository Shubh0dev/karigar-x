"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle, Mic, Package, TrendingUp, Sparkles, ShieldCheck, ChevronRight } from "lucide-react";
import { LargeActionButton } from "@/components/ui/LargeActionButton";
import { ProductCard } from "@/components/ui/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";

export default function DashboardPage() {
  const { language, artisan, products, resetProductDraft } = useDemo();

  const handleNewCraftClick = () => {
    resetProductDraft();
  };

  return (
    <div className="space-y-4">
      {/* Artisan Profile Header Banner */}
      <section className="bg-gradient-to-br from-artisan-indigo via-slate-800 to-amber-950 text-white rounded-3xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 shrink-0 shadow-md">
            <Image
              src={artisan.avatar}
              alt={artisan.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h2 className="text-base font-extrabold truncate">
                {getTranslation(language, "dashWelcome")}
              </h2>
            </div>
            <p className="text-xs text-amber-200/90 font-medium truncate">
              {language === "hi" ? artisan.craftSpecialtyHi : artisan.craftSpecialtyEn}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="terracotta" className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-[9px] py-0">
                <ShieldCheck className="w-3 h-3 mr-0.5" />
                {language === "hi" ? "सत्यापित कारीगर" : "Pahchan Card Verified"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Financial Overview Tiles */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/15">
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-[10px] text-amber-200/80 uppercase font-bold block">
              {getTranslation(language, "dashEarnings")}
            </span>
            <span className="text-lg font-black text-amber-300">
              ₹{artisan.totalEarningsInr.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-[10px] text-amber-200/80 uppercase font-bold block">
              {language === "hi" ? "सक्रिय उत्पाद" : "Active Crafts"}
            </span>
            <span className="text-lg font-black text-white">
              {products.length} Products
            </span>
          </div>
        </div>
      </section>

      {/* Primary Low-Literacy Actions */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          {language === "hi" ? "मुख्य कार्य (एक टैप से शुरू करें)" : "Quick Actions (Low-Literacy Friendly)"}
        </h3>

        <Link href="/create" onClick={handleNewCraftClick} className="block">
          <LargeActionButton
            title={getTranslation(language, "dashAddNewCraft")}
            subtitle={getTranslation(language, "dashAddNewCraftSub")}
            icon={<PlusCircle className="w-6 h-6" />}
            variant="terracotta"
            badge="Start Flow"
          />
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/create/voice" className="block">
            <div className="glass-panel rounded-2xl p-3.5 border border-amber-900/10 hover:shadow-md transition-all active:scale-95">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-artisan-terracotta flex items-center justify-center mb-2">
                <Mic className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs text-slate-800">
                {getTranslation(language, "dashVoiceAssist")}
              </h4>
              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                {getTranslation(language, "dashVoiceAssistSub")}
              </p>
            </div>
          </Link>

          <Link href="/products" className="block">
            <div className="glass-panel rounded-2xl p-3.5 border border-amber-900/10 hover:shadow-md transition-all active:scale-95">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-artisan-indigo flex items-center justify-center mb-2">
                <Package className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs text-slate-800">
                {getTranslation(language, "dashInventory")}
              </h4>
              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                {getTranslation(language, "dashInventorySub")}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Products Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {getTranslation(language, "dashRecentCrafts")}
          </h3>
          <Link href="/products" className="text-xs font-bold text-artisan-terracotta flex items-center gap-0.5">
            {getTranslation(language, "btnViewDetails")}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {products.slice(0, 2).map((prd) => (
            <ProductCard key={prd.id} product={prd} />
          ))}
        </div>
      </section>
    </div>
  );
}

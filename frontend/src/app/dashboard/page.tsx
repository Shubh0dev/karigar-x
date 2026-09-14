"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  PlusCircle,
  Mic,
  Package,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  IndianRupee,
} from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";

export default function DashboardPage() {
  const { language, artisan, products, resetProductDraft } = useDemo();

  const handleNewCraftClick = () => {
    resetProductDraft();
  };

  return (
    <div className="space-y-5 pb-4">
      {/* Profile Card */}
      <section className="bg-gradient-to-br from-slate-900 via-artisan-indigo to-amber-950 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3.5">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400/80 shrink-0 shadow-md">
            <Image
              src={artisan.avatar}
              alt={artisan.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold truncate">{artisan.name}</h2>
            <p className="text-xs text-amber-200/90 font-medium truncate">
              {language === "hi" ? artisan.craftSpecialtyHi : artisan.craftSpecialtyEn}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <ShieldCheck className="w-3 h-3 text-amber-300" />
              <span className="text-[10px] text-amber-200/80 font-medium">
                {language === "hi" ? "सत्यापित कारीगर" : "Verified Artisan"}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-white/15">
          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="text-[10px] text-amber-200/70 font-semibold block">
              {getTranslation(language, "dashEarnings")}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-amber-300">
                ₹{artisan.totalEarningsInr.toLocaleString("en-IN")}
              </span>
              <span className="flex items-center text-[9px] font-semibold text-emerald-400">
                <TrendingUp className="w-2.5 h-2.5 mr-0.5" />↑
              </span>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="text-[10px] text-amber-200/70 font-semibold block">
              {language === "hi" ? "कुल उत्पाद" : "Total Crafts"}
            </span>
            <span className="text-lg font-bold text-white mt-0.5 block">
              {products.length}
            </span>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="space-y-2.5">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
          {language === "hi" ? "त्वरित कार्य" : "Quick Actions"}
        </h3>

        {/* Add New Craft — Primary CTA */}
        <Link href="/create" onClick={handleNewCraftClick} className="block group">
          <div className="rounded-2xl p-4 bg-gradient-to-r from-artisan-terracotta to-amber-600 text-white shadow-md group-active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold">{getTranslation(language, "dashAddNewCraft")}</h4>
                <p className="text-[11px] text-white/80 mt-0.5">
                  {getTranslation(language, "dashAddNewCraftSub")}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60 shrink-0" />
            </div>
          </div>
        </Link>

        {/* 3 action buttons in a row */}
        <div className="grid grid-cols-3 gap-2.5">
          <Link href="/create/voice" className="block group">
            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-slate-100 shadow-xs group-active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">
                {language === "hi" ? "आवाज़ सहायक" : "Voice"}
              </span>
            </div>
          </Link>

          <Link href="/products" className="block group">
            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-slate-100 shadow-xs group-active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">
                {language === "hi" ? "मेरे उत्पाद" : "My Crafts"}
              </span>
            </div>
          </Link>

          <Link href="/create/pricing" className="block group">
            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-slate-100 shadow-xs group-active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <IndianRupee className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">
                {language === "hi" ? "सही दाम" : "Pricing"}
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Products */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {getTranslation(language, "dashRecentCrafts")}
          </h3>
          <Link href="/products" className="text-xs font-semibold text-artisan-terracotta flex items-center gap-0.5">
            {language === "hi" ? "सभी देखें" : "View All"}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {products.slice(0, 6).map((prd) => (
            <ProductCard key={prd.id} product={prd} />
          ))}
        </div>
      </section>
    </div>
  );
}

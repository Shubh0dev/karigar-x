"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, PlusCircle, Search, Filter, X, QrCode, ShieldCheck, Tag, ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";
import { ProductItem } from "@/lib/types";

export default function MyProductsPage() {
  const { language, products } = useDemo();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<"all" | "published" | "draft" | "sold">("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchesFilter = activeFilter === "all" || p.status === activeFilter;
    const title = language === "hi" ? p.titleHi : p.titleEn;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-extrabold text-artisan-indigo">
              {getTranslation(language, "invTitle")}
            </h2>
            <p className="text-xs text-slate-500">
              {getTranslation(language, "invSubtitle")}
            </p>
          </div>
        </div>

        <Link href="/create">
          <Button variant="primary" size="sm" icon={<PlusCircle className="w-3.5 h-3.5" />}>
            {getTranslation(language, "navNewCraft")}
          </Button>
        </Link>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={language === "hi" ? "उत्पाद खोजें..." : "Search handicraft catalog..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-amber-900/10 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-artisan-terracotta/30 shadow-xs"
        />
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: "all", label: getTranslation(language, "invStatusAll") },
          { key: "published", label: getTranslation(language, "invStatusPublished") },
          { key: "draft", label: getTranslation(language, "invStatusDraft") },
          { key: "sold", label: getTranslation(language, "invStatusSold") },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeFilter === tab.key
                ? "bg-artisan-terracotta text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Inventory Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((prd) => (
            <ProductCard
              key={prd.id}
              product={prd}
              onClick={() => setSelectedProduct(prd)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-bold text-slate-700">No products found</h4>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            Try adjusting your search or filter pills.
          </p>
        </div>
      )}

      {/* Product Detail Modal Drawer */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="terracotta" className="text-[10px]">
                  {selectedProduct.qrCodeId}
                </Badge>
                <h3 className="font-bold text-sm text-slate-800 line-clamp-1">
                  {language === "hi" ? selectedProduct.titleHi : selectedProduct.titleEn}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-slate-100">
              <Image
                src={selectedProduct.image}
                alt={selectedProduct.titleEn}
                fill
                className="object-cover"
              />
            </div>

            {/* Price Cards Summary */}
            <div className="grid grid-cols-2 gap-2 bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold block">
                  {language === "hi" ? "कारीगर का सही दाम" : "Fair Artisan Price"}
                </span>
                <span className="font-extrabold text-artisan-terracotta text-sm">
                  ₹{selectedProduct.pricing.minimumFairPrice.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold block">
                  {language === "hi" ? "B2B बाज़ार दाम" : "B2B Market Price"}
                </span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  ₹{selectedProduct.pricing.suggestedB2BPrice.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Story */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">
                {language === "hi" ? "हस्तकला कहानी" : "Artisan Craft Story"}
              </span>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {language === "hi" ? selectedProduct.craftStoryHi : selectedProduct.craftStoryEn}
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full font-bold"
              onClick={() => setSelectedProduct(null)}
            >
              Close Details
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import { ProductItem } from "@/lib/types";
import { Badge } from "./Badge";
import { useDemo } from "@/context/DemoContext";

interface ProductCardProps {
  product: ProductItem;
  onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const { language } = useDemo();

  const title = language === "hi" ? product.titleHi : product.titleEn;
  const category = language === "hi" ? product.categoryNameHi : product.categoryNameEn;

  const statusVariants = {
    published: { variant: "success" as const, text: language === "hi" ? "सक्रिय B2B" : "Active B2B" },
    draft: { variant: "warning" as const, text: language === "hi" ? "ड्राफ्ट" : "Draft" },
    ready: { variant: "terracotta" as const, text: language === "hi" ? "तैयार" : "Ready" },
    sold: { variant: "outline" as const, text: language === "hi" ? "बिक चुका" : "Sold Out" },
  };

  return (
    <div
      onClick={onClick}
      className="glass-panel rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-all duration-200 cursor-pointer group active:scale-[0.99] border border-amber-900/10"
    >
      <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
        <Image
          src={product.image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2">
          <Badge variant="default" className="bg-white/90 backdrop-blur-xs text-[10px] shadow-xs">
            {category}
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          <Badge variant={statusVariants[product.status].variant} className="shadow-xs text-[10px]">
            {statusVariants[product.status].text}
          </Badge>
        </div>
      </div>

      <div className="p-3.5 space-y-2">
        <h4 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-artisan-terracotta transition-colors">
          {title}
        </h4>

        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wide block">
              {language === "hi" ? "अनुशंसित मूल्य" : "Suggested Price"}
            </span>
            <span className="text-base font-extrabold text-emerald-700">
              ₹{product.pricing.suggestedB2BPrice.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide block">
              {language === "hi" ? "कारीगर दाम" : "Fair Price"}
            </span>
            <span className="text-xs font-semibold text-artisan-terracotta">
              ₹{product.pricing.minimumFairPrice.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

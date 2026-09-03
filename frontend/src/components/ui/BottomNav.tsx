"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, PlusCircle, Calculator, User } from "lucide-react";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { language } = useDemo();

  const navItems = [
    { label: getTranslation(language, "navHome"), href: "/dashboard", icon: Home },
    { label: getTranslation(language, "navMyProducts"), href: "/products", icon: Package },
    { label: getTranslation(language, "navNewCraft"), href: "/create", icon: PlusCircle, isHighlight: true },
    { label: getTranslation(language, "navPricing"), href: "/create/pricing", icon: Calculator },
    { label: getTranslation(language, "navProfile"), href: "/dashboard", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-amber-900/10 py-1.5 px-3 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === "/create" && pathname.startsWith("/create"));

          if (item.isHighlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-5 group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-artisan-terracotta to-artisan-gold text-white flex items-center justify-center shadow-lg shadow-artisan-terracotta/30 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] mt-0.5 font-bold text-artisan-terracotta">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-artisan-terracotta scale-105 font-bold"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  ArtisanProfile,
  ProductDraft,
  Language,
  ProductItem,
} from "@/lib/types";
import { initialArtisanProfile, initialProducts } from "@/lib/mockData";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface DemoContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  artisan: ArtisanProfile;
  products: ProductItem[];
  productDraft: ProductDraft;
  setProductDraft: React.Dispatch<React.SetStateAction<ProductDraft>>;
  updateProductDraft: (updates: Partial<ProductDraft>) => void;
  resetProductDraft: () => void;
  saveCurrentProductToInventory: () => ProductItem;
  toast: { message: string; type?: "success" | "info" | "warning" } | null;
  showToast: (message: string, type?: "success" | "info" | "warning") => void;
}

const defaultProductDraft: ProductDraft = {};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("en");
  const [artisan] = useState<ArtisanProfile>(initialArtisanProfile);
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  
  // Use localStorage hook for persistence
  const [productDraft, setProductDraft] = useLocalStorage<ProductDraft>(
    "karigar_product_draft",
    defaultProductDraft
  );
  
  const [toast, setToast] = useState<{ message: string; type?: "success" | "info" | "warning" } | null>(null);

  const showToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const updateProductDraft = (updates: Partial<ProductDraft>) => {
    setProductDraft((prev) => ({ ...prev, ...updates, lastUpdated: Date.now() }));
  };

  const resetProductDraft = () => {
    setProductDraft(defaultProductDraft);
  };

  const saveCurrentProductToInventory = (): ProductItem => {
    const newId = `PRD-${Date.now().toString().slice(-3)}`;
    const newProduct: ProductItem = {
      id: newId,
      titleEn: productDraft.titleEn || "New Handcrafted Craft",
      titleHi: productDraft.titleHi || "नया हस्तनिर्मित उत्पाद",
      category: productDraft.categoryId || "terracotta",
      categoryNameEn: productDraft.categoryNameEn || "Terracotta",
      categoryNameHi: productDraft.categoryNameHi || "टेराकोटा",
      craftStoryEn: productDraft.descriptionEn || "",
      craftStoryHi: productDraft.descriptionHi || "",
      materialsEn: productDraft.featuresEn || ["Clay"],
      materialsHi: productDraft.featuresHi || ["मिट्टी"],
      dimensions: "35cm x 15cm",
      weight: "1.2 kg",
      image: productDraft.processedImage || productDraft.originalImage || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80",
      pricing: {
        rawMaterialCost: productDraft.predictedPrice ? productDraft.predictedPrice * 0.2 : 300,
        laborHours: 12,
        laborHourlyRate: 100,
        complexityGrade: 4,
        artisanExperienceYears: 22,
        demandIndex: 1.25,
        minimumFairPrice: productDraft.priceRange?.min || 1500,
        suggestedB2BPrice: productDraft.predictedPrice || 2200,
      },
      status: "published",
      createdAt: new Date().toISOString().split("T")[0],
      qrCodeId: `QR-KGX-${newId}`,
    };

    setProducts((prev) => [newProduct, ...prev]);
    showToast(language === "hi" ? "उत्पाद सफलतापूर्वक बाज़ार में जोड़ा गया!" : "Product published to B2B Marketplace!", "success");
    resetProductDraft();
    return newProduct;
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DemoContext.Provider
      value={{
        language,
        setLanguage,
        artisan,
        products,
        productDraft,
        setProductDraft,
        updateProductDraft,
        resetProductDraft,
        saveCurrentProductToInventory,
        toast,
        showToast,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
};

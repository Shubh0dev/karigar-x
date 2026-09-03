"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  ArtisanProfile,
  CreationFlowState,
  Language,
  ProductItem,
} from "@/lib/types";
import { initialArtisanProfile, initialProducts } from "@/lib/mockData";

interface DemoContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  artisan: ArtisanProfile;
  products: ProductItem[];
  creationFlow: CreationFlowState;
  setCreationFlow: React.Dispatch<React.SetStateAction<CreationFlowState>>;
  updateCreationFlow: (updates: Partial<CreationFlowState>) => void;
  resetCreationFlow: () => void;
  saveCurrentProductToInventory: () => ProductItem;
  toast: { message: string; type?: "success" | "info" | "warning" } | null;
  showToast: (message: string, type?: "success" | "info" | "warning") => void;
}

const defaultCreationFlow: CreationFlowState = {
  categoryId: "terracotta",
  categoryNameEn: "Terracotta & Clay",
  categoryNameHi: "टेराकोटा और मिट्टी",
  capturedImage: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80",
  isImageEnhanced: true,
  voiceTranscriptEn: "Handcrafted using alluvial riverbank clay from Bankura. Molded by hand wheel and baked in a natural firewood kiln for 14 hours.",
  voiceTranscriptHi: "बांकुड़ा की नदी की मिट्टी से हाथ से बनाया गया। 14 घंटे प्राकृतिक लकड़ी के भट्ठे में पकाया गया।",
  generatedTitleEn: "Handmade Terracotta Heritage Horse",
  generatedTitleHi: "हस्तनिर्मित टेराकोटा पारंपरिक घोड़ा",
  generatedStoryEn: "Crafted by master artisan Ramesh Swarnakar using ancestral terracotta firing techniques passed down for generations in Bankura.",
  generatedStoryHi: "बांकुड़ा में पीढ़ियों से चली आ रही पारंपरिक टेराकोटा भट्ठी तकनीक से मास्टर कारीगर रमेश स्वर्णकार द्वारा निर्मित।",
  generatedMaterialsEn: ["Natural Clay", "Firewood Ash", "Earth Pigment"],
  generatedMaterialsHi: ["प्राकृतिक मिट्टी", "लकड़ी की राख", "गेरू रंग"],
  pricing: {
    rawMaterialCost: 300,
    laborHours: 12,
    laborHourlyRate: 100,
    complexityGrade: 4,
    artisanExperienceYears: 22,
    demandIndex: 1.25,
    minimumFairPrice: 1500,
    suggestedB2BPrice: 2200,
  },
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("en");
  const [artisan] = useState<ArtisanProfile>(initialArtisanProfile);
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [creationFlow, setCreationFlow] = useState<CreationFlowState>(defaultCreationFlow);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "info" | "warning" } | null>(null);

  const showToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const updateCreationFlow = (updates: Partial<CreationFlowState>) => {
    setCreationFlow((prev) => ({ ...prev, ...updates }));
  };

  const resetCreationFlow = () => {
    setCreationFlow(defaultCreationFlow);
  };

  const saveCurrentProductToInventory = (): ProductItem => {
    const newId = `PRD-${Date.now().toString().slice(-3)}`;
    const newProduct: ProductItem = {
      id: newId,
      titleEn: creationFlow.generatedTitleEn || "New Handcrafted Craft",
      titleHi: creationFlow.generatedTitleHi || "नया हस्तनिर्मित उत्पाद",
      category: creationFlow.categoryId || "terracotta",
      categoryNameEn: creationFlow.categoryNameEn || "Terracotta",
      categoryNameHi: creationFlow.categoryNameHi || "टेराकोटा",
      craftStoryEn: creationFlow.generatedStoryEn || "",
      craftStoryHi: creationFlow.generatedStoryHi || "",
      materialsEn: creationFlow.generatedMaterialsEn || ["Clay"],
      materialsHi: creationFlow.generatedMaterialsHi || ["मिट्टी"],
      dimensions: "35cm x 15cm",
      weight: "1.2 kg",
      image: creationFlow.capturedImage || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80",
      pricing: creationFlow.pricing,
      status: "published",
      createdAt: new Date().toISOString().split("T")[0],
      qrCodeId: `QR-KGX-${newId}`,
    };

    setProducts((prev) => [newProduct, ...prev]);
    showToast(language === "hi" ? "उत्पाद सफलतापूर्वक बाज़ार में जोड़ा गया!" : "Product published to B2B Marketplace!", "success");
    return newProduct;
  };

  return (
    <DemoContext.Provider
      value={{
        language,
        setLanguage,
        artisan,
        products,
        creationFlow,
        setCreationFlow,
        updateCreationFlow,
        resetCreationFlow,
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

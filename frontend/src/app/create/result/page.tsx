"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Edit3,
  Tag,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Layers,
  Palette,
  Hammer,
  FileText,
  List,
  Hash,
} from "lucide-react";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";

export default function AICatalogueResultPage() {
  const router = useRouter();
  const { language, productDraft, updateProductDraft } = useDemo();

  // Editable fields initialized from catalogue or fallback
  const [title, setTitle] = useState(
    productDraft.titleEn || "Handmade Terracotta Heritage Horse"
  );
  const [description, setDescription] = useState(
    productDraft.descriptionEn || "Crafted by master artisan using ancestral techniques passed down for generations."
  );
  const [features, setFeatures] = useState<string[]>(
    productDraft.featuresEn || [
      "Material: Natural Alluvial Clay",
      "Technique: Hand-molded & Kiln-fired",
      "Style: Traditional Bankura Heritage",
    ]
  );
  const [tags, setTags] = useState<string[]>(
    productDraft.tagsEn || ["terracotta", "handmade", "indian-handicraft", "artisan-made"]
  );
  const [category, setCategory] = useState(
    productDraft.categoryNameEn || "Terracotta & Clay"
  );
  const [material, setMaterial] = useState(
    productDraft.material || "Natural Alluvial Clay"
  );
  const [craftType, setCraftType] = useState(
    productDraft.craftType || "Hand-molded & Kiln-fired"
  );

  const [newFeature, setNewFeature] = useState("");
  const [newTag, setNewTag] = useState("");

  const sampleImage = productDraft.processedImage || productDraft.originalImage || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80";

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures((prev) => [...prev, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setTags((prev) => [...prev, newTag.trim().toLowerCase().replace(/\s+/g, "-")]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (idx: number) => {
    setTags((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleNext = () => {
    // Save all edits back into productDraft
    updateProductDraft({
      titleEn: title,
      descriptionEn: description,
      featuresEn: features,
      tagsEn: tags,
      categoryNameEn: category,
      material,
      craftType,
    });
    router.push("/create/pricing");
  };

  return (
    <div className="space-y-4">
      <StepIndicator currentStep={5} />

      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-artisan-indigo">
          {getTranslation(language, "resultTitle")}
        </h2>
        <p className="text-xs text-slate-500">
          {getTranslation(language, "resultSubtitle")}
        </p>
      </div>

      {/* Product Image Preview */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-amber-900/10 shadow-lg">
        <div className="relative h-48 w-full bg-slate-100">
          <Image src={sampleImage} alt={title} fill className="object-cover" unoptimized />
          <div className="absolute top-3 right-3">
            <Badge variant="terracotta" className="bg-white/90 backdrop-blur-md shadow-md text-[10px]">
              <Sparkles className="w-3 h-3 text-amber-500 mr-1" />
              {productDraft.titleEn ? "AI Generated" : "Demo Mode"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Editable Catalogue Form */}
      <div className="space-y-3">

        {/* Title */}
        <div className="glass-panel p-3 rounded-2xl border border-amber-900/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {language === "hi" ? "उत्पाद का नाम" : "Product Title"}
            </span>
            <Edit3 className="w-3.5 h-3.5 text-artisan-terracotta" />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-sm font-extrabold text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-artisan-terracotta/30"
          />
        </div>

        {/* Description / Craft Story */}
        <div className="glass-panel p-3 rounded-2xl border border-amber-900/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {language === "hi" ? "विवरण / कहानी" : "Description / Craft Story"}
            </span>
            <Edit3 className="w-3.5 h-3.5 text-artisan-terracotta" />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-artisan-terracotta/30 leading-relaxed font-medium resize-none"
          />
        </div>

        {/* Category, Material, Craft Type — Inline Editable Grid */}
        <div className="grid grid-cols-1 gap-2">
          <div className="glass-panel p-3 rounded-2xl border border-amber-900/10 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {language === "hi" ? "श्रेणी" : "Category"}
            </span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-artisan-terracotta/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="glass-panel p-3 rounded-2xl border border-amber-900/10 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Palette className="w-3 h-3" />
                {language === "hi" ? "सामग्री" : "Material"}
              </span>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 bg-white p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-artisan-terracotta/30"
              />
            </div>

            <div className="glass-panel p-3 rounded-2xl border border-amber-900/10 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Hammer className="w-3 h-3" />
                {language === "hi" ? "शिल्प प्रकार" : "Craft Type"}
              </span>
              <input
                type="text"
                value={craftType}
                onChange={(e) => setCraftType(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 bg-white p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-artisan-terracotta/30"
              />
            </div>
          </div>
        </div>

        {/* Features (Editable List) */}
        <div className="glass-panel p-3 rounded-2xl border border-amber-900/10 space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <List className="w-3 h-3" />
            {language === "hi" ? "विशेषताएं" : "Features"}
          </span>
          <div className="space-y-1.5">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white rounded-xl p-2 border border-slate-100 group">
                <span className="flex-1 text-xs text-slate-700 font-medium">{feat}</span>
                <button
                  onClick={() => handleRemoveFeature(idx)}
                  className="p-0.5 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddFeature()}
              placeholder={language === "hi" ? "नई विशेषता जोड़ें..." : "Add a feature..."}
              className="flex-1 text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-artisan-terracotta/30"
            />
            <button
              onClick={handleAddFeature}
              disabled={!newFeature.trim()}
              className="p-2 rounded-xl bg-artisan-terracotta/10 text-artisan-terracotta hover:bg-artisan-terracotta/20 transition-colors disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tags (Editable Chips) */}
        <div className="glass-panel p-3 rounded-2xl border border-amber-900/10 space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {language === "hi" ? "टैग" : "Tags"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="bg-white text-slate-700 text-[10px] py-1 px-2 group">
                <Tag className="w-3 h-3 mr-1 text-artisan-terracotta" />
                {tag}
                <button
                  onClick={() => handleRemoveTag(idx)}
                  className="ml-1 text-slate-300 hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              placeholder={language === "hi" ? "नया टैग जोड़ें..." : "Add a tag..."}
              className="flex-1 text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-artisan-terracotta/30"
            />
            <button
              onClick={handleAddTag}
              disabled={!newTag.trim()}
              className="p-2 rounded-xl bg-artisan-terracotta/10 text-artisan-terracotta hover:bg-artisan-terracotta/20 transition-colors disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex gap-2 pt-2">
        <Button variant="ghost" size="lg" onClick={() => router.push("/create/voice")} icon={<ArrowLeft className="w-4 h-4" />}>
          {getTranslation(language, "btnBack")}
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1 font-bold"
          onClick={handleNext}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {getTranslation(language, "btnNext")} (Smart Pricing)
        </Button>
      </div>
    </div>
  );
}

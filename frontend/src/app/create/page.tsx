"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Flame, Sparkles, Hammer, Trees, Shirt, Palette, CheckCircle2, ArrowRight } from "lucide-react";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Button } from "@/components/ui/Button";
import { craftCategories } from "@/lib/mockData";
import { useDemo } from "@/context/DemoContext";
import { getTranslation } from "@/lib/i18n";

export default function CreateProductCategoryPage() {
  const router = useRouter();
  const { language, creationFlow, updateCreationFlow, showToast } = useDemo();

  const iconMap: Record<string, React.ReactNode> = {
    Flame: <Flame className="w-5 h-5" />,
    Sparkles: <Sparkles className="w-5 h-5" />,
    Hammer: <Hammer className="w-5 h-5" />,
    Trees: <Trees className="w-5 h-5" />,
    Shirt: <Shirt className="w-5 h-5" />,
    Palette: <Palette className="w-5 h-5" />,
  };

  const handleSelectCategory = (catId: string, nameEn: string, nameHi: string) => {
    updateCreationFlow({
      categoryId: catId,
      categoryNameEn: nameEn,
      categoryNameHi: nameHi,
    });
    showToast(language === "hi" ? `${nameHi} श्रेणी चुनी गई` : `Selected ${nameEn}`);
  };

  const handleNext = () => {
    router.push("/create/studio");
  };

  return (
    <div className="space-y-4">
      <StepIndicator currentStep={1} />

      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-artisan-indigo">
          {getTranslation(language, "catTitle")}
        </h2>
        <p className="text-xs text-slate-500">
          {getTranslation(language, "catSubtitle")}
        </p>
      </div>

      {/* Visual Category Selection Grid */}
      <div className="grid grid-cols-2 gap-3">
        {craftCategories.map((cat) => {
          const isSelected = creationFlow.categoryId === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id, cat.nameEn, cat.nameHi)}
              className={`relative glass-panel rounded-2xl p-3 border-2 transition-all cursor-pointer active:scale-95 flex flex-col justify-between ${
                isSelected
                  ? "border-artisan-terracotta bg-orange-50/90 shadow-md ring-2 ring-artisan-terracotta/20"
                  : "border-amber-900/10 hover:border-amber-300"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 text-artisan-terracotta">
                  <CheckCircle2 className="w-5 h-5 fill-artisan-terracotta text-white" />
                </div>
              )}

              <div className="relative h-24 w-full rounded-xl overflow-hidden mb-2 bg-slate-100">
                <Image
                  src={cat.sampleImage}
                  alt={cat.nameEn}
                  fill
                  sizes="(max-width: 768px) 50vw, 200px"
                  className="object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`p-1 rounded-md ${cat.color}`}>
                    {iconMap[cat.iconName] || <Flame className="w-4 h-4" />}
                  </div>
                  <h3 className="font-bold text-xs text-slate-800 line-clamp-1">
                    {language === "hi" ? cat.nameHi : cat.nameEn}
                  </h3>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                  {language === "hi" ? cat.descriptionHi : cat.descriptionEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Action */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full text-sm font-bold shadow-lg"
          onClick={handleNext}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {getTranslation(language, "btnNext")} (Photo Studio)
        </Button>
      </div>
    </div>
  );
}

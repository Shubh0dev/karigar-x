import React from "react";
import Link from "next/link";
import { Camera, Mic, ImagePlus, ArrowLeft, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function CatalogPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/" className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Smart Cataloging</h2>
          <p className="text-xs text-slate-500">Voice & Image Product Digitization</p>
        </div>
      </div>

      <Card className="text-center py-8 px-4 space-y-3">
        <div className="w-12 h-12 rounded-full bg-orange-100 text-artisan-terracotta flex items-center justify-center mx-auto">
          <Camera className="w-6 h-6" />
        </div>
        <div className="flex justify-center">
          <Badge variant="warning">
            <Clock className="w-3 h-3 mr-1" /> Milestone 2 Feature
          </Badge>
        </div>
        <h3 className="text-base font-bold text-slate-800">Cataloging Engine Ready</h3>
        <p className="text-xs text-slate-600 max-w-xs mx-auto">
          In Milestone 2, artisans will be able to capture product photos, dictate craft stories in regional languages, and generate auto-tagged digital catalogs.
        </p>
        <div className="pt-3 flex justify-center gap-2">
          <Button variant="outline" size="sm" icon={<Mic className="w-3.5 h-3.5" />} disabled>
            Voice Input
          </Button>
          <Button variant="primary" size="sm" icon={<ImagePlus className="w-3.5 h-3.5" />} disabled>
            Upload Photo
          </Button>
        </div>
      </Card>
    </div>
  );
}

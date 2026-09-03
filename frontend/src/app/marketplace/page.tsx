import React from "react";
import Link from "next/link";
import { Store, Globe, ArrowLeft, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function MarketplacePage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/" className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-slate-800">B2B Market Linkage</h2>
          <p className="text-xs text-slate-500">Direct Buyer Connection</p>
        </div>
      </div>

      <Card className="text-center py-8 px-4 space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-artisan-emerald flex items-center justify-center mx-auto">
          <Store className="w-6 h-6" />
        </div>
        <div className="flex justify-center">
          <Badge variant="warning">
            <Clock className="w-3 h-3 mr-1" /> Milestone 4 Feature
          </Badge>
        </div>
        <h3 className="text-base font-bold text-slate-800">Marketplace Gateway</h3>
        <p className="text-xs text-slate-600 max-w-xs mx-auto">
          In Milestone 4, artisans can connect directly with registered B2B buyers, exporters, and government handicraft emporiums without intermediaries.
        </p>
        <div className="pt-3 flex justify-center">
          <Button variant="primary" size="sm" icon={<Globe className="w-3.5 h-3.5" />} disabled>
            Explore B2B Buyer Leads
          </Button>
        </div>
      </Card>
    </div>
  );
}

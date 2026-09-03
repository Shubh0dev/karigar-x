import React from "react";
import Link from "next/link";
import { User, Award, ArrowLeft, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/" className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Artisan Profile</h2>
          <p className="text-xs text-slate-500">Digital Craft Passport</p>
        </div>
      </div>

      <Card className="text-center py-8 px-4 space-y-3">
        <div className="w-12 h-12 rounded-full bg-indigo-100 text-artisan-indigo flex items-center justify-center mx-auto">
          <User className="w-6 h-6" />
        </div>
        <div className="flex justify-center">
          <Badge variant="warning">
            <Clock className="w-3 h-3 mr-1" /> Milestone 4 Feature
          </Badge>
        </div>
        <h3 className="text-base font-bold text-slate-800">Digital Identity Passport</h3>
        <p className="text-xs text-slate-600 max-w-xs mx-auto">
          In Milestone 4, artisans will have verified craft passports showcasing heritage certifications, craft cluster region, and earnings analytics.
        </p>
        <div className="pt-3 flex justify-center">
          <Button variant="secondary" size="sm" icon={<Award className="w-3.5 h-3.5" />} disabled>
            View Verified Badges
          </Button>
        </div>
      </Card>
    </div>
  );
}

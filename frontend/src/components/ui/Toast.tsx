"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useDemo } from "@/context/DemoContext";

export const Toast: React.FC = () => {
  const { toast } = useDemo();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
  };

  const colors = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    info: "bg-sky-50 border-sky-200 text-sky-900",
  };

  const type = toast.type || "success";

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg ${colors[type]}`}>
        {icons[type]}
        <p className="text-xs font-semibold leading-tight">{toast.message}</p>
      </div>
    </div>
  );
};

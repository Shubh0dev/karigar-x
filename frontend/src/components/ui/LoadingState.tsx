import React from "react";

export const LoadingState: React.FC<{ message?: string }> = ({
  message = "Loading...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3 text-center">
      <div className="w-10 h-10 border-4 border-artisan-terracotta/30 border-t-artisan-terracotta rounded-full animate-spin" />
      <p className="text-xs font-semibold text-slate-600">{message}</p>
    </div>
  );
};

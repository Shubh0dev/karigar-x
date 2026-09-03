import React from "react";

interface LargeActionButtonProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: "terracotta" | "indigo" | "gold" | "emerald";
  className?: string;
  badge?: string;
}

export const LargeActionButton: React.FC<LargeActionButtonProps> = ({
  title,
  subtitle,
  icon,
  onClick,
  variant = "terracotta",
  className = "",
  badge,
}) => {
  const variantStyles = {
    terracotta: "bg-gradient-to-r from-artisan-terracotta to-amber-700 text-white shadow-artisan-terracotta/25 hover:from-artisan-terracotta-dark hover:to-amber-800",
    indigo: "bg-gradient-to-r from-artisan-indigo to-slate-800 text-white shadow-slate-900/20 hover:from-slate-800 hover:to-slate-900",
    gold: "bg-gradient-to-r from-artisan-gold to-amber-600 text-white shadow-amber-600/25 hover:from-amber-600 hover:to-amber-700",
    emerald: "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-emerald-600/25 hover:from-emerald-700 hover:to-teal-800",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full min-h-[72px] p-4 rounded-2xl flex items-center justify-between text-left shadow-lg transition-all duration-200 active:scale-[0.98] ${variantStyles[variant]} ${className}`}
    >
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold tracking-tight leading-snug">{title}</h3>
            {badge && (
              <span className="px-2 py-0.5 text-[9px] font-bold bg-white/25 rounded-full uppercase tracking-wider text-white">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-white/85 line-clamp-1 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 text-white">
        ➔
      </div>
    </button>
  );
};

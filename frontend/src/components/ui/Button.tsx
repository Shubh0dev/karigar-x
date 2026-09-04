import React from "react";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "white";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  icon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm shadow-sm",
    lg: "px-5 py-3 text-base shadow-md",
  };

  const variantStyles = {
    primary: "bg-artisan-terracotta text-white hover:bg-artisan-terracotta-dark shadow-artisan-terracotta/20",
    secondary: "bg-artisan-indigo text-white hover:bg-slate-800",
    outline: "border border-artisan-terracotta/30 text-artisan-terracotta hover:bg-artisan-terracotta/5",
    ghost: "text-slate-700 hover:bg-slate-100",
    white: "bg-white text-artisan-terracotta hover:bg-amber-50 shadow-lg border-0 font-bold",
  };

  return (
    <button
      className={twMerge(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

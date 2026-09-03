import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-panel rounded-2xl p-5 shadow-card transition-all duration-200 ${
        hoverable ? "hover:-translate-y-0.5 hover:shadow-lg cursor-pointer active:scale-[0.99]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};

import React from "react";
import { cn } from "@/lib/utils";
import { Car, Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "car" | "primary";
  className?: string;
}

export function Spinner({ size = "md", variant = "default", className }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  const baseClasses = cn(
    "animate-spin",
    sizeClasses[size],
    className
  );

  if (variant === "car") {
    return (
      <div className={cn("relative", sizeClasses[size])}>
        <Car className={cn(baseClasses, "text-secondary")} />
        <div className="absolute inset-0 border-2 border-transparent border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (variant === "primary") {
    return (
      <div className={cn(
        "border-2 border-gray-200 border-t-primary rounded-full",
        baseClasses
      )} />
    );
  }

  return <Loader2 className={cn(baseClasses, "text-gray-600")} />;
}

// Specialized spinners
export function CarSpinner({ size }: { size?: "sm" | "md" | "lg" }) {
  return <Spinner variant="car" size={size} />;
}

export function ButtonSpinner() {
  return <Spinner size="sm" className="mr-2" />;
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner variant="primary" size="lg" />
    </div>
  );
}
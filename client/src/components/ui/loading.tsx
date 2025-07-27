import React from "react";
import { cn } from "@/lib/utils";
import { Car, Loader2 } from "lucide-react";

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "car" | "pulse" | "dots" | "spinner";
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

export function Loading({ 
  size = "md", 
  variant = "car", 
  className,
  text,
  fullScreen = false
}: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg", 
    xl: "text-xl"
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center gap-3",
    fullScreen && "fixed inset-0 bg-white/80 backdrop-blur-sm z-50",
    className
  );

  const renderLoadingIcon = () => {
    const iconClasses = cn(sizeClasses[size], "text-secondary");

    switch (variant) {
      case "car":
        return (
          <div className="relative">
            <Car className={cn(iconClasses, "animate-bounce")} />
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-secondary rounded-full animate-pulse" />
                <div className="w-1 h-1 bg-secondary rounded-full animate-pulse delay-100" />  
                <div className="w-1 h-1 bg-secondary rounded-full animate-pulse delay-200" />
              </div>
            </div>
          </div>
        );

      case "pulse":
        return (
          <div className={cn("rounded-full bg-secondary animate-pulse", sizeClasses[size])} />
        );

      case "dots":
        return (
          <div className="flex space-x-2">
            <div className={cn("bg-secondary rounded-full animate-bounce", 
              size === "sm" ? "w-2 h-2" : size === "lg" ? "w-4 h-4" : size === "xl" ? "w-5 h-5" : "w-3 h-3"
            )} />
            <div className={cn("bg-secondary rounded-full animate-bounce delay-100", 
              size === "sm" ? "w-2 h-2" : size === "lg" ? "w-4 h-4" : size === "xl" ? "w-5 h-5" : "w-3 h-3"
            )} />
            <div className={cn("bg-secondary rounded-full animate-bounce delay-200", 
              size === "sm" ? "w-2 h-2" : size === "lg" ? "w-4 h-4" : size === "xl" ? "w-5 h-5" : "w-3 h-3"
            )} />
          </div>
        );

      case "spinner":
        return (
          <div className={cn(
            "border-4 border-gray-200 border-t-secondary rounded-full animate-spin",
            sizeClasses[size]
          )} />
        );

      default:
        return <Loader2 className={cn(iconClasses, "animate-spin")} />;
    }
  };

  return (
    <div className={containerClasses}>
      {renderLoadingIcon()}
      {text && (
        <p className={cn("text-gray-600 font-medium animate-pulse", textSizes[size])}>
          {text}
        </p>
      )}
    </div>
  );
}

// Specialized loading components - changed to car pulse as default
export function CarLoading({ className, text = "Carregando veículos..." }: { className?: string; text?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        <Car className="w-12 h-12 text-secondary animate-bounce" />
        <div className="absolute inset-0 w-12 h-12 bg-secondary/20 rounded-full animate-pulse" />
      </div>
      {text && <p className="text-lg text-gray-600 font-medium animate-pulse">{text}</p>}
    </div>
  );
}

export function PageLoading({ text = "Carregando..." }: { text?: string }) {
  return <Loading variant="default" size="xl" text={text} fullScreen />;
}

export function ButtonLoading({ size = "sm" }: { size?: "sm" | "md" }) {
  return <Loading variant="spinner" size={size} />;
}

export function InlineLoading({ text }: { text?: string }) {
  return <Loading variant="dots" size="sm" text={text} className="py-2" />;
}

// Loading skeleton components
export function VehicleCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-gray-100 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
      
      {/* Chart area */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    </div>
  );
}
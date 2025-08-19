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

// Brand-consistent animated skeleton components
export function VehicleCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group skeleton-hover">
      {/* Image skeleton with shimmer effect */}
      <div className="relative h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
        
        {/* Badge placeholder */}
        <div className="absolute top-3 left-3">
          <div className="w-16 h-6 bg-gradient-to-r from-red-200 to-red-300 rounded-full animate-pulse-slow" 
               style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* Heart icon placeholder */}
        <div className="absolute top-3 right-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse" 
               style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-skeleton-wave"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 animate-skeleton-wave" 
               style={{ animationDelay: '0.1s' }}></div>
        </div>
        
        {/* Features pills */}
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" 
               style={{ animationDelay: '0.3s' }}></div>
          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" 
               style={{ animationDelay: '0.4s' }}></div>
          <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse" 
               style={{ animationDelay: '0.5s' }}></div>
        </div>
        
        {/* Location and rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" 
                 style={{ animationDelay: '0.2s' }}></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-200 rounded animate-pulse" 
                 style={{ animationDelay: '0.3s' }}></div>
            <div className="h-3 w-8 bg-gray-200 rounded animate-pulse" 
                 style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
        
        {/* Price and button */}
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-1">
            <div className="h-6 w-24 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 rounded animate-brand-pulse"></div>
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" 
                 style={{ animationDelay: '0.5s' }}></div>
          </div>
          <div className="h-9 w-24 bg-gradient-to-r from-red-200 via-red-100 to-red-200 rounded-lg animate-brand-pulse" 
               style={{ animationDelay: '0.3s' }}></div>
        </div>
      </div>
      
      {/* Bottom accent line with brand colors */}
      <div className="h-1 bg-gradient-to-r from-primary via-red-500 to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
    </div>
  );
}

export function SearchModalSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      {/* Search bar skeleton */}
      <div className="relative">
        <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer"></div>
        <div className="absolute right-3 top-3 w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
      </div>
      
      {/* Tabs skeleton */}
      <div className="flex gap-4 mb-4">
        <div className="h-8 w-20 bg-red-200 rounded-lg animate-pulse"></div>
        <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" style={{ animationDelay: '0.1s' }}></div>
      </div>
      
      {/* Recent searches */}
      <div className="space-y-3">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse skeleton-hover" 
               style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="w-4 h-4 bg-gray-200 rounded animate-loading-dots"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 animate-skeleton-wave"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" 
                   style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="bg-white border-b border-gray-200 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo skeleton with brand colors */}
          <div className="h-8 w-24 bg-gradient-to-r from-primary/30 via-red/30 to-primary/30 rounded animate-brand-pulse"></div>
          
          {/* Search skeleton */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-shimmer"></div>
          </div>
          
          {/* Actions skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-9 w-24 bg-gradient-to-r from-red-200 to-red-300 rounded-lg animate-brand-pulse" 
                 style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative bg-gradient-to-r from-gray-200 to-gray-300 h-96">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="h-12 w-96 bg-white/30 rounded-lg mx-auto animate-pulse-slow"></div>
          <div className="h-6 w-64 bg-white/20 rounded mx-auto animate-pulse-slow" 
               style={{ animationDelay: '0.3s' }}></div>
          <div className="h-12 w-80 bg-gradient-to-r from-white/40 to-white/20 rounded-lg mx-auto animate-gradient-shift"></div>
        </div>
      </div>
    </div>
  );
}

export function LoadingDots({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const dotSizes = {
    sm: "w-1 h-1",
    md: "w-2 h-2", 
    lg: "w-3 h-3"
  };
  
  const gapSizes = {
    sm: "gap-1",
    md: "gap-2",
    lg: "gap-3"
  };

  return (
    <div className={cn("flex items-center", gapSizes[size], className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "bg-current rounded-full animate-loading-dots",
            dotSizes[size]
          )}
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid gap-4 p-4 bg-gray-50 rounded-lg" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 rounded animate-skeleton-wave" 
               style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4 p-4 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors skeleton-hover" 
             style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-skeleton-wave" 
                 style={{ animationDelay: `${rowIndex * 0.1 + colIndex * 0.05}s` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100 skeleton-hover"
             style={{ animationDelay: `${i * 0.1}s` }}>
          {/* Avatar */}
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          
          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/3 animate-skeleton-wave"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
          
          {/* Action */}
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200 animate-pulse">
      {/* Title */}
      <div className="h-6 w-1/3 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 rounded animate-brand-pulse"></div>
      
      {/* Form fields */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer"></div>
        </div>
      ))}
      
      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-10 w-20 bg-gradient-to-r from-red-200 to-red-300 rounded-lg animate-brand-pulse" 
             style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 skeleton-hover">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-3/4 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 rounded animate-brand-pulse"></div>
          <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-100 skeleton-hover">
      <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse mt-2"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-skeleton-wave"></div>
        <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="h-3 w-1/4 bg-gray-200 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
      <div className="text-xs text-gray-400">
        <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
      </div>
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
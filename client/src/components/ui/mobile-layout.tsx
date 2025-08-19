import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  withPadding?: boolean;
  withSafeArea?: boolean;
}

export function MobileLayout({ 
  children, 
  className,
  withPadding = true,
  withSafeArea = false
}: MobileLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen bg-gray-50",
      withPadding && "mobile-padding",
      withSafeArea && "safe-top safe-bottom",
      className
    )}>
      {children}
    </div>
  );
}

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function MobileCard({ children, className, noPadding = false }: MobileCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border border-gray-200",
      !noPadding && "p-4 sm:p-6",
      className
    )}>
      {children}
    </div>
  );
}

interface MobileGridProps {
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3;
}

export function MobileGrid({ children, className, columns = 1 }: MobileGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2", 
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  backButton?: ReactNode;
}

export function MobileHeader({ title, subtitle, action, backButton }: MobileHeaderProps) {
  return (
    <div className="mb-6">
      {backButton && (
        <div className="mb-4">
          {backButton}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

interface MobileTableProps {
  children: ReactNode;
  className?: string;
}

export function MobileTable({ children, className }: MobileTableProps) {
  return (
    <div className="mobile-table-wrapper">
      <div className={cn("mobile-table", className)}>
        {children}
      </div>
    </div>
  );
}

interface MobileButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function MobileButton({ 
  children, 
  className, 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  onClick,
  disabled = false,
  type = 'button'
}: MobileButtonProps) {
  const baseClasses = "mobile-button tap-highlight-none transition-colors";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-red-600 disabled:bg-gray-300",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm min-h-[36px]",
    md: "px-4 py-2 text-base min-h-[44px]", 
    lg: "px-6 py-3 text-lg min-h-[52px]"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

interface MobileFormProps {
  children: ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

export function MobileForm({ children, className, onSubmit }: MobileFormProps) {
  return (
    <form className={cn("mobile-form", className)} onSubmit={onSubmit}>
      {children}
    </form>
  );
}
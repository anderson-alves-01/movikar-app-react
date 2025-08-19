import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Heart, Star, Car, CheckCircle, AlertCircle } from "lucide-react";

interface AnimatedButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  ripple?: boolean;
}

export function AnimatedButton({ 
  children, 
  variant = "primary", 
  size = "md",
  className = "",
  onClick,
  disabled,
  loading,
  success,
  ripple = true
}: AnimatedButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const baseClasses = "relative overflow-hidden transition-all duration-200 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-primary to-red-500 text-white hover:from-primary/90 hover:to-red-500/90 focus:ring-primary shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary",
    ghost: "text-primary hover:bg-primary/10 focus:ring-primary"
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm min-h-[36px]",
    md: "px-4 py-2 text-base min-h-[40px]",
    lg: "px-6 py-3 text-lg min-h-[48px]"
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    if (ripple) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const id = Date.now();

      setRipples(prev => [...prev, { x, y, id }]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== id));
      }, 600);
    }

    onClick?.();
  };

  return (
    <motion.button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      data-testid={`button-${variant}`}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none animate-ping"
          style={{
            left: ripple.x - 20,
            top: ripple.y - 20,
            width: 40,
            height: 40,
          }}
        />
      ))}

      {/* Content */}
      <span className="relative flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {success && <CheckCircle className="w-4 h-4" />}
        {children}
      </span>

      {/* Brand shimmer effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
    </motion.button>
  );
}

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  clickScale?: number;
  onClick?: () => void;
}

export function AnimatedCard({ 
  children, 
  className = "",
  hoverScale = 1.02,
  clickScale = 0.98,
  onClick 
}: AnimatedCardProps) {
  return (
    <motion.div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-200 transition-shadow duration-200 cursor-pointer",
        className
      )}
      whileHover={{ 
        scale: hoverScale,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      whileTap={{ scale: clickScale }}
      onClick={onClick}
      data-testid="animated-card"
    >
      {children}
      
      {/* Accent line animation */}
      <motion.div
        className="h-1 bg-gradient-to-r from-primary via-red-500 to-primary"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{ originX: 0 }}
      />
    </motion.div>
  );
}

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
}

export function FloatingActionButton({ 
  icon, 
  onClick, 
  className = "",
  size = "md",
  variant = "primary"
}: FloatingActionButtonProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-14 h-14"
  };

  const variantClasses = {
    primary: "bg-gradient-to-r from-primary to-red-500 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-white text-primary border border-gray-200 shadow-md hover:shadow-lg"
  };

  return (
    <motion.button
      className={cn(
        "fixed bottom-6 right-6 rounded-full flex items-center justify-center z-50 transition-all duration-200",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      data-testid="floating-action-button"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        {icon}
      </motion.div>
    </motion.button>
  );
}

interface PulsingDotProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "red" | "green" | "blue" | "yellow";
  className?: string;
}

export function PulsingDot({ size = "md", color = "primary", className = "" }: PulsingDotProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  const colorClasses = {
    primary: "bg-primary",
    red: "bg-red-500",
    green: "bg-green-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-500"
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className={cn("rounded-full animate-ping opacity-75", sizeClasses[size], colorClasses[color])} />
      <div className={cn("absolute rounded-full", sizeClasses[size], colorClasses[color])} />
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dots" | "brand";
  className?: string;
}

export function LoadingSpinner({ size = "md", variant = "brand", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "brand") {
    return (
      <div className={cn("relative", sizeClasses[size], className)}>
        <motion.div
          className="w-full h-full rounded-full border-2 border-gray-200"
          style={{
            background: "conic-gradient(from 0deg, transparent, #ef4444, #dc2626, transparent)"
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-1 bg-white rounded-full" />
        <Car className="absolute inset-0 m-auto w-1/2 h-1/2 text-primary" />
      </div>
    );
  }

  return (
    <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
  );
}

interface ProgressBarProps {
  progress: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  animated?: boolean;
}

export function ProgressBar({ 
  progress, 
  className = "", 
  size = "md", 
  showPercentage = false,
  animated = true 
}: ProgressBarProps) {
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3"
  };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("bg-gray-200 rounded-full overflow-hidden", sizeClasses[size])}>
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-red-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: animated ? 0.5 : 0, ease: "easeOut" }}
        />
      </div>
      {showPercentage && (
        <div className="text-sm text-gray-600 mt-1 text-center">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
}

interface ToastNotificationProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  isVisible: boolean;
  onClose?: () => void;
  duration?: number;
}

export function ToastNotification({
  message,
  type = "info",
  isVisible,
  onClose,
  duration = 4000
}: ToastNotificationProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    info: <AlertCircle className="w-5 h-5 text-blue-600" />
  };

  const colorClasses = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200"
  };

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            "fixed top-4 right-4 p-4 rounded-lg border shadow-lg flex items-center gap-3 z-50 max-w-sm",
            colorClasses[type]
          )}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {icons[type]}
          <p className="text-sm font-medium text-gray-900">{message}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
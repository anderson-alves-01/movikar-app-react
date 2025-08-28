import { useEffect, useState } from "react";
import { Coins, Plus, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoinAnimationProps {
  type: "earn" | "spend" | "purchase";
  amount: number;
  show: boolean;
  onComplete?: () => void;
  className?: string;
}

export function CoinAnimation({ type, amount, show, onComplete, className }: CoinAnimationProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (show) {
      setAnimate(true);
      const timer = setTimeout(() => {
        setAnimate(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show && !animate) return null;

  const getAnimationStyles = () => {
    switch (type) {
      case "earn":
        return "animate-bounce text-primary border-primary-light bg-primary-light";
      case "spend":
        return "animate-pulse text-destructive border-red-200 bg-red-50";
      case "purchase":
        return "animate-ping text-secondary border-secondary-light bg-secondary-light";
      default:
        return "animate-pulse text-gray-500 border-gray-200 bg-gray-50";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "earn":
        return <Plus className="h-4 w-4" />;
      case "spend":
        return <Minus className="h-4 w-4" />;
      case "purchase":
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  const getPrefix = () => {
    switch (type) {
      case "earn":
        return "+";
      case "spend":
        return "-";
      case "purchase":
        return "+";
      default:
        return "";
    }
  };

  return (
    <div
      className={cn(
        "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50",
        "flex items-center gap-2 px-4 py-2 rounded-full border-2 font-bold text-lg shadow-lg",
        "transition-all duration-500",
        animate ? "opacity-100 scale-110" : "opacity-0 scale-95",
        getAnimationStyles(),
        className
      )}
    >
      {getIcon()}
      <span>{getPrefix()}{amount}</span>
      <Coins className="h-5 w-5" />
    </div>
  );
}

interface FloatingCoinProps {
  startX: number;
  startY: number;
  show: boolean;
  onComplete?: () => void;
}

export function FloatingCoin({ startX, startY, show, onComplete }: FloatingCoinProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (show) {
      setAnimate(true);
      const timer = setTimeout(() => {
        setAnimate(false);
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show && !animate) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: startX,
        top: startY,
        transform: animate ? 'translateY(-100px) scale(1.5)' : 'translateY(0) scale(1)',
        opacity: animate ? 0 : 1,
        transition: 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      <Coins className="h-8 w-8 text-yellow-500 animate-spin" />
    </div>
  );
}

interface CoinCounterAnimationProps {
  from: number;
  to: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function CoinCounterAnimation({ 
  from, 
  to, 
  duration = 1000, 
  className,
  prefix = "",
  suffix = ""
}: CoinCounterAnimationProps) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    const start = performance.now();
    const startValue = from;
    const endValue = to;
    const totalChange = endValue - startValue;

    const updateCount = (timestamp: number) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + totalChange * easeOutCubic);
      
      setCount(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }, [from, to, duration]);

  return (
    <span className={cn("transition-colors duration-300", className)}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

interface CoinSparkleEffectProps {
  show: boolean;
  onComplete?: () => void;
  particleCount?: number;
}

export function CoinSparkleEffect({ show, onComplete, particleCount = 12 }: CoinSparkleEffectProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50, // Random position from -50 to 50
        y: Math.random() * 100 - 50,
        delay: Math.random() * 500, // Random delay up to 500ms
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, particleCount, onComplete]);

  if (!show || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute top-1/2 left-1/2"
          style={{
            transform: `translate(-50%, -50%) translate(${particle.x}px, ${particle.y}px)`,
            animationDelay: `${particle.delay}ms`,
          }}
        >
          <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
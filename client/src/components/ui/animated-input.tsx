import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  animateOnFocus?: boolean;
}

const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ className, type, label, error, animateOnFocus = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value !== "");
      props.onBlur?.(e);
    };

    return (
      <div className="relative">
        {label && (
          <motion.label
            className={cn(
              "absolute left-3 text-sm font-medium transition-all duration-200 pointer-events-none z-10",
              (isFocused || hasValue || props.value) 
                ? "top-2 text-xs text-primary" 
                : "top-1/2 -translate-y-1/2 text-gray-500"
            )}
            animate={{
              y: (isFocused || hasValue || props.value) ? -6 : 0,
              scale: (isFocused || hasValue || props.value) ? 0.85 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}
        
        <motion.input
          type={type}
          className={cn(
            "input-focus flex h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            label ? "pt-6 pb-2" : "px-3 py-2",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          whileFocus={animateOnFocus ? { scale: 1.02 } : undefined}
          transition={{ duration: 0.2 }}
          {...(props as any)}
        />
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-red-500 text-xs mt-1"
          >
            {error}
          </motion.div>
        )}
      </div>
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";

export { AnimatedInput };
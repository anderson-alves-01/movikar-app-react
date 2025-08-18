import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TooltipStep {
  id: string;
  target: string; // CSS selector or data-testid
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  showNext?: boolean;
  showPrev?: boolean;
  showSkip?: boolean;
  action?: () => void;
  delay?: number;
}

interface InteractiveTooltipProps {
  steps: TooltipStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  className?: string;
}

export function InteractiveTooltip({ 
  steps, 
  isActive, 
  onComplete, 
  onSkip,
  className 
}: InteractiveTooltipProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const findAndHighlightTarget = () => {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        
        // Calculate tooltip position
        const rect = element.getBoundingClientRect();
        const position = currentStepData.position || "bottom";
        
        let x = 0, y = 0;
        
        switch (position) {
          case "top":
            x = rect.left + rect.width / 2;
            y = rect.top - 10;
            break;
          case "bottom":
            x = rect.left + rect.width / 2;
            y = rect.bottom + 10;
            break;
          case "left":
            x = rect.left - 10;
            y = rect.top + rect.height / 2;
            break;
          case "right":
            x = rect.right + 10;
            y = rect.top + rect.height / 2;
            break;
          case "center":
            x = window.innerWidth / 2;
            y = window.innerHeight / 2;
            break;
        }
        
        setTooltipPosition({ x, y });
        
        // Scroll to element if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight effect
        element.style.position = 'relative';
        element.style.zIndex = '1001';
        element.classList.add('onboarding-highlight');
      }
    };

    // Delay to allow page to render
    const timeout = setTimeout(findAndHighlightTarget, currentStepData.delay || 100);
    
    return () => {
      clearTimeout(timeout);
      if (targetElement) {
        targetElement.style.zIndex = '';
        targetElement.classList.remove('onboarding-highlight');
      }
    };
  }, [currentStep, isActive, currentStepData, targetElement]);

  const handleNext = () => {
    if (currentStepData.action) {
      currentStepData.action();
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isActive || !currentStepData) return null;

  const getTooltipStyle = () => {
    const position = currentStepData.position || "bottom";
    
    switch (position) {
      case "top":
        return {
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: "translate(-50%, -100%)"
        };
      case "bottom":
        return {
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: "translate(-50%, 0%)"
        };
      case "left":
        return {
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: "translate(-100%, -50%)"
        };
      case "right":
        return {
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: "translate(0%, -50%)"
        };
      case "center":
        return {
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: "translate(-50%, -50%)"
        };
    }
  };

  return (
    <>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 bg-black/50 z-[1000]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleSkip}
      />
      
      {/* Spotlight on target element */}
      {targetElement && (
        <motion.div
          className="fixed pointer-events-none z-[1000]"
          style={{
            left: targetElement.getBoundingClientRect().left - 8,
            top: targetElement.getBoundingClientRect().top - 8,
            width: targetElement.getBoundingClientRect().width + 16,
            height: targetElement.getBoundingClientRect().height + 16,
            boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.8), 0 0 0 9999px rgba(0, 0, 0, 0.5)",
            borderRadius: "8px"
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Tooltip */}
      <motion.div
        className={cn("fixed z-[1001] pointer-events-auto", className)}
        style={getTooltipStyle()}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-80 max-w-sm shadow-xl">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentStepData.title}
                </h3>
              </div>
              {currentStepData.showSkip !== false && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="p-1 h-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Content */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              {currentStepData.content}
            </p>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Passo {currentStep + 1} de {steps.length}</span>
                <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div>
                {currentStep > 0 && currentStepData.showPrev !== false && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    className="mr-2"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2">
                {currentStepData.showSkip !== false && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                  >
                    Pular tutorial
                  </Button>
                )}
                
                {currentStepData.showNext !== false && (
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
                    {currentStep < steps.length - 1 && (
                      <ChevronRight className="h-4 w-4 ml-1" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('hasSeenOnboarding');
    if (!seen) {
      setIsOnboardingActive(true);
    } else {
      setHasSeenOnboarding(true);
    }
  }, []);

  const startOnboarding = () => {
    setIsOnboardingActive(true);
  };

  const completeOnboarding = () => {
    setIsOnboardingActive(false);
    setHasSeenOnboarding(true);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const skipOnboarding = () => {
    setIsOnboardingActive(false);
    setHasSeenOnboarding(true);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const resetOnboarding = () => {
    localStorage.removeItem('hasSeenOnboarding');
    setHasSeenOnboarding(false);
    setIsOnboardingActive(true);
  };

  return {
    isOnboardingActive,
    hasSeenOnboarding,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  };
}
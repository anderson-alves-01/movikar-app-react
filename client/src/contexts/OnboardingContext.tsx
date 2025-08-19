import React, { createContext, useContext, useState, useEffect } from 'react';

interface OnboardingContextType {
  isOnboardingActive: boolean;
  hasSeenOnboarding: boolean;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('hasSeenOnboarding');
    console.log('🎯 OnboardingProvider init:', { seen, hasSeenOnboarding, isOnboardingActive });
    if (!seen) {
      setHasSeenOnboarding(false);
    } else {
      setHasSeenOnboarding(true);
    }
  }, []);

  const startOnboarding = () => {
    console.log('🚀 Starting onboarding...', { current: isOnboardingActive });
    setIsOnboardingActive(true);
    setHasSeenOnboarding(true);
    console.log('🚀 Onboarding state updated to active');
  };

  const completeOnboarding = () => {
    console.log('✅ Completing onboarding');
    setIsOnboardingActive(false);
    setHasSeenOnboarding(true);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const skipOnboarding = () => {
    console.log('⏭️ Skipping onboarding');
    setIsOnboardingActive(false);
    setHasSeenOnboarding(true);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const resetOnboarding = () => {
    console.log('🔄 Resetting onboarding');
    localStorage.removeItem('hasSeenOnboarding');
    setHasSeenOnboarding(false);
    setIsOnboardingActive(true);
  };

  const value = {
    isOnboardingActive,
    hasSeenOnboarding,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  };

  console.log('🎯 OnboardingProvider render:', { isOnboardingActive, hasSeenOnboarding });

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
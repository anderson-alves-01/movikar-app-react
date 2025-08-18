import React from "react";
import { InteractiveTooltip, TooltipStep, useOnboarding } from "@/components/ui/tooltip-interactive";
import { useAuthStore } from "@/lib/auth";
import { useLocation } from "wouter";

// Define onboarding steps for different pages
const homeOnboardingSteps: TooltipStep[] = [
  {
    id: "welcome",
    target: "body",
    title: "Bem-vindo ao alugae.mobi!",
    content: "Vamos fazer um tour rápido pela plataforma para você conhecer as principais funcionalidades.",
    position: "center",
    showPrev: false,
    delay: 500
  },
  {
    id: "search",
    target: "[data-testid='search-input']",
    title: "Busque veículos",
    content: "Use a barra de pesquisa para encontrar carros disponíveis na sua região. Você pode filtrar por localização, datas e tipo de veículo.",
    position: "bottom"
  },
  {
    id: "login",
    target: "[data-testid='button-login']",
    title: "Faça login",
    content: "Clique aqui para entrar na sua conta ou criar uma nova. Você precisa estar logado para alugar ou anunciar veículos.",
    position: "bottom"
  },
  {
    id: "features",
    target: ".feature-cards",
    title: "Conheça os recursos",
    content: "Explore nossos principais recursos: aluguel seguro, vistoria digital, pagamentos protegidos e muito mais.",
    position: "top"
  }
];

const authenticatedHomeSteps: TooltipStep[] = [
  {
    id: "welcome-back",
    target: "body",
    title: "Ótimo! Você está logado",
    content: "Agora você pode alugar veículos e anunciar os seus próprios carros. Vamos ver as principais funcionalidades.",
    position: "center",
    showPrev: false
  },
  {
    id: "user-menu",
    target: "[data-testid='header-user-menu']",
    title: "Menu do usuário",
    content: "Acesse seu perfil, reservas, veículos e configurações através do menu do usuário.",
    position: "bottom"
  },
  {
    id: "add-vehicle",
    target: "a[href='/vehicles']",
    title: "Anuncie seu veículo",
    content: "Clique aqui para cadastrar seu carro e começar a ganhar dinheiro alugando para outros usuários.",
    position: "bottom"
  },
  {
    id: "upgrade",
    target: "a[href='/subscription-plans']",
    title: "Planos Premium",
    content: "Upgrade para um plano premium e aproveite benefícios exclusivos como destaque dos seus veículos.",
    position: "bottom"
  },
  {
    id: "vehicle-cards",
    target: ".vehicle-grid",
    title: "Navegue pelos veículos",
    content: "Explore os carros disponíveis. Clique em qualquer veículo para ver detalhes, fotos e fazer uma reserva.",
    position: "top"
  }
];

const profileOnboardingSteps: TooltipStep[] = [
  {
    id: "profile-welcome",
    target: "body",
    title: "Seu perfil",
    content: "Esta é sua página de perfil onde você pode gerenciar suas informações pessoais e acompanhar suas atividades.",
    position: "center",
    showPrev: false
  },
  {
    id: "edit-profile",
    target: "[data-testid='button-edit-profile']",
    title: "Editar perfil",
    content: "Mantenha suas informações atualizadas para uma melhor experiência na plataforma.",
    position: "left"
  },
  {
    id: "bookings-tab",
    target: "[data-value='renter']",
    title: "Suas reservas",
    content: "Acompanhe todas as suas reservas como locatário - histórico, reservas ativas e futuras.",
    position: "bottom"
  },
  {
    id: "owner-tab",
    target: "[data-value='owner']",
    title: "Como proprietário",
    content: "Gerencie as reservas dos seus veículos e acompanhe seus ganhos como proprietário.",
    position: "bottom"
  },
  {
    id: "vehicles-tab",
    target: "[data-value='vehicles']",
    title: "Seus veículos",
    content: "Visualize e gerencie todos os veículos que você cadastrou na plataforma.",
    position: "bottom"
  }
];

interface OnboardingFlowProps {
  page?: "home" | "profile" | "vehicles" | "custom";
  customSteps?: TooltipStep[];
}

export function OnboardingFlow({ page = "home", customSteps }: OnboardingFlowProps) {
  const { user } = useAuthStore();
  const [location] = useLocation();
  const {
    isOnboardingActive,
    completeOnboarding,
    skipOnboarding
  } = useOnboarding();

  // Determine which steps to show based on page and user state
  const getSteps = (): TooltipStep[] => {
    if (customSteps) return customSteps;
    
    switch (page) {
      case "home":
        return user ? authenticatedHomeSteps : homeOnboardingSteps;
      case "profile":
        return profileOnboardingSteps;
      default:
        return homeOnboardingSteps;
    }
  };

  const steps = getSteps();

  // Only show onboarding on specific pages
  const shouldShowOnboarding = () => {
    if (!isOnboardingActive) return false;
    
    // Show on home page for new users
    if (location === "/" && page === "home") return true;
    
    // Show on profile page if user just logged in
    if (location === "/profile" && page === "profile" && user) return true;
    
    // Show custom onboarding
    if (customSteps) return true;
    
    return false;
  };

  if (!shouldShowOnboarding()) return null;

  return (
    <InteractiveTooltip
      steps={steps}
      isActive={isOnboardingActive}
      onComplete={completeOnboarding}
      onSkip={skipOnboarding}
    />
  );
}

// Component to trigger onboarding manually
export function OnboardingTrigger() {
  const { startOnboarding, hasSeenOnboarding } = useOnboarding();

  if (!hasSeenOnboarding) return null;

  return (
    <button
      onClick={startOnboarding}
      className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50 transition-all duration-200 hover:scale-110"
      title="Iniciar tutorial"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  );
}
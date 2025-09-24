// Componente para controlar se deve exibir a landing page ou o app normal
// Agora o valor é controlado através das configurações do admin no banco de dados

import { useQuery } from "@tanstack/react-query";

// Tipo para as configurações públicas retornadas pela API
interface PublicFeatureToggles {
  showLaunchPage: boolean;
  enableRentNowCheckout: boolean;
  enableInsuranceOption: boolean;
  enableServiceFee: boolean;
  contractSignatureEnabled: boolean;
  waitlistCount: number;
}

// Hook para buscar configurações públicas
function usePublicFeatureToggles() {
  return useQuery<PublicFeatureToggles>({
    queryKey: ['/api/public/feature-toggles'],
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
}

// Hook para determinar se deve mostrar a landing page
export function useShowLaunchPage() {
  const { data: featureToggles, isLoading, error } = usePublicFeatureToggles();
  
  // Debug temporário
  console.log('🚀 LaunchSwitch Debug:', {
    isLoading,
    error,
    featureToggles,
    showLaunchPage: featureToggles?.showLaunchPage
  });
  
  // Se está carregando, usar false para não bloquear o app
  if (isLoading) {
    console.log('⏳ Still loading, showing main app...');
    return false;
  }
  
  // Se há erro, usar false para não bloquear o app
  if (error) {
    console.log('❌ Error loading feature toggles, showing main app...', error);
    return false;
  }
  
  // Se temos dados, usar o valor real
  const shouldShow = featureToggles?.showLaunchPage ?? false;
  console.log('✅ Feature toggles loaded, showLaunchPage:', shouldShow);
  return shouldShow;
}

// Versão síncrona para compatibilidade (deprecated)
const SHOW_LAUNCH_PAGE = true; // Fallback padrão, use useShowLaunchPage() em componentes

export { SHOW_LAUNCH_PAGE };

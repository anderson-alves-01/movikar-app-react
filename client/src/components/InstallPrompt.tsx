import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export function InstallPrompt() {
  const { isInstallable, isAppStandalone, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  const handleInstall = async () => {
    const installed = await installApp();
    if (!installed) {
      // If installation failed or was cancelled, don't show prompt again this session
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Don't show if app is already running in standalone mode, not installable, or dismissed
  if (!isInstallable || isAppStandalone || isDismissed) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm border-secondary/20 bg-white/95 backdrop-blur-sm shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="bg-secondary/10 p-2 rounded-full">
              <Smartphone className="h-5 w-5 text-secondary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900">
              Instalar alugae.mobi
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Acesse mais rápido e receba notificações
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              onClick={handleInstall}
              className="bg-secondary hover:bg-secondary/90 text-white h-8 px-3"
            >
              <Download className="h-3 w-3 mr-1" />
              Instalar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function IOSInstallPrompt() {
  const [isDismissed, setIsDismissed] = useState(false);
  const { isAppStandalone } = usePWA();

  // Check if iOS device
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Don't show if not iOS, already standalone, or dismissed
  if (!isIOS || isAppStandalone || isDismissed) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm border-blue-200 bg-blue-50/95 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="bg-blue-100 p-2 rounded-full">
              <Smartphone className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-blue-900">
              Adicionar à Tela Inicial
            </h3>
            <p className="text-xs text-blue-700 mt-1">
              Toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela Inicial</strong>
            </p>
          </div>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setIsDismissed(true)}
            className="h-6 w-6 p-0 text-blue-400 hover:text-blue-600"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
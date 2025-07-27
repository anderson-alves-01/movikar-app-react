import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Wifi, 
  WifiOff, 
  Bell, 
  Smartphone, 
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { usePWA, useOnlineStatus, useNotificationPermission } from "@/hooks/usePWA";
import { isStandalone, canInstallPWA, requestNotificationPermission, sendLocalNotification } from "@/utils/pwa";

export function PWADemo() {
  const { isInstallable, isInstalled, isAppStandalone, installApp } = usePWA();
  const isOnline = useOnlineStatus();
  const { permission, requestPermission } = useNotificationPermission();
  const [testingNotification, setTestingNotification] = useState(false);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      console.log("App installed successfully!");
    }
  };

  const handleNotificationTest = async () => {
    setTestingNotification(true);
    
    const granted = await requestNotificationPermission();
    if (granted) {
      sendLocalNotification(
        "CarShare PWA",
        "Notificações funcionando! Você receberá updates sobre suas reservas.",
        "/icons/icon-192x192.png"
      );
    }
    
    setTimeout(() => setTestingNotification(false), 2000);
  };

  const getStatusIcon = (status: boolean) => {
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (status: boolean, text: string) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className="text-xs">
        {status ? "✓" : "✗"} {text}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-secondary" />
          Status PWA CarShare
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
            <span className="text-sm">Conexão</span>
          </div>
          {getStatusBadge(isOnline, isOnline ? "Online" : "Offline")}
        </div>

        {/* PWA Support */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(canInstallPWA())}
            <span className="text-sm">Suporte PWA</span>
          </div>
          {getStatusBadge(canInstallPWA(), "Compatível")}
        </div>

        {/* Standalone Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(isAppStandalone)}
            <span className="text-sm">Modo App</span>
          </div>
          {getStatusBadge(isAppStandalone, isAppStandalone ? "Instalado" : "Browser")}
        </div>

        {/* Service Worker */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon('serviceWorker' in navigator)}
            <span className="text-sm">Service Worker</span>
          </div>
          {getStatusBadge('serviceWorker' in navigator, "Ativo")}
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="text-sm">Notificações</span>
          </div>
          {getStatusBadge(permission === 'granted', 
            permission === 'granted' ? "Permitidas" : 
            permission === 'denied' ? "Negadas" : "Pendente"
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t">
          
          {/* Install Button */}
          {isInstallable && !isAppStandalone && (
            <Button 
              onClick={handleInstall}
              className="w-full bg-secondary hover:bg-secondary/90"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Instalar App
            </Button>
          )}

          {/* Notification Test */}
          <Button 
            onClick={handleNotificationTest}
            disabled={testingNotification}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Bell className="h-4 w-4 mr-2" />
            {testingNotification ? "Testando..." : "Testar Notificação"}
          </Button>

        </div>

        {/* Info Message */}
        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 text-blue-600" />
            <div>
              {isAppStandalone ? (
                <span>✨ Você está usando o CarShare como app nativo! Funciona offline e recebe notificações.</span>
              ) : isInstallable ? (
                <span>📱 Instale o CarShare na sua tela inicial para uma experiência melhor!</span>
              ) : (
                <span>🌐 CarShare funciona como PWA no seu navegador com cache offline.</span>
              )}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
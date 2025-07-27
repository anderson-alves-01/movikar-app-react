import { useOnlineStatus } from "@/hooks/usePWA";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [showOffline, setShowOffline] = useState(false);
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true);
      setShowOnline(false);
    } else {
      setShowOffline(false);
      // Show online indicator briefly when connection is restored
      if (showOffline) {
        setShowOnline(true);
        const timer = setTimeout(() => {
          setShowOnline(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, showOffline]);

  if (!showOffline && !showOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm">
      {showOffline && (
        <Alert className="border-red-200 bg-red-50/95 backdrop-blur-sm text-red-800">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Você está offline. Algumas funcionalidades podem estar limitadas.
          </AlertDescription>
        </Alert>
      )}
      
      {showOnline && (
        <Alert className="border-green-200 bg-green-50/95 backdrop-blur-sm text-green-800">
          <Wifi className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Conexão restaurada! Todas as funcionalidades estão disponíveis.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
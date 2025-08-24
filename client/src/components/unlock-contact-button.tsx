import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Coins, Phone, Mail, User, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CoinAnimation, FloatingCoin } from "@/components/coin-animation";

interface UnlockContactButtonProps {
  vehicleId: number;
  ownerId: number;
  ownerName?: string;
  className?: string;
}

interface UserCoins {
  availableCoins: number;
}

interface ContactUnlock {
  id: number;
  userId: number;
  vehicleId: number;
  ownerId: number;
  coinsSpent: number;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  expiresAt: string;
  createdAt: string;
}

export default function UnlockContactButton({ vehicleId, ownerId, ownerName, className }: UnlockContactButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [unlockedContact, setUnlockedContact] = useState<ContactUnlock | null>(null);
  const [showSpendAnimation, setShowSpendAnimation] = useState(false);
  const [showFloatingCoins, setShowFloatingCoins] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const coinsRequired = 200;

  // Get user's coin balance
  const { data: userCoins } = useQuery<UserCoins>({
    queryKey: ["/api/coins"],
  });

  // Check if contact is already unlocked
  const { data: existingUnlock } = useQuery<ContactUnlock | undefined>({
    queryKey: ["/api/coins/unlocks", vehicleId],
    queryFn: async () => {
      const unlocks = await apiRequest("GET", "/api/coins/unlocks") as unknown as ContactUnlock[];
      return unlocks.find((unlock: ContactUnlock) => unlock.vehicleId === vehicleId);
    },
  });

  const unlockMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/coins/unlock-contact", {
        vehicleId,
      }) as unknown as ContactUnlock;
    },
    onSuccess: (data) => {
      setUnlockedContact(data);
      setShowContactInfo(true);
      setShowSpendAnimation(true);
      setShowFloatingCoins(true);
      toast({
        title: "Contato desbloqueado!",
        description: `${coinsRequired} moedas foram utilizadas para desbloquear o contato.`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/coins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coins/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coins/unlocks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao desbloquear contato",
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
    },
  });

  const handleUnlock = () => {
    if (!userCoins || userCoins.availableCoins < coinsRequired) {
      toast({
        title: "Moedas insuficientes",
        description: `Você precisa de ${coinsRequired} moedas para desbloquear este contato. Compre mais moedas na sua carteira.`,
        variant: "destructive",
      });
      return;
    }

    setIsDialogOpen(true);
  };

  const confirmUnlock = () => {
    unlockMutation.mutate();
    setIsDialogOpen(false);
  };

  // If contact is already unlocked and still valid
  if (existingUnlock && new Date(existingUnlock.expiresAt) > new Date()) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Contato Desbloqueado
            </CardTitle>
            <Badge variant="default">Ativo</Badge>
          </div>
          <CardDescription>
            Você já tem acesso às informações de contato deste proprietário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span data-testid="text-owner-phone">{existingUnlock.contactInfo.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span data-testid="text-owner-email">{existingUnlock.contactInfo.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Expira {formatDistanceToNow(new Date(existingUnlock.expiresAt), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If showing unlocked contact info
  if (showContactInfo && unlockedContact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Contato Desbloqueado
            </CardTitle>
            <Badge variant="default">Novo</Badge>
          </div>
          <CardDescription>
            Informações de contato do proprietário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span data-testid="text-owner-phone">{unlockedContact.contactInfo.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span data-testid="text-owner-email">{unlockedContact.contactInfo.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Expira {formatDistanceToNow(new Date(unlockedContact.expiresAt), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            Contato do Proprietário
          </CardTitle>
          <CardDescription>
            Desbloqueie o contato direto com {ownerName || "o proprietário"} do veículo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Custo para desbloquear</span>
            </div>
            <Badge variant="outline" className="font-bold">
              {coinsRequired} moedas
            </Badge>
          </div>

          {userCoins && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Suas moedas disponíveis:</span>
              <span className={`font-medium ${
                userCoins.availableCoins >= coinsRequired ? 'text-green-600' : 'text-red-600'
              }`}>
                {userCoins.availableCoins} moedas
              </span>
            </div>
          )}

          <Button 
            onClick={handleUnlock}
            disabled={unlockMutation.isPending || !userCoins || userCoins.availableCoins < coinsRequired}
            className="w-full"
            data-testid="button-unlock-contact"
          >
            {unlockMutation.isPending ? (
              "Desbloqueando..."
            ) : userCoins && userCoins.availableCoins < coinsRequired ? (
              "Moedas insuficientes"
            ) : (
              `Desbloquear por ${coinsRequired} moedas`
            )}
          </Button>

          {userCoins && userCoins.availableCoins < coinsRequired && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Moedas insuficientes</p>
                <p className="text-yellow-700">
                  Você precisa de mais {coinsRequired - userCoins.availableCoins} moedas.{" "}
                  <a href="/coins" className="underline font-medium">
                    Comprar moedas
                  </a>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-confirm-unlock">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-600" />
              Confirmar Desbloqueio
            </DialogTitle>
            <DialogDescription>
              Você está prestes a gastar {coinsRequired} moedas para desbloquear o contato do proprietário.
              O acesso ficará disponível por 30 dias.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Custo:</span>
                <span className="font-bold">{coinsRequired} moedas</span>
              </div>
              <div className="flex justify-between">
                <span>Saldo atual:</span>
                <span>{userCoins?.availableCoins || 0} moedas</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Saldo após desbloqueio:</span>
                <span className="font-bold">
                  {(userCoins?.availableCoins || 0) - coinsRequired} moedas
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
                data-testid="button-cancel-unlock"
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmUnlock}
                disabled={unlockMutation.isPending}
                className="flex-1"
                data-testid="button-confirm-unlock"
              >
                {unlockMutation.isPending ? "Processando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
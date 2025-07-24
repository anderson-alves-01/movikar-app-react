import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, FileText, CheckCircle, Clock, Car } from "lucide-react";

interface BookingStatusDemoProps {
  booking: {
    id: number;
    status: string;
    startDate: string;
    endDate: string;
    vehicleId: number;
  };
  contract?: {
    id: number;
    status: string;
  };
  isBlocked: boolean;
}

export default function BookingStatusDemo({ booking, contract, isBlocked }: BookingStatusDemoProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "signed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Demonstração: Bloqueio Automático
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Booking Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status da Reserva:</span>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status === "completed" ? "Concluída" : 
               booking.status === "approved" ? "Aprovada" : 
               booking.status === "pending" ? "Pendente" : booking.status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4" />
            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
          </div>
        </div>

        {/* Contract Status */}
        {contract && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status do Contrato:</span>
              <Badge className={getStatusColor(contract.status)}>
                {contract.status === "signed" ? "Assinado" : 
                 contract.status === "draft" ? "Rascunho" : 
                 contract.status === "sent" ? "Enviado" : contract.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              Contrato #{contract.id}
            </div>
          </div>
        )}

        {/* Blocking Status */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Datas Bloqueadas:</span>
            {isBlocked ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Sim</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Aguardando</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {isBlocked ? 
              "✅ Veículo automaticamente bloqueado para as datas da reserva" :
              "⏳ Bloqueio ocorrerá quando reserva estiver concluída E contrato assinado"
            }
          </div>
        </div>

        {/* Demo Logic */}
        <div className="space-y-2 pt-2 border-t bg-blue-50 p-3 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900">🔧 Sistema Automático:</h4>
          <div className="text-xs text-blue-800 space-y-1">
            <div>
              • Reserva concluída: {booking.status === "completed" ? "✅" : "❌"}
            </div>
            <div>
              • Contrato assinado: {contract?.status === "signed" ? "✅" : "❌"}
            </div>
            <div className="font-medium pt-1">
              → Bloqueio automático: {isBlocked ? "✅ ATIVO" : "❌ Aguardando condições"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
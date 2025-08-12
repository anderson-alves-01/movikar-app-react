import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Camera, Plus, X, Car, Fuel, Gauge, AlertTriangle, CheckCircle2, XCircle, DollarSign, Eye, Shield } from "lucide-react";
import { ownerInspectionFormSchema, type InsertOwnerInspectionForm, type BookingWithDetails } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";

interface OwnerInspectionFormProps {
  booking: BookingWithDetails;
  renterInspection?: any; // Vistoria do locatário para comparação
  onInspectionComplete?: (inspection: any) => void;
}

interface DamageItem {
  type: string;
  location: string;
  severity: "minor" | "moderate" | "severe";
  description: string;
  photo?: string;
}

const FUEL_LEVELS = [
  { value: "empty", label: "Vazio", icon: "🔴" },
  { value: "quarter", label: "1/4 Tanque", icon: "🟡" },
  { value: "half", label: "1/2 Tanque", icon: "🟠" },
  { value: "three_quarters", label: "3/4 Tanque", icon: "🟢" },
  { value: "full", label: "Tanque Cheio", icon: "🟢" }
];

const VEHICLE_CONDITIONS = [
  { value: "excellent", label: "Excelente", color: "text-green-600" },
  { value: "good", label: "Bom", color: "text-blue-600" },
  { value: "fair", label: "Regular", color: "text-yellow-600" },
  { value: "poor", label: "Ruim", color: "text-red-600" }
];

const DAMAGE_TYPES = [
  "Arranhão", "Amassado", "Riscos na pintura", "Quebra de vidro", 
  "Pneu furado", "Problema mecânico", "Interior danificado", "Outros"
];

const DEPOSIT_DECISIONS = [
  { value: "full_return", label: "Devolução Total", description: "Devolver 100% da caução", color: "text-green-600" },
  { value: "partial_return", label: "Devolução Parcial", description: "Reter parte da caução por danos", color: "text-yellow-600" },
  { value: "no_return", label: "Não Devolver", description: "Reter toda a caução", color: "text-red-600" }
];

export function OwnerInspectionForm({ booking, renterInspection, onInspectionComplete }: OwnerInspectionFormProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [damages, setDamages] = useState<DamageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositDecision, setDepositDecision] = useState<"full_return" | "partial_return" | "no_return">("full_return");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const securityDeposit = parseFloat(booking.securityDeposit || "0");

  const form = useForm<InsertOwnerInspectionForm>({
    resolver: zodResolver(ownerInspectionFormSchema),
    defaultValues: {
      bookingId: booking.id,
      vehicleId: booking.vehicleId,
      mileage: renterInspection?.mileage || 0,
      fuelLevel: renterInspection?.fuelLevel || "full",
      vehicleCondition: "excellent",
      exteriorCondition: "excellent",
      interiorCondition: "excellent",
      engineCondition: "excellent",
      tiresCondition: "excellent",
      observations: "",
      photos: [],
      damages: [],
      depositDecision: "full_return",
      depositReturnAmount: booking.securityDeposit || "0",
      depositRetainedAmount: "0",
      depositRetentionReason: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertOwnerInspectionForm) => {
      const response = await apiRequest("POST", "/api/bookings/owner-inspection", {
        ...data,
        photos,
        damages,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao salvar vistoria do proprietário");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Vistoria concluída!",
        description: `Vistoria do proprietário realizada com sucesso. ${depositDecision === 'full_return' ? 'Caução será devolvida integralmente.' : depositDecision === 'partial_return' ? 'Caução será devolvida parcialmente.' : 'Caução será retida.'}`,
      });

      // Invalidar caches relevantes
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${booking.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations/owner'] });
      
      if (onInspectionComplete) {
        onInspectionComplete(data);
      }
    },
    onError: (error) => {
      console.error('Owner inspection error:', error);
      toast({
        title: "Erro ao salvar vistoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addDamage = () => {
    setDamages([...damages, {
      type: "",
      location: "",
      severity: "minor",
      description: "",
      photo: "",
    }]);
  };

  const removeDamage = (index: number) => {
    setDamages(damages.filter((_, i) => i !== index));
  };

  const updateDamage = (index: number, field: string, value: any) => {
    const updatedDamages = [...damages];
    updatedDamages[index] = { ...updatedDamages[index], [field]: value };
    setDamages(updatedDamages);
  };

  const addPhoto = (url: string) => {
    setPhotos([...photos, url]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleDepositDecisionChange = (decision: "full_return" | "partial_return" | "no_return") => {
    setDepositDecision(decision);
    
    if (decision === "full_return") {
      form.setValue("depositReturnAmount", booking.securityDeposit || "0");
      form.setValue("depositRetainedAmount", "0");
      form.setValue("depositRetentionReason", "");
    } else if (decision === "no_return") {
      form.setValue("depositReturnAmount", "0");
      form.setValue("depositRetainedAmount", booking.securityDeposit || "0");
    }
    // Para "partial_return", deixar o usuário definir os valores
  };

  const onSubmit = async (data: InsertOwnerInspectionForm) => {
    if (isSubmitting) return;
    
    // Validações específicas da vistoria do proprietário
    if (depositDecision === "partial_return" && !data.depositReturnAmount && !data.depositRetainedAmount) {
      toast({
        title: "Erro",
        description: "Para devolução parcial, defina os valores de devolução e retenção",
        variant: "destructive",
      });
      return;
    }

    if ((depositDecision === "partial_return" || depositDecision === "no_return") && !data.depositRetentionReason?.trim()) {
      toast({
        title: "Erro", 
        description: "Justifique o motivo da retenção da caução",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await mutation.mutateAsync({
        ...data,
        depositDecision,
        photos,
        damages,
      });
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Vistoria do Proprietário - Devolução
          </CardTitle>
          <p className="text-sm text-gray-600">
            Avalie o veículo após a devolução pelo locatário e decida sobre a caução de {formatCurrency(securityDeposit)}
          </p>
        </CardHeader>
      </Card>

      {/* Comparação com Vistoria do Locatário */}
      {renterInspection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Eye className="h-4 w-4 mr-2" />
              Comparação com Vistoria de Retirada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Quilometragem na retirada:</strong> {renterInspection.mileage?.toLocaleString()} km
              </div>
              <div>
                <strong>Combustível na retirada:</strong> {FUEL_LEVELS.find(f => f.value === renterInspection.fuelLevel)?.label || renterInspection.fuelLevel}
              </div>
              <div>
                <strong>Condição na retirada:</strong> {VEHICLE_CONDITIONS.find(c => c.value === renterInspection.vehicleCondition)?.label || renterInspection.vehicleCondition}
              </div>
              {renterInspection.damages && renterInspection.damages.length > 0 && (
                <div className="col-span-2">
                  <strong>Danos reportados na retirada:</strong> {renterInspection.damages.length} item(s)
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Condições do Veículo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Car className="h-5 w-5 mr-2" />
                Condições Atuais do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Quilometragem */}
              <FormField
                control={form.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Gauge className="h-4 w-4 mr-2" />
                      Quilometragem Atual *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 50000"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nível de Combustível */}
              <FormField
                control={form.control}
                name="fuelLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Fuel className="h-4 w-4 mr-2" />
                      Nível de Combustível *
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FUEL_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.icon} {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Condições Detalhadas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehicleCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condição Geral *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VEHICLE_CONDITIONS.map((condition) => (
                            <SelectItem key={condition.value} value={condition.value}>
                              <span className={condition.color}>{condition.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exteriorCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exterior *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VEHICLE_CONDITIONS.map((condition) => (
                            <SelectItem key={condition.value} value={condition.value}>
                              <span className={condition.color}>{condition.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interiorCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interior *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VEHICLE_CONDITIONS.map((condition) => (
                            <SelectItem key={condition.value} value={condition.value}>
                              <span className={condition.color}>{condition.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="engineCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motor *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VEHICLE_CONDITIONS.map((condition) => (
                            <SelectItem key={condition.value} value={condition.value}>
                              <span className={condition.color}>{condition.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tiresCondition"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Pneus *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VEHICLE_CONDITIONS.map((condition) => (
                            <SelectItem key={condition.value} value={condition.value}>
                              <span className={condition.color}>{condition.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Decisão sobre Caução */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Decisão sobre Caução - {formatCurrency(securityDeposit)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {DEPOSIT_DECISIONS.map((decision) => (
                  <div key={decision.value} className="flex items-start space-x-3">
                    <input
                      type="radio"
                      id={decision.value}
                      name="depositDecision"
                      value={decision.value}
                      checked={depositDecision === decision.value}
                      onChange={(e) => handleDepositDecisionChange(e.target.value as any)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={decision.value} className={`font-medium cursor-pointer ${decision.color}`}>
                        {decision.label}
                      </Label>
                      <p className="text-sm text-gray-600">{decision.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {depositDecision === "partial_return" && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg">
                  <FormField
                    control={form.control}
                    name="depositReturnAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor a Devolver (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="depositRetainedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor a Reter (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {(depositDecision === "partial_return" || depositDecision === "no_return") && (
                <FormField
                  control={form.control}
                  name="depositRetentionReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Justificativa da Retenção *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva detalhadamente os motivos para reter a caução..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Observações adicionais sobre a vistoria..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4">
            <Button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando Vistoria...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Finalizar Vistoria do Proprietário
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
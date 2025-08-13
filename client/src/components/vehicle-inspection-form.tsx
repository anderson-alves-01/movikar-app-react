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
import { CameraIcon, Plus, X, Car, Fuel, Gauge, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { insertVehicleInspectionFormSchema, type InsertVehicleInspectionForm, type BookingWithDetails } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VehicleInspectionFormProps {
  booking: BookingWithDetails;
  onInspectionComplete?: (inspection: any) => void;
}

interface DamageItem {
  type: string;
  location: string;
  severity: "minor" | "moderate" | "severe";
  description: string;
  photo?: string;
}

// Removed FUEL_LEVELS - now using numeric input only

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

export function VehicleInspectionForm({ booking, onInspectionComplete }: VehicleInspectionFormProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [damages, setDamages] = useState<DamageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertVehicleInspectionForm>({
    resolver: zodResolver(insertVehicleInspectionFormSchema),
    defaultValues: {
      bookingId: booking.id,
      vehicleId: booking.vehicleId,
      mileage: 0,
      fuelLevel: "100",
      vehicleCondition: "excellent",
      observations: "",
      photos: [],
      damages: [],
      approvalDecision: true,
      rejectionReason: "",
    },
  });

  const createInspectionMutation = useMutation({
    mutationFn: async (data: InsertVehicleInspectionForm) => {
      console.log("Enviando requisição para API...");
      
      const response = await apiRequest("POST", "/api/inspections", data);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: (inspection) => {
      console.log("Vistoria criada com sucesso");
      setIsSubmitting(false);
      toast({
        title: "Vistoria criada com sucesso!",
        description: "A vistoria foi registrada e será processada.",
      });
      
      try {
        queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      } catch (error) {
        console.warn("Erro ao invalidar queries:", error);
      }
      
      if (onInspectionComplete) {
        onInspectionComplete(inspection);
      }
    },
    onError: (error: any) => {
      console.error("Erro na mutação:", error);
      setIsSubmitting(false);
      toast({
        title: "Erro ao criar vistoria",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Simulate photo upload - in production, this would upload to cloud storage
      const newPhotos = Array.from(files).map((file) => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const addDamage = () => {
    setDamages(prev => [...prev, {
      type: "",
      location: "",
      severity: "minor",
      description: "",
    }]);
  };

  const updateDamage = (index: number, field: keyof DamageItem, value: string) => {
    setDamages(prev => prev.map((damage, i) => 
      i === index ? { ...damage, [field]: value } : damage
    ));
  };

  const removeDamage = (index: number) => {
    setDamages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: InsertVehicleInspectionForm) => {
    console.log("Iniciando envio da vistoria...");
    
    // Validação de quilometragem
    if (!data.mileage || data.mileage <= 0) {
      toast({
        title: "Quilometragem obrigatória",
        description: "Por favor, informe uma quilometragem válida (maior que zero).",
        variant: "destructive",
      });
      return;
    }

    // Validação obrigatória de fotos
    if (photos.length === 0) {
      toast({
        title: "Fotos obrigatórias",
        description: "Por favor, adicione pelo menos uma foto do veículo antes de finalizar a vistoria.",
        variant: "destructive",
      });
      return;
    }

    // Validação de motivo de reprovação
    if (!data.approvalDecision && (!data.rejectionReason || data.rejectionReason.trim() === "")) {
      toast({
        title: "Motivo da reprovação obrigatório",
        description: "Por favor, informe o motivo da reprovação da vistoria.",
        variant: "destructive",
      });
      return;
    }
    
    const inspectionData = {
      ...data,
      photos,
      damages,
    };

    setIsSubmitting(true);
    
    try {
      await createInspectionMutation.mutateAsync(inspectionData);
    } catch (error) {
      console.error("❌ Erro ao criar vistoria:", error);
      setIsSubmitting(false);
    }
  };

  // Verificação de segurança para booking - após todos os hooks
  if (!booking || !booking.id || !booking.vehicleId) {
    console.error("VehicleInspectionForm: booking inválido", booking);
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600">Erro: Dados da reserva não encontrados</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-6 w-6" />
            Vistoria do Veículo
          </CardTitle>
          <div className="text-sm text-gray-600">
            <p><strong>Veículo:</strong> {booking.vehicle?.brand} {booking.vehicle?.model}</p>
            <p><strong>Placa:</strong> {booking.vehicle?.licensePlate}</p>
            <p><strong>Período:</strong> {new Date(booking.startDate).toLocaleDateString()} a {new Date(booking.endDate).toLocaleDateString()}</p>
          </div>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(
            (data) => {
              console.log("✅ Form validation passed, submitting data:", data);
              onSubmit(data);
            },
            (errors) => {
              console.log("❌ Form validation failed:", errors);
            }
          )}
          className="space-y-6"
        >
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quilometragem</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Ex: 50000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-mileage"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fuelLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Fuel className="h-4 w-4" />
                        Nível de Combustível
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Ex: 30, 50, 75"
                          {...field}
                          data-testid="input-fuel-level"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="vehicleCondition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condição Geral do Veículo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                      >
                        {VEHICLE_CONDITIONS.map((condition) => (
                          <div key={condition.value} className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value={condition.value} 
                              id={condition.value}
                              data-testid={`radio-condition-${condition.value}`}
                            />
                            <Label 
                              htmlFor={condition.value} 
                              className={`cursor-pointer ${condition.color}`}
                            >
                              {condition.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Fotos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CameraIcon className="h-5 w-5" />
                Fotos do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    data-testid="button-add-photo"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Fotos
                  </Button>
                  <input
                    id="photo-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    data-testid="input-photo-upload"
                  />
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                          data-testid={`image-photo-${index}`}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removePhoto(index)}
                          data-testid={`button-remove-photo-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length === 0 && (
                  <div className="text-center text-gray-500 py-8 border-2 border-dashed border-red-300 rounded-lg bg-red-50">
                    <CameraIcon className="h-12 w-12 mx-auto mb-2 text-red-400" />
                    <p className="font-medium text-red-700">Nenhuma foto adicionada ainda</p>
                    <p className="text-sm text-red-600">⚠️ Pelo menos uma foto é obrigatória para finalizar a vistoria</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Danos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danos Identificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addDamage}
                  data-testid="button-add-damage"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Dano
                </Button>

                {damages.map((damage, index) => (
                  <Card key={index} className="border-orange-200">
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">Dano #{index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDamage(index)}
                            data-testid={`button-remove-damage-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Tipo de Dano</Label>
                            <Select
                              onValueChange={(value) => updateDamage(index, 'type', value)}
                              value={damage.type}
                            >
                              <SelectTrigger data-testid={`select-damage-type-${index}`}>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {DAMAGE_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Localização</Label>
                            <Input
                              placeholder="Ex: Para-choque dianteiro"
                              value={damage.location}
                              onChange={(e) => updateDamage(index, 'location', e.target.value)}
                              data-testid={`input-damage-location-${index}`}
                            />
                          </div>

                          <div>
                            <Label>Gravidade</Label>
                            <Select
                              onValueChange={(value) => updateDamage(index, 'severity', value as any)}
                              value={damage.severity}
                            >
                              <SelectTrigger data-testid={`select-damage-severity-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minor">Leve</SelectItem>
                                <SelectItem value="moderate">Moderado</SelectItem>
                                <SelectItem value="severe">Grave</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Descrição</Label>
                          <Textarea
                            placeholder="Descreva o dano em detalhes..."
                            value={damage.description}
                            onChange={(e) => updateDamage(index, 'description', e.target.value)}
                            data-testid={`textarea-damage-description-${index}`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {damages.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Nenhum dano identificado</p>
                    <p className="text-sm">Clique em "Adicionar Dano" se encontrar algum problema</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações Adicionais</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione quaisquer observações sobre a condição do veículo..."
                        className="min-h-24"
                        {...field}
                        data-testid="textarea-observations"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Decisão de Aprovação */}
          <Card>
            <CardHeader>
              <CardTitle>Decisão da Vistoria</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="approvalDecision"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "true")}
                        value={field.value ? "true" : "false"}
                        className="space-y-4"
                      >
                        <div className="flex items-center space-x-2 p-4 border rounded-lg border-green-200 bg-green-50">
                          <RadioGroupItem value="true" id="approve" data-testid="radio-approve" />
                          <Label htmlFor="approve" className="flex items-center gap-2 cursor-pointer">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-800">Aprovar Vistoria</p>
                              <p className="text-sm text-green-600">
                                O veículo está em boas condições e pronto para devolução
                              </p>
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2 p-4 border rounded-lg border-red-200 bg-red-50">
                          <RadioGroupItem value="false" id="reject" data-testid="radio-reject" />
                          <Label htmlFor="reject" className="flex items-center gap-2 cursor-pointer">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <div>
                              <p className="font-medium text-red-800">Reprovar Vistoria</p>
                              <p className="text-sm text-red-600">
                                O veículo apresenta problemas que impedem a devolução
                              </p>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!form.watch("approvalDecision") && (
                <FormField
                  control={form.control}
                  name="rejectionReason"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Motivo da Reprovação</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explique por que a vistoria foi reprovada..."
                          {...field}
                          data-testid="textarea-rejection-reason"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={isSubmitting || createInspectionMutation.isPending}
              className="min-w-32 bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-submit-inspection"
            >
              {isSubmitting || createInspectionMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </div>
              ) : (
                "Finalizar Vistoria"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
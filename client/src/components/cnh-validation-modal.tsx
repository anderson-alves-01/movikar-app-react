import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Upload, CheckCircle, AlertCircle, IdCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CNHValidationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onValidationComplete?: (validated: boolean) => void;
}

export default function CNHValidationModal({ 
  isOpen, 
  onOpenChange, 
  onValidationComplete 
}: CNHValidationModalProps) {
  const [cnhNumber, setCnhNumber] = useState('');
  const [cnhImage, setCnhImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [cnhImagePreview, setCnhImagePreview] = useState<string | null>(null);
  const [selfieImagePreview, setSelfieImagePreview] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (data: {
      cnhNumber: string;
      cnhImage: File;
      selfieImage: File;
    }) => {
      const formData = new FormData();
      formData.append('cnhNumber', data.cnhNumber);
      formData.append('cnhImage', data.cnhImage);
      formData.append('selfieImage', data.selfieImage);

      return await apiRequest('POST', '/api/user/validate-cnh', formData);
    },
    onSuccess: () => {
      toast({
        title: "CNH Enviada com Sucesso",
        description: "Sua CNH e selfie foram enviadas para validação. Você receberá uma notificação quando a análise estiver concluída.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      onValidationComplete?.(true);
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no Envio",
        description: error.message || "Erro ao enviar documentos. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCnhNumber('');
    setCnhImage(null);
    setSelfieImage(null);
    setCnhImagePreview(null);
    setSelfieImagePreview(null);
    setStep(1);
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    type: 'cnh' | 'selfie'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo Inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo Muito Grande",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'cnh') {
        setCnhImage(file);
        setCnhImagePreview(result);
      } else {
        setSelfieImage(file);
        setSelfieImagePreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const formatCNH = (value: string) => {
    // Remove non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    // Limit to 11 digits
    return cleaned.slice(0, 11);
  };

  const handleCNHChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNH(e.target.value);
    setCnhNumber(formatted);
  };

  const handleSubmit = () => {
    if (!cnhNumber || cnhNumber.length !== 11) {
      toast({
        title: "CNH Inválida",
        description: "Por favor, digite um número de CNH válido com 11 dígitos.",
        variant: "destructive",
      });
      return;
    }

    if (!cnhImage || !selfieImage) {
      toast({
        title: "Imagens Obrigatórias",
        description: "Por favor, envie a foto da CNH e sua selfie.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      cnhNumber,
      cnhImage,
      selfieImage,
    });
  };

  const nextStep = () => {
    if (step === 1) {
      if (!cnhNumber || cnhNumber.length !== 11) {
        toast({
          title: "CNH Obrigatória",
          description: "Por favor, digite um número de CNH válido.",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!cnhImage) {
        toast({
          title: "Foto da CNH Obrigatória",
          description: "Por favor, envie uma foto clara da sua CNH.",
          variant: "destructive",
        });
        return;
      }
      setStep(3);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <IdCard className="h-5 w-5 text-blue-600" />
            <span>Validação da CNH</span>
          </DialogTitle>
          <DialogDescription>
            Para garantir a segurança de todos, precisamos validar sua CNH.
            Etapa {step} de 3
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cnhNumber">Número da CNH</Label>
                <Input
                  id="cnhNumber"
                  type="text"
                  placeholder="Digite os 11 dígitos da CNH"
                  value={cnhNumber}
                  onChange={handleCNHChange}
                  maxLength={11}
                  data-testid="input-cnh-number"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Digite apenas os números, sem espaços ou pontos
                </p>
                {cnhNumber && cnhNumber.length === 11 && (
                  <div className="flex items-center space-x-2 mt-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">Número válido</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Foto da CNH</Label>
                <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                  <CardContent className="p-6">
                    {cnhImagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={cnhImagePreview}
                          alt="Preview CNH"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCnhImage(null);
                            setCnhImagePreview(null);
                          }}
                        >
                          Trocar Foto
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            Clique para enviar a foto da sua CNH
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG até 5MB
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'cnh')}
                            className="hidden"
                            id="cnh-upload"
                          />
                          <label htmlFor="cnh-upload">
                            <Button variant="outline" size="sm" asChild>
                              <span>Selecionar Arquivo</span>
                            </Button>
                          </label>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <div className="flex items-start space-x-2 mt-2 p-3 bg-blue-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">Dicas para uma boa foto:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Boa iluminação, sem sombras</li>
                      <li>Texto claramente legível</li>
                      <li>CNH completa na imagem</li>
                      <li>Sem reflexos ou borrão</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Sua Selfie</Label>
                <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                  <CardContent className="p-6">
                    {selfieImagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={selfieImagePreview}
                          alt="Preview Selfie"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelfieImage(null);
                            setSelfieImagePreview(null);
                          }}
                        >
                          Trocar Foto
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            Tire uma selfie para validação
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG até 5MB
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            capture="user"
                            onChange={(e) => handleImageChange(e, 'selfie')}
                            className="hidden"
                            id="selfie-upload"
                          />
                          <label htmlFor="selfie-upload">
                            <Button variant="outline" size="sm" asChild>
                              <span>Tirar Selfie</span>
                            </Button>
                          </label>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <div className="flex items-start space-x-2 mt-2 p-3 bg-blue-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">Para uma boa selfie:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Rosto bem visível e centralizado</li>
                      <li>Boa iluminação natural</li>
                      <li>Olhar diretamente para a câmera</li>
                      <li>Sem óculos escuros ou acessórios</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={step === 1 ? () => onOpenChange(false) : prevStep}
          >
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </Button>
          
          {step < 3 ? (
            <Button onClick={nextStep}>
              Próximo
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={uploadMutation.isPending}
              data-testid="button-submit-cnh"
            >
              {uploadMutation.isPending ? 'Enviando...' : 'Enviar Validação'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
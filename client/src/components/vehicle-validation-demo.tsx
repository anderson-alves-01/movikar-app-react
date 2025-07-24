import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Shield, AlertTriangle } from "lucide-react";

export default function VehicleValidationDemo() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testValidation = async () => {
    setIsLoading(true);
    setValidationResult(null);

    try {
      // Simula validação seguindo as regras implementadas
      const errors = [];
      
      // Validações do modelo
      if (!model || model.trim().length === 0) {
        errors.push({ field: "model", message: "Modelo é obrigatório" });
      } else if (model.length < 2) {
        errors.push({ field: "model", message: "Modelo deve ter pelo menos 2 caracteres" });
      } else if (model.length > 50) {
        errors.push({ field: "model", message: "Modelo não pode ter mais de 50 caracteres" });
      } else if (!/^[a-zA-Z0-9\s\-\.\/]+$/.test(model)) {
        errors.push({ field: "model", message: "Modelo contém caracteres inválidos. Use apenas letras, números, espaços, hífens e pontos" });
      } else if (/^[0-9]+$/.test(model)) {
        errors.push({ field: "model", message: "Modelo não pode ser apenas números" });
      } else if (/(test|teste|lixo|xxx|aaa|zzz|qwe|asdf|spam|fake|invalid)/i.test(model)) {
        errors.push({ field: "model", message: "Modelo contém palavras inválidas ou de teste" });
      }

      // Validações da marca
      if (!brand || brand.trim().length === 0) {
        errors.push({ field: "brand", message: "Marca é obrigatória" });
      } else if (brand.length > 30) {
        errors.push({ field: "brand", message: "Marca não pode ter mais de 30 caracteres" });
      } else if (!/^[a-zA-Z0-9\s\-]+$/.test(brand)) {
        errors.push({ field: "brand", message: "Marca contém caracteres inválidos. Use apenas letras, números, espaços e hífens" });
      } else if (/(test|teste|lixo|xxx|aaa|zzz)/i.test(brand)) {
        errors.push({ field: "brand", message: "Marca contém palavras inválidas" });
      }

      if (errors.length === 0) {
        setValidationResult({
          success: true,
          message: `✅ Dados válidos! Veículo ${brand.trim()} ${model.trim()} passaria na validação.`,
          data: { brand: brand.trim(), model: model.trim() }
        });
      } else {
        setValidationResult({
          success: false,
          message: "❌ Dados inválidos detectados:",
          errors: errors
        });
      }
    } catch (error) {
      setValidationResult({
        success: false,
        message: "Erro ao testar validação",
        errors: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testCases = [
    { brand: "Honda", model: "Civic", expected: "✅ Válido" },
    { brand: "Toyota", model: "Corolla", expected: "✅ Válido" },
    { brand: "Honda", model: "teste", expected: "❌ Palavra proibida" },
    { brand: "Ford", model: "123", expected: "❌ Apenas números" },
    { brand: "BMW", model: "xxx", expected: "❌ Palavra proibida" },
    { brand: "Volkswagen", model: "Golf", expected: "✅ Válido" },
    { brand: "Fiat", model: "lixo", expected: "❌ Palavra proibida" },
    { brand: "Chevrolet", model: "A", expected: "❌ Muito curto" },
    { brand: "Nissan", model: "Modelo@#$", expected: "❌ Caracteres inválidos" }
  ];

  const quickTest = (testBrand: string, testModel: string) => {
    setBrand(testBrand);
    setModel(testModel);
    setTimeout(() => testValidation(), 100);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Sistema de Validação - Campo Modelo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Teste Manual */}
        <div className="space-y-4">
          <h3 className="font-semibold">Teste Manual</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Honda"
              />
            </div>
            
            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: Civic"
              />
            </div>
          </div>

          <Button 
            onClick={testValidation}
            disabled={isLoading || !brand || !model}
            className="w-full"
          >
            {isLoading ? "Testando..." : "Testar Validação"}
          </Button>

          {validationResult && (
            <Alert className={validationResult.success ? "border-green-500" : "border-red-500"}>
              {validationResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{validationResult.message}</p>
                  {validationResult.errors && validationResult.errors.length > 0 && (
                    <div className="space-y-1">
                      {validationResult.errors.map((error: any, index: number) => (
                        <p key={index} className="text-sm text-red-600">
                          • {error.field}: {error.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Casos de Teste */}
        <div className="space-y-4">
          <h3 className="font-semibold">Casos de Teste</h3>
          <div className="space-y-2">
            {testCases.map((testCase, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                   onClick={() => quickTest(testCase.brand, testCase.model)}>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{testCase.brand}</span>
                  <span className="text-gray-600">{testCase.model}</span>
                </div>
                <span className="text-sm">{testCase.expected}</span>
              </div>
            ))}
            <p className="text-xs text-gray-500 mt-2">💡 Clique em qualquer caso para testar automaticamente</p>
          </div>
        </div>

        {/* Regras de Validação */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Regras de Validação
          </h3>
          <div className="text-sm space-y-2 bg-blue-50 p-4 rounded-lg">
            <p><strong>Campo Modelo:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Mínimo 2 caracteres, máximo 50</li>
              <li>Apenas letras, números, espaços, hífens e pontos</li>
              <li>Não pode ser apenas números</li>
              <li>Não pode conter palavras proibidas (teste, lixo, xxx, etc.)</li>
              <li>Remove espaços extras automaticamente</li>
              <li>Valida se modelo existe para a marca (banco de dados interno)</li>
            </ul>
            <p className="mt-3"><strong>Prevenção de lixo na base:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Rejeita dados de teste e spam</li>
              <li>Normaliza formatação automaticamente</li>
              <li>Log de auditoria para rastreabilidade</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
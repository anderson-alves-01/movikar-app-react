import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, HelpCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-lg mx-4">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-6">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Página não encontrada</h1>
          <p className="text-lg text-gray-600 mb-2">Erro 404</p>
          
          <p className="mt-4 text-sm text-gray-600 mb-8">
            A página que você está procurando não existe ou foi movida.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild data-testid="button-home">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Voltar ao início
              </Link>
            </Button>
            
            <Button asChild variant="outline" data-testid="button-support">
              <Link href="/support">
                <HelpCircle className="h-4 w-4 mr-2" />
                Central de Suporte
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

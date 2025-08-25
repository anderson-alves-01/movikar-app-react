import { FileText, AlertTriangle, Shield, Gavel, Users, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <FileText className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Termos de Uso
            </h1>
            <p className="text-gray-600">alugae.mobi</p>
            <p className="text-sm text-gray-500 mt-2">
              Última atualização: 20 de agosto de 2025
            </p>
          </div>

          <div className="space-y-8">
            {/* Introdução */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2 text-blue-600" />
                  Bem-vindo ao alugae.mobi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Seja bem-vindo ao alugae.mobi, a plataforma digital que conecta locadores e locatários de veículos de forma prática, acessível e transparente. Ao utilizar nossos serviços, você declara estar ciente e de acordo com as regras e condições descritas nestes Termos de Uso.
                </p>
              </CardContent>
            </Card>

            {/* Objeto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gavel className="h-5 w-5 mr-2 text-green-600" />
                  1. Objeto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">
                  O alugae.mobi disponibiliza uma solução tecnológica para facilitar a exposição de veículos para locação e o contato entre locadores e locatários. Ressaltamos que:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Não somos proprietários dos veículos anunciados</li>
                  <li>Não participamos diretamente das negociações entre usuários</li>
                  <li>Atuamos como intermediadores tecnológicos</li>
                  <li>Facilitamos o contato e a comunicação entre as partes</li>
                </ul>
              </CardContent>
            </Card>

            {/* Responsabilidades dos Usuários */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  2. Responsabilidades dos Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Locadores (Proprietários)</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>Fornecer informações verdadeiras sobre o veículo</li>
                      <li>Manter documentação em dia</li>
                      <li>Garantir que o veículo está em condições de uso</li>
                      <li>Responder às solicitações em tempo hábil</li>
                      <li>Cumprir com os acordos estabelecidos</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Locatários (Inquilinos)</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>Possuir CNH válida e dentro do prazo</li>
                      <li>Tratar o veículo com cuidado e responsabilidade</li>
                      <li>Devolver o veículo nas condições acordadas</li>
                      <li>Cumprir com os prazos e condições de locação</li>
                      <li>Informar imediatamente sobre qualquer problema</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proibições */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  3. Condutas Proibidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">É expressamente proibido:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Fornecer informações falsas ou enganosas</li>
                  <li>Utilizar a plataforma para atividades ilegais</li>
                  <li>Danificar, hackear ou interferir no sistema</li>
                  <li>Criar múltiplas contas para o mesmo usuário</li>
                  <li>Assediar, ameaçar ou desrespeitar outros usuários</li>
                  <li>Utilizar linguagem ofensiva ou discriminatória</li>
                  <li>Negociar fora da plataforma para evitar taxas</li>
                </ul>
              </CardContent>
            </Card>

            {/* Pagamentos e Taxas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  4. Sistema de Moedas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    O alugae.mobi utiliza um sistema de moedas (coins) para acessar informações de contato:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>200 moedas são necessárias para desbloquear contato do proprietário</li>
                    <li>Usuários recebem 300 moedas gratuitas após validação de documentos</li>
                    <li>Compra mínima: 200 moedas</li>
                    <li>1 moeda = R$ 0,01 (para descontos)</li>
                    <li>Moedas podem ser usadas para descontos em assinaturas</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Limitação de Responsabilidade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-orange-600" />
                  5. Limitação de Responsabilidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">
                  O alugae.mobi não se responsabiliza por:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Danos causados durante a locação do veículo</li>
                  <li>Inadimplência ou descumprimento de acordos entre usuários</li>
                  <li>Veracidade das informações fornecidas pelos usuários</li>
                  <li>Problemas mecânicos ou defeitos dos veículos</li>
                  <li>Acidentes ou infrações de trânsito</li>
                  <li>Disputas entre locadores e locatários</li>
                </ul>
              </CardContent>
            </Card>

            {/* Modificações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  6. Modificações dos Termos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. As alterações entrarão em vigor imediatamente após sua publicação na plataforma. É responsabilidade do usuário verificar periodicamente por atualizações.
                </p>
              </CardContent>
            </Card>

            {/* Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2 text-purple-600" />
                  7. Contato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">
                  Para dúvidas sobre estes Termos de Uso:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> suporte@alugae.mobi</p>
                  <p><strong>Telefone:</strong> (11) 99999-9999</p>
                  <p><strong>Endereço:</strong> São Paulo, SP - Brasil</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8 pt-8 border-t">
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90">
                Voltar ao Início
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
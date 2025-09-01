import { Shield, Info, FileText, Eye, User, Phone, Trash2, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Política de Privacidade
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
                  Introdução
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  O alugae.mobi valoriza a confiança dos usuários e se compromete a proteger a privacidade e os dados pessoais de todos que utilizam a plataforma. Esta Política de Privacidade explica, de forma clara e transparente, como coletamos, utilizamos, armazenamos e protegemos suas informações, em conformidade com a Lei nº 13.709/2018 (LGPD).
                </p>
                <p className="text-gray-700 mt-3">
                  Ao utilizar o alugae.mobi, você declara estar ciente e de acordo com as práticas descritas nesta Política.
                </p>
              </CardContent>
            </Card>

            {/* Dados Coletados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Dados Coletados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Dados Pessoais
                    </h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-6">
                      <li>Nome completo, CPF, RG</li>
                      <li>Data de nascimento</li>
                      <li>Endereço residencial</li>
                      <li>Email e telefone</li>
                      <li>CNH (Carteira Nacional de Habilitação)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      Dados de Uso
                    </h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-6">
                      <li>Localização (quando autorizado)</li>
                      <li>Histórico de navegação na plataforma</li>
                      <li>Preferências de busca</li>
                      <li>Avaliações e comentários</li>
                      <li>Mensagens trocadas entre usuários</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Dados de Veículos
                    </h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-6">
                      <li>Fotos do veículo</li>
                      <li>Documentação do veículo (CRLV)</li>
                      <li>Características técnicas</li>
                      <li>Histórico de locações</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Como Usamos os Dados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-purple-600" />
                  Como Usamos os Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Facilitar a conexão entre locadores e locatários</li>
                  <li>Verificar identidade e autenticidade dos documentos</li>
                  <li>Processar pagamentos de forma segura</li>
                  <li>Melhorar a experiência do usuário</li>
                  <li>Fornecer suporte ao cliente</li>
                  <li>Enviar notificações sobre reservas e atualizações</li>
                  <li>Cumprir obrigações legais e regulamentares</li>
                </ul>
              </CardContent>
            </Card>

            {/* Compartilhamento de Dados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-orange-600" />
                  Compartilhamento de Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">
                  Seus dados pessoais não são vendidos ou compartilhados com terceiros para fins comerciais. Compartilhamos informações apenas:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Com outros usuários durante o processo de locação (nome, foto, avaliações)</li>
                  <li>Com prestadores de serviços essenciais (pagamentos, SMS, email)</li>
                  <li>Quando exigido por lei ou autoridades competentes</li>
                  <li>Em caso de fusão, aquisição ou venda da empresa</li>
                </ul>
              </CardContent>
            </Card>

            {/* Seus Direitos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-red-600" />
                  Seus Direitos (LGPD)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Acesso:</strong> Solicitar cópia dos seus dados pessoais</li>
                  <li><strong>Correção:</strong> Solicitar correção de dados incorretos</li>
                  <li><strong>Exclusão:</strong> Solicitar exclusão dos seus dados</li>
                  <li><strong>Portabilidade:</strong> Solicitar transferência dos dados</li>
                  <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
                  <li><strong>Informação:</strong> Saber com quem compartilhamos seus dados</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Para exercer seus direitos, entre em contato através do email: 
                  <span className="font-semibold"> privacidade@alugae.mobi</span>
                </p>

                {/* Exclusão de Conta */}
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center text-red-800">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Exclusão de Conta e Dados
                  </h4>
                  <p className="text-red-700 text-sm mb-3">
                    Você pode solicitar a exclusão permanente da sua conta e de todos os seus dados pessoais a qualquer momento.
                  </p>
                  <a 
                    href="mailto:privacidade@alugae.mobi?subject=Solicitação de Exclusão de Conta&body=Olá,%0D%0A%0D%0ADesejo solicitar a exclusão permanente da minha conta e de todos os meus dados pessoais da plataforma alugae.mobi.%0D%0A%0D%0ANome:%0D%0AEmail cadastrado:%0D%0ACPF:%0D%0A%0D%0AAtenciosamente"
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                    data-testid="link-account-deletion"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Solicitar Exclusão de Conta
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Segurança */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  Segurança dos Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição, incluindo:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3">
                  <li>Criptografia de dados sensíveis</li>
                  <li>Autenticação de dois fatores</li>
                  <li>Monitoramento contínuo de segurança</li>
                  <li>Treinamento da equipe em proteção de dados</li>
                  <li>Auditorias regulares de segurança</li>
                </ul>
              </CardContent>
            </Card>

            {/* Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-blue-600" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">
                  Para dúvidas sobre esta Política de Privacidade ou exercer seus direitos:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> privacidade@alugae.mobi</p>
                  <p><strong>Suporte:</strong> suporte@alugae.mobi</p>
                  <p><strong>Telefone:</strong> (11) 99999-9999</p>
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
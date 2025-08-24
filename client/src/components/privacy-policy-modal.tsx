import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Shield, Info, FileText } from "lucide-react";

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export default function PrivacyPolicyModal({ open, onOpenChange, onAccept }: PrivacyPolicyModalProps) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      onAccept();
      onOpenChange(false);
      setAccepted(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" data-testid="privacy-policy-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Política de Privacidade - alugae.mobi
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6 text-sm text-gray-700">
            
            {/* Cabeçalho */}
            <div className="text-center mb-6">
              <p className="text-xs text-gray-500 mb-2">Última atualização: 20/08/2025</p>
              <p className="text-gray-700">
                O Alugae valoriza a confiança dos usuários e se compromete a proteger a privacidade e os dados pessoais de todos que utilizam a plataforma. Esta Política de Privacidade explica, de forma clara e transparente, como coletamos, utilizamos, armazenamos e protegemos suas informações, em conformidade com a Lei nº 13.709/2018 (LGPD).
              </p>
              <p className="text-gray-700 mt-2">
                Ao utilizar o Alugae, você declara estar ciente e de acordo com as práticas descritas nesta Política.
              </p>
            </div>

            {/* Seção 1 - Quais dados coletamos? */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-600" />
                1. Quais dados coletamos?
              </h3>
              <p className="mb-3">
                O Alugae coleta apenas as informações necessárias para o funcionamento da plataforma e a segurança das transações.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Dados de cadastro:</strong> nome completo, CPF/CNPJ, e-mail, telefone, senha de acesso.</li>
                <li><strong>Dados de veículos (para locadores):</strong> marca, modelo, ano, placa, documentação, RENAVAM, fotos e informações adicionais do veículo.</li>
                <li><strong>Dados de uso:</strong> histórico de anúncios, locações realizadas, interações e preferências dentro do aplicativo.</li>
                <li><strong>Dados de pagamento:</strong> informações processadas via Stripe, como valores pagos, datas e métodos de pagamento. O Alugae não armazena dados completos de cartão de crédito, apenas tokens criptografados enviados pela operadora.</li>
                <li><strong>Dados de geolocalização:</strong> coletados apenas se o usuário autorizar, para exibir anúncios próximos.</li>
                <li><strong>Dados técnicos:</strong> endereço IP, tipo de dispositivo, sistema operacional e navegador utilizado.</li>
              </ul>
            </section>

            {/* Seção 2 - Para que utilizamos seus dados? */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                2. Para que utilizamos seus dados?
              </h3>
              <p className="mb-3">
                Os dados coletados têm como finalidade:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Criar e manter a conta do usuário.</li>
                <li>Permitir a publicação de anúncios e a busca por veículos.</li>
                <li>Garantir a segurança e autenticação dos acessos.</li>
                <li>Processar pagamentos com segurança via Stripe.</li>
                <li>Cumprir obrigações legais e regulatórias.</li>
                <li>Melhorar a experiência do usuário por meio de personalização e recomendações.</li>
                <li>Prevenir fraudes, acessos indevidos e uso indevido da plataforma.</li>
                <li>Realizar análises estatísticas e de desempenho da plataforma (sempre de forma anônima).</li>
              </ul>
            </section>

            {/* Seção 3 - Compartilhamento de informações */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-purple-600" />
                3. Compartilhamento de informações
              </h3>
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-3">
                <p className="font-medium text-purple-900">
                  O Alugae não vende e não comercializa dados pessoais de seus usuários.
                </p>
              </div>
              <p className="mb-3">
                Os dados poderão ser compartilhados apenas nos seguintes casos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Com prestadores de serviço essenciais:</strong> como meios de pagamento (Stripe), hospedagem de dados e ferramentas de segurança digital.</li>
                <li><strong>Com autoridades públicas:</strong> sempre que houver obrigação legal, ordem judicial ou solicitação de autoridade competente.</li>
                <li><strong>Com parceiros de segurança:</strong> em situações de investigação de fraude, uso indevido ou crimes cibernéticos.</li>
              </ul>
              <p className="mt-3 font-medium">
                Em todos os casos, o compartilhamento será limitado ao estritamente necessário.
              </p>
            </section>

            {/* Seção 4 - Como protegemos seus dados */}
            <section className="bg-blue-50 border-2 border-blue-300 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-3 text-blue-800 flex items-center">
                <Shield className="h-6 w-6 mr-2" />
                4. Como protegemos seus dados
              </h3>
              <p className="mb-3 text-blue-800">
                O Alugae adota medidas de segurança compatíveis com as melhores práticas de mercado, incluindo:
              </p>
              <ul className="list-disc list-inside space-y-2 text-blue-700 ml-4">
                <li>Criptografia de dados sensíveis.</li>
                <li>Armazenamento em servidores seguros.</li>
                <li>Monitoramento contínuo contra acessos não autorizados.</li>
                <li>Políticas internas de controle de acesso aos dados.</li>
              </ul>
              <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded">
                <p className="text-blue-900 text-sm">
                  <strong>Importante:</strong> Apesar de todos os cuidados, nenhum sistema digital é 100% imune. Por isso, incentivamos que o usuário também adote medidas de segurança, como não compartilhar senhas e manter dispositivos atualizados.
                </p>
              </div>
            </section>

            {/* Seção 5 - Direitos do usuário (LGPD) */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">5. Direitos do usuário (LGPD)</h3>
              <p className="mb-3">
                De acordo com a LGPD, você possui os seguintes direitos em relação aos seus dados pessoais:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Confirmação da existência de tratamento</strong> – saber se o Alugae possui dados seus.</li>
                <li><strong>Acesso aos dados</strong> – obter uma cópia dos dados armazenados.</li>
                <li><strong>Correção</strong> de dados incompletos, inexatos ou desatualizados.</li>
                <li><strong>Anonimização, bloqueio ou exclusão</strong> de dados desnecessários ou excessivos.</li>
                <li><strong>Portabilidade dos dados</strong> a outro fornecedor de serviço.</li>
                <li><strong>Revogação do consentimento</strong> a qualquer momento, quando o tratamento se basear nele.</li>
                <li><strong>Exclusão da conta</strong> e de todos os dados relacionados, ressalvadas as obrigações legais de armazenamento.</li>
              </ul>
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="text-gray-700 text-sm">
                  Para exercer seus direitos, basta enviar solicitação para o nosso canal de atendimento: <strong>sac.alugae.mobi</strong>
                </p>
              </div>
            </section>

            {/* Seção 6 - Retenção dos dados */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">6. Retenção dos dados</h3>
              <p className="mb-3">
                Os dados pessoais serão mantidos apenas pelo período necessário para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cumprimento das finalidades descritas nesta Política.</li>
                <li>Cumprimento de obrigações legais e regulatórias (ex.: exigências fiscais).</li>
                <li>Preservação de direitos em eventual processo judicial ou administrativo.</li>
              </ul>
              <p className="mt-3">
                Após esse período, os dados serão anonimizados ou excluídos de forma segura.
              </p>
            </section>

            {/* Seção 7 - Uso de cookies e tecnologias similares */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">7. Uso de cookies e tecnologias similares</h3>
              <p className="mb-3">
                O Alugae poderá utilizar cookies e ferramentas de rastreamento para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Manter o usuário autenticado.</li>
                <li>Memorizar preferências de navegação.</li>
                <li>Coletar estatísticas de uso da plataforma.</li>
                <li>Oferecer conteúdo personalizado.</li>
              </ul>
              <p className="mt-3">
                O usuário pode configurar seu navegador para bloquear cookies, mas isso pode impactar o funcionamento da plataforma.
              </p>
            </section>

            {/* Seção 8 - Alterações desta Política */}
            <section className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-yellow-800 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                8. Alterações desta Política
              </h3>
              <p className="text-yellow-800">
                O Alugae pode atualizar esta Política de Privacidade a qualquer momento, especialmente para refletir mudanças legais, regulatórias ou tecnológicas. Sempre que houver alteração relevante, notificaremos os usuários por e-mail ou dentro do aplicativo.
              </p>
            </section>

            {/* Seção 9 - Contato */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">9. Contato</h3>
              <p className="mb-2">
                Em caso de dúvidas ou solicitações relacionadas à privacidade e ao uso de dados, entre em contato:
              </p>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="font-medium text-gray-900">sac.alugae.mobi</p>
              </div>
            </section>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Última atualização: 20/08/2025 • Política de Privacidade do Alugae
              </p>
            </div>
          </div>
        </ScrollArea>
        
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="accept-privacy"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              data-testid="checkbox-accept-privacy"
            />
            <label 
              htmlFor="accept-privacy" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Li e aceito a Política de Privacidade
            </label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-privacy-cancel"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!accepted}
              className="bg-primary hover:bg-red-600"
              data-testid="button-privacy-accept"
            >
              Aceitar Política
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
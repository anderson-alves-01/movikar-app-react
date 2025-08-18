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
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 text-sm text-gray-700">
            
            {/* Seção 1 - Coleta de Dados */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-600" />
                1. COLETA DE INFORMAÇÕES
              </h3>
              <p className="mb-3">
                A plataforma alugae.mobi coleta as seguintes informações dos usuários:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone, localização</li>
                <li><strong>Documentos:</strong> CNH, CPF, RG, comprovante de residência</li>
                <li><strong>Dados dos veículos:</strong> informações técnicas, fotos, documentação</li>
                <li><strong>Dados de navegação:</strong> cookies, logs de acesso, preferências</li>
                <li><strong>Dados de transações:</strong> histórico de reservas e pagamentos</li>
              </ul>
            </section>

            {/* Seção 2 - Uso dos Dados */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                2. USO DAS INFORMAÇÕES
              </h3>
              <p className="mb-3">
                Os dados coletados são utilizados para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Facilitar conexões entre locadores e locatários</li>
                <li>Verificar identidade e documentos dos usuários</li>
                <li>Processar reservas e pagamentos</li>
                <li>Melhorar a experiência na plataforma</li>
                <li>Enviar comunicações importantes sobre reservas</li>
                <li>Cumprir obrigações legais e regulamentações</li>
              </ul>
            </section>

            {/* Seção 3 - Compartilhamento */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-purple-600" />
                3. COMPARTILHAMENTO DE DADOS
              </h3>
              <p className="mb-3">
                Seus dados podem ser compartilhados nas seguintes situações:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Entre usuários:</strong> dados básicos para facilitar a locação</li>
                <li><strong>Prestadores de serviço:</strong> processamento de pagamentos, verificação de documentos</li>
                <li><strong>Autoridades:</strong> quando exigido por lei ou ordem judicial</li>
                <li><strong>Parceiros comerciais:</strong> somente dados não identificáveis para análises</li>
              </ul>
            </section>

            {/* Seção 4 - Segurança */}
            <section className="bg-blue-50 border-2 border-blue-300 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-3 text-blue-800 flex items-center">
                <Shield className="h-6 w-6 mr-2" />
                4. SEGURANÇA DOS DADOS
              </h3>
              <p className="mb-3 text-blue-800">
                <strong>Medidas de proteção implementadas:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-blue-700 ml-4">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Controles de acesso rigorosos</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Auditorias regulares de sistemas</li>
                <li>Treinamento de equipe em proteção de dados</li>
              </ul>
            </section>

            {/* Seção 5 - Direitos do Usuário */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">5. SEUS DIREITOS</h3>
              <p className="mb-3">
                Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Acesso:</strong> conhecer quais dados possuímos sobre você</li>
                <li><strong>Correção:</strong> atualizar dados incompletos ou incorretos</li>
                <li><strong>Exclusão:</strong> solicitar remoção de dados desnecessários</li>
                <li><strong>Portabilidade:</strong> transferir dados para outro serviço</li>
                <li><strong>Oposição:</strong> recusar determinados tratamentos de dados</li>
                <li><strong>Revogação:</strong> retirar consentimento a qualquer momento</li>
              </ul>
            </section>

            {/* Seção 6 - Cookies */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">6. COOKIES E TECNOLOGIAS</h3>
              <p className="mb-3">
                Utilizamos cookies para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Manter preferências de usuário</li>
                <li>Analisar uso da plataforma</li>
                <li>Personalizar conteúdo</li>
                <li>Garantir segurança das sessões</li>
              </ul>
              <p className="mt-3">
                Você pode gerenciar cookies através das configurações do seu navegador.
              </p>
            </section>

            {/* Seção 7 - Alterações */}
            <section className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-yellow-800 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                7. ALTERAÇÕES DESTA POLÍTICA
              </h3>
              <p className="text-yellow-800">
                Esta política pode ser atualizada periodicamente. Alterações significativas serão 
                comunicadas por e-mail ou através de avisos na plataforma.
              </p>
            </section>

            {/* Seção 8 - Contato */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">8. CONTATO</h3>
              <p className="mb-2">
                <strong>Data de última atualização:</strong> 18 de agosto de 2025
              </p>
              <p className="mb-2">
                Para dúvidas sobre esta política ou exercício de direitos:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>E-mail:</strong> privacidade@alugae.mobi</li>
                <li><strong>Atendimento:</strong> Através do sistema de suporte da plataforma</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
        
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="accept-privacy"
              checked={accepted}
              onCheckedChange={setAccepted}
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
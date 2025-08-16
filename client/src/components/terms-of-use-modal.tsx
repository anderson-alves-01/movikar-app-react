
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";

interface TermsOfUseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export default function TermsOfUseModal({ open, onOpenChange, onAccept }: TermsOfUseModalProps) {
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" data-testid="terms-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Termo Geral de Uso e Responsabilidade - alugae.mobi
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 text-sm text-gray-700">
            
            {/* Seção 1 - Natureza da Plataforma */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">1. NATUREZA DA PLATAFORMA</h3>
              <p className="mb-3">
                A plataforma alugae.mobi atua exclusivamente como <strong>intermediária</strong> entre locadores e locatários de veículos. 
                Somos apenas um ponto de conexão que permite a visualização de datas indisponíveis dos veículos e 
                a possibilidade de solicitar aluguel informando as datas necessárias.
              </p>
              <p className="mb-3">
                <strong>Importante:</strong> O locatário somente irá receber notificação da intenção de aluguel. 
                A plataforma não firma contratos entre as partes e nem calcula seguros contra acidentes e sinistros.
              </p>
            </section>

            {/* ISENÇÃO DE RESPONSABILIDADE - DESTAQUE PRINCIPAL */}
            <section className="bg-red-50 border-2 border-red-300 p-6 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-8 w-8 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-xl mb-4 text-red-800">2. ISENÇÃO TOTAL DE RESPONSABILIDADE</h3>
                  <div className="bg-red-100 border-2 border-red-400 p-4 rounded-lg mb-4">
                    <p className="font-bold text-red-900 text-center text-lg">
                      A PLATAFORMA NÃO SE RESPONSABILIZA POR:
                    </p>
                  </div>
                  <ul className="list-disc list-inside space-y-2 text-red-800 font-medium">
                    <li><strong>Acidentes</strong> ocorridos durante o período de locação</li>
                    <li><strong>Danos</strong> causados aos veículos ou terceiros</li>
                    <li><strong>Furtos ou roubos</strong> dos veículos</li>
                    <li><strong>Inadimplência</strong> ou descumprimento de acordos entre as partes</li>
                    <li><strong>Problemas</strong> ou sinistros de qualquer natureza</li>
                  </ul>
                  <p className="mt-4 font-medium text-red-800">
                    Toda responsabilidade é <strong>exclusiva das partes envolvidas</strong> (locador e locatário).
                  </p>
                </div>
              </div>
            </section>

            {/* Seção 3 - Cadastro e Informações */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">3. CADASTRO E INFORMAÇÕES</h3>
              <p className="mb-3">Ao se cadastrar na plataforma, você declara e garante:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Fornecer informações <strong>verdadeiras e corretas</strong></li>
                <li>Possuir mais de 18 anos e capacidade jurídica plena</li>
                <li>Manter seus dados sempre atualizados</li>
                <li>Ser responsável pela veracidade de todas as informações fornecidas</li>
              </ul>
            </section>

            {/* Seção 4 - Funcionamento da Plataforma */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">4. FUNCIONAMENTO DA PLATAFORMA</h3>
              <p className="mb-3">O sistema permite:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Visualização de datas indisponíveis</strong> dos veículos cadastrados</li>
                <li><strong>Solicitação de aluguel</strong> através de notificações ao proprietário</li>
                <li><strong>Comunicação direta</strong> entre locador e locatário via chat interno</li>
                <li><strong>Início de negociação</strong> por conversa no app após solicitação</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4">
                <p className="text-yellow-800 font-medium">
                  ⚠️ <strong>Proibição:</strong> É expressamente proibida a negociação de valores fora da plataforma. 
                  O valor do carro é fixo conforme anunciado.
                </p>
              </div>
            </section>

            {/* Seção 5 - Recomendações de Boas Práticas */}
            <section className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-blue-900">5. RECOMENDAÇÕES DE BOAS PRÁTICAS</h3>
              <p className="mb-3 text-blue-800">
                <strong>IMPORTANTE:</strong> As práticas abaixo são recomendações, sem obrigatoriedade, 
                mas fortemente sugeridas para a segurança de todos:
              </p>
              <ul className="list-disc list-inside space-y-2 text-blue-800">
                <li><strong>Contratação de seguro adequado</strong> para o período de locação</li>
                <li><strong>Elaboração de contrato específico</strong> entre locador e locatário</li>
                <li><strong>Registro fotográfico completo</strong> do veículo antes e após a locação</li>
                <li><strong>Conferência da validade da CNH</strong> e documentos do condutor</li>
                <li><strong>Verificação das condições gerais</strong> do veículo (pneus, freios, etc.)</li>
                <li><strong>Definição clara de responsabilidades</strong> em caso de danos</li>
              </ul>
            </section>

            {/* Seção 6 - Processo de Locação */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">6. PROCESSO DE LOCAÇÃO</h3>
              <h4 className="font-medium text-md mb-2 text-gray-800">6.1 Solicitação de Aluguel</h4>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>O interessado visualiza as datas disponíveis do veículo</li>
                <li>Solicita o aluguel informando as datas desejadas</li>
                <li>O proprietário recebe notificação da intenção de aluguel</li>
                <li>As partes iniciam negociação direta via chat da plataforma</li>
              </ul>

              <h4 className="font-medium text-md mb-2 text-gray-800">6.2 Negociação</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Toda negociação é de responsabilidade exclusiva das partes</li>
                <li>O valor base do veículo é fixo conforme anunciado</li>
                <li>Caução e detalhes adicionais devem ser acordados entre as partes</li>
                <li>Local e horário de entrega/devolução devem ser definidos</li>
              </ul>
            </section>

            {/* Seção 7 - Limitações da Plataforma */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">7. LIMITAÇÕES DA PLATAFORMA</h3>
              <p className="mb-3">A plataforma alugae.mobi:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>NÃO</strong> firma contratos entre as partes</li>
                <li><strong>NÃO</strong> calcula ou fornece seguros</li>
                <li><strong>NÃO</strong> intermedia pagamentos</li>
                <li><strong>NÃO</strong> se responsabiliza por sinistros</li>
                <li><strong>NÃO</strong> participa das negociações comerciais</li>
                <li><strong>APENAS</strong> conecta interessados em alugar com proprietários</li>
              </ul>
            </section>

            {/* Seção 8 - Uso da Plataforma */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">8. USO DA PLATAFORMA</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>É necessário ter pelo menos 18 anos para usar os serviços</li>
                <li>É proibido usar a plataforma para atividades ilegais</li>
                <li>Você é responsável por manter a confidencialidade de sua conta</li>
                <li>O uso deve ser feito de forma responsável e respeitosa</li>
              </ul>
            </section>

            {/* Seção 9 - Modificações dos Termos */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">9. MODIFICAÇÕES DOS TERMOS</h3>
              <p>
                Podemos atualizar estes termos periodicamente. Usuários serão notificados sobre mudanças 
                significativas. O uso continuado da plataforma constitui aceite das modificações.
              </p>
            </section>

            {/* Seção 10 - Contato */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">10. CONTATO</h3>
              <p>
                Para dúvidas sobre estes termos, entre em contato através dos canais oficiais da plataforma alugae.mobi.
              </p>
            </section>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Última atualização: {new Date().toLocaleDateString('pt-BR')} • Versão 1.0
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center space-x-3 flex-1">
            <Checkbox
              id="accept-terms"
              checked={accepted}
              onCheckedChange={(value) => setAccepted(value === true)}
              data-testid="accept-terms-checkbox"
            />
            <label htmlFor="accept-terms" className="text-sm text-gray-700">
              Li e aceito integralmente os termos de uso da plataforma
            </label>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-terms"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAccept} 
              disabled={!accepted}
              className="bg-primary hover:bg-red-600"
              data-testid="button-accept-terms"
            >
              Aceitar Termos
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

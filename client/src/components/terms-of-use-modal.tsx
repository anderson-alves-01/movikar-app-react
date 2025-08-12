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
            Termos de Uso - Plataforma alugae.mobi
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 text-sm text-gray-700">
            
            {/* Seção 1 - Aceite dos Termos */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">1. ACEITE DOS TERMOS</h3>
              <p className="mb-3">
                Ao utilizar a plataforma alugae.mobi, você concorda integralmente com estes Termos de Uso. 
                Se você não concorda com qualquer parte destes termos, não deve utilizar nossos serviços.
              </p>
            </section>

            {/* Seção 2 - Definições */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">2. DEFINIÇÕES</h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Plataforma:</strong> O site e aplicativo alugae.mobi</li>
                <li><strong>Locador:</strong> Proprietário do veículo que disponibiliza para aluguel</li>
                <li><strong>Locatário:</strong> Pessoa que aluga o veículo</li>
                <li><strong>Usuário:</strong> Qualquer pessoa que utiliza a plataforma</li>
                <li><strong>Serviços:</strong> Todas as funcionalidades oferecidas pela plataforma</li>
              </ul>
            </section>

            {/* Seção 3 - Uso da Plataforma */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">3. USO DA PLATAFORMA</h3>
              <p className="mb-3">
                A plataforma alugae.mobi atua exclusivamente como intermediadora entre locadores e locatários. 
                Não somos proprietários dos veículos listados nem participamos diretamente das transações de aluguel.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Você deve ter pelo menos 18 anos para usar nossos serviços</li>
                <li>É necessário fornecer informações verdadeiras e atualizadas</li>
                <li>Você é responsável por manter a confidencialidade de sua conta</li>
                <li>É proibido usar a plataforma para atividades ilegais</li>
              </ul>
            </section>

            {/* Seção 4 - Responsabilidades dos Usuários */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">4. RESPONSABILIDADES</h3>
              
              <h4 className="font-medium text-md mb-2 text-gray-800">4.1 Locadores</h4>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>Garantir que o veículo está em condições adequadas de uso</li>
                <li>Possuir toda a documentação legal necessária</li>
                <li>Manter informações atualizadas sobre o veículo</li>
                <li>Realizar vistoria adequada antes e após o aluguel</li>
              </ul>

              <h4 className="font-medium text-md mb-2 text-gray-800">4.2 Locatários</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Possuir habilitação válida e adequada para o veículo</li>
                <li>Tratar o veículo com cuidado e responsabilidade</li>
                <li>Devolver o veículo nas condições acordadas</li>
                <li>Cumprir todas as leis de trânsito</li>
              </ul>
            </section>

            {/* Seção 5 - Sistema de Caução */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">5. SISTEMA DE CAUÇÃO</h3>
              <p className="mb-3">
                Cada veículo possui um percentual de caução definido pelo proprietário, calculado sobre o valor da diária:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>A caução é retida no momento da reserva</li>
                <li>Será devolvida integralmente se não houver danos ao veículo</li>
                <li>Pode ser parcial ou totalmente retida em caso de danos</li>
                <li>O proprietário tem até 48h após a devolução para avaliar o veículo</li>
              </ul>
            </section>

            {/* Seção 6 - Vistoria de Veículos */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">6. VISTORIA DE VEÍCULOS</h3>
              <p className="mb-3">
                O processo de vistoria é obrigatório e envolve duas etapas:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Vistoria de Retirada:</strong> Realizada pelo locatário no início do aluguel</li>
                <li><strong>Vistoria de Devolução:</strong> Realizada pelo proprietário após a devolução</li>
                <li>Ambas as vistorias devem ser documentadas com fotos</li>
                <li>Discrepâncias serão analisadas caso a caso</li>
              </ul>
            </section>

            {/* ISENÇÃO DE RESPONSABILIDADE - DESTAQUE */}
            <section className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-3 text-yellow-800">7. ISENÇÃO DE RESPONSABILIDADE</h3>
                  <div className="bg-red-50 border border-red-200 p-3 rounded mb-3">
                    <p className="font-medium text-red-800 text-center">
                      A PLATAFORMA NÃO SE RESPONSABILIZA POR NENHUM DANO DOS VEÍCULOS E NEM POR NENHUM SEGURO, 
                      FICANDO DE RESPONSABILIDADE DAS PARTES ENVOLVIDAS DIRIMIR QUALQUER PROBLEMA OU SINISTRO QUE HOUVER.
                    </p>
                  </div>
                  <ul className="list-disc list-inside space-y-2 text-yellow-700">
                    <li>Não somos responsáveis por acidentes, multas ou danos</li>
                    <li>Não fornecemos seguro para os veículos</li>
                    <li>Todas as questões de seguro devem ser tratadas entre as partes</li>
                    <li>Recomendamos fortemente a contratação de seguro adequado</li>
                    <li>A plataforma atua apenas como intermediadora</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Seção 8 - Pagamentos e Taxas */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">8. PAGAMENTOS E TAXAS</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>A plataforma cobra uma taxa de serviço sobre cada transação</li>
                <li>Os pagamentos são processados através de parceiros confiáveis</li>
                <li>Cancelamentos estão sujeitos às políticas específicas</li>
                <li>Reembolsos seguem procedimentos estabelecidos</li>
              </ul>
            </section>

            {/* Seção 9 - Privacidade */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">9. PRIVACIDADE E DADOS</h3>
              <p className="mb-3">
                Respeitamos sua privacidade e protegemos seus dados pessoais conforme a Lei Geral de Proteção 
                de Dados (LGPD) e nossa Política de Privacidade.
              </p>
            </section>

            {/* Seção 10 - Limitações */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">10. LIMITAÇÕES DO SERVIÇO</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>O serviço é fornecido "como está"</li>
                <li>Não garantimos disponibilidade ininterrupta</li>
                <li>Podem ocorrer manutenções programadas</li>
                <li>Nos reservamos o direito de modificar ou descontinuar recursos</li>
              </ul>
            </section>

            {/* Seção 11 - Modificações */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">11. MODIFICAÇÕES DOS TERMOS</h3>
              <p>
                Podemos atualizar estes termos periodicamente. Usuários serão notificados sobre mudanças 
                significativas. O uso continuado da plataforma constitui aceite das modificações.
              </p>
            </section>

            {/* Seção 12 - Contato */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">12. CONTATO</h3>
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
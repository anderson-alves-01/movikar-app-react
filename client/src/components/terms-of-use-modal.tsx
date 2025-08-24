
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
        
        <ScrollArea className="flex-1 pr-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6 text-sm text-gray-700">
            
            {/* Cabeçalho */}
            <div className="text-center mb-6">
              <p className="text-xs text-gray-500 mb-2">Última atualização: 20/08/2025</p>
              <p className="text-gray-700">
                Seja bem-vindo ao Alugae, a plataforma digital que conecta locadores e locatários de veículos de forma prática, acessível e transparente. Ao utilizar nossos serviços, você declara estar ciente e de acordo com as regras e condições descritas nestes Termos de Uso.
              </p>
            </div>

            {/* Seção 1 - Objeto */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">1. Objeto</h3>
              <p className="mb-3">
                O Alugae disponibiliza uma solução tecnológica para facilitar a exposição de veículos para locação e o contato entre locadores e locatários. Ressaltamos que:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Não somos proprietários dos veículos.</li>
                <li>Não participamos das negociações entre usuários.</li>
                <li>Não assumimos qualquer responsabilidade sobre a qualidade, condições ou uso dos veículos.</li>
                <li>Nosso papel é exclusivamente de intermediador digital, fornecendo infraestrutura de anúncio, comunicação e pagamento.</li>
              </ul>
            </section>

            {/* Seção 2 - Cadastro de Usuários */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">2. Cadastro de Usuários</h3>
              <div className="space-y-3">
                <p><strong>2.1.</strong> O acesso à plataforma depende de cadastro prévio com informações verdadeiras, completas e atualizadas.</p>
                <p><strong>2.2.</strong> O usuário é integralmente responsável pela veracidade dos dados fornecidos.</p>
                <p><strong>2.3.</strong> O Alugae se reserva o direito de suspender ou cancelar contas em caso de fraude, má conduta, informações falsas ou descumprimento destes Termos.</p>
                <p><strong>2.4.</strong> O uso da plataforma por menores de 18 anos é proibido.</p>
              </div>
            </section>

            {/* Seção 3 - Responsabilidades das Partes */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">3. Responsabilidades das Partes</h3>
              <div className="space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-medium text-green-800 mb-2">Locador:</p>
                  <p className="text-green-700">Deve disponibilizar veículo em boas condições, regularizado, licenciado e com documentação em dia.</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-medium text-blue-800 mb-2">Locatário:</p>
                  <p className="text-blue-700">Deve possuir CNH válida e utilizar o veículo dentro da legalidade.</p>
                </div>
                <p className="font-medium">Ambos assumem total responsabilidade por suas obrigações legais, financeiras e contratuais.</p>
              </div>
            </section>

            {/* Seção 4 - Pagamentos e Monetização */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">4. Pagamentos e Monetização</h3>
              <div className="space-y-3">
                <p><strong>4.1.</strong> O contato entre locador e locatário somente é liberado após o pagamento via Stripe, dentro da plataforma.</p>
                <p><strong>4.2.</strong> O preço exibido nos anúncios é definido pelo locador e não pode ser negociado fora do Alugae.</p>
                <p><strong>4.3.</strong> O Alugae oferece planos de assinatura, moedas e destaques que ampliam a visibilidade do anúncio.</p>
                <p><strong>4.4.</strong> Pagamentos realizados não são reembolsáveis após a confirmação.</p>
              </div>
            </section>

            {/* Seção 5 - Planos e Destaques */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">5. Planos e Destaques</h3>
              <p className="mb-3">O Alugae disponibiliza diferentes planos para atender às necessidades dos locadores:</p>
              <div className="grid gap-4 mb-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Básico (Gratuito)</h4>
                  <p className="text-gray-700">Permite anunciar 1 carro, com acesso às funcionalidades básicas da plataforma. Ideal para quem está começando a utilizar o Alugae.</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Premium (R$39,90/mês)</h4>
                  <p className="text-blue-800">Permite anunciar até 3 carros, com direito a destaque "Premium" por 3 dias, relatórios avançados e suporte por e-mail.</p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Enterprise (R$149,90/mês)</h4>
                  <p className="text-purple-800">Permite anunciar carros ilimitados, com direito a destaque "Premium" por 7 dias, integração via API, suporte via WhatsApp e funcionalidades adicionais de gestão de frotas.</p>
                </div>
              </div>
              <p className="mb-3">Além disso, há a opção de adquirir destaques pagos, que aumentam a exposição dos anúncios em posições privilegiadas dentro da plataforma.</p>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-yellow-800 font-medium">
                  ⚠️ Os valores dos planos podem sofrer alterações a qualquer momento, sem aviso prévio. Por isso, é importante sempre considerar o valor exibido na página de compra no momento da contratação, que prevalecerá sobre quaisquer informações anteriores.
                </p>
              </div>
            </section>

            {/* Seção 6 - Limitação de Responsabilidade */}
            <section className="bg-red-50 border-2 border-red-300 p-6 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-8 w-8 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-xl mb-4 text-red-800">6. Limitação de Responsabilidade</h3>
                  <p className="font-bold text-red-900 mb-3">O Alugae não se responsabiliza por:</p>
                  <ul className="list-disc list-inside space-y-2 text-red-800">
                    <li>Qualidade, estado ou disponibilidade do veículo.</li>
                    <li>Multas, infrações, acidentes ou danos durante a locação.</li>
                    <li>Perdas financeiras decorrentes do descumprimento contratual entre as partes.</li>
                    <li>Seguros, coberturas adicionais ou indenizações.</li>
                  </ul>
                  <p className="mt-4 font-medium text-red-800">
                    O uso da plataforma implica plena ciência de que o Alugae é apenas um intermediador e não garante o êxito das transações.
                  </p>
                </div>
              </div>
            </section>

            {/* Seção 7 - Melhores Práticas Recomendadas */}
            <section className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-blue-900">7. Melhores Práticas Recomendadas</h3>
              <p className="mb-4 text-blue-800">
                Embora não sejam obrigatórias, o Alugae recomenda fortemente que os usuários sigam as práticas abaixo para garantir maior segurança e transparência nas transações. Essas práticas não substituem a responsabilidade individual, mas servem como diretrizes para reduzir riscos, evitar conflitos e proteger tanto locadores quanto locatários.
              </p>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-900">🔹 1. Utilizar contrato de locação por escrito</h4>
                  <p className="text-blue-800">Recomendamos que todas as locações sejam formalizadas em contrato particular, contendo dados do locador, locatário e veículo, valores, prazos, responsabilidades e eventuais penalidades. O contrato protege ambas as partes em caso de divergências.</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-900">🔹 2. Registrar fotos e vídeos do veículo antes e depois da entrega</h4>
                  <p className="text-blue-800">O registro fotográfico é uma forma simples de evitar discussões sobre danos. Fotos devem mostrar detalhes externos, internos, quilometragem e estado geral do veículo.</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-900">🔹 3. Conferir documentação e CNH</h4>
                  <p className="text-blue-800">O locador deve exigir a CNH válida do locatário antes da entrega. O locatário deve verificar se o veículo está devidamente licenciado e regularizado.</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-900">🔹 4. Considerar seguro de cobertura</h4>
                  <p className="text-blue-800">Não é obrigatório, mas recomendamos fortemente que seja avaliada a contratação de seguro adicional para cobrir terceiros, acidentes ou imprevistos. Essa medida reduz riscos de prejuízos significativos.</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-900">🔹 5. Estabelecer regras claras de uso</h4>
                  <p className="text-blue-800">Quilometragem permitida, combustível, multas, manutenção e responsabilidade em caso de avaria devem ser definidos previamente. Essas condições podem estar descritas no contrato.</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-900">🔹 6. Utilizar exclusivamente a plataforma para transações financeiras</h4>
                  <p className="text-blue-800">Transações feitas fora do Alugae não têm garantia, registro ou suporte. Isso pode colocar as partes em risco de fraude.</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded">
                <p className="text-blue-900 font-medium text-sm">
                  <strong>Importante:</strong> O não cumprimento dessas práticas não impede o uso da plataforma, mas são uma recomendação para que as negociações sejam mais seguras para ambas as partes.
                </p>
              </div>
            </section>

            {/* Seção 8 - Encerramento de Conta */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">8. Encerramento de Conta</h3>
              <p>
                O usuário pode encerrar sua conta a qualquer momento. O Alugae também poderá suspender ou excluir contas que descumpram os Termos, pratiquem fraude ou utilizem a plataforma de forma ilícita.
              </p>
            </section>

            {/* Seção 9 - Alterações dos Termos */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">9. Alterações dos Termos</h3>
              <p>
                Estes Termos podem ser atualizados periodicamente. O uso contínuo da plataforma implica aceitação das versões mais recentes.
              </p>
            </section>

            {/* Seção 10 - Foro */}
            <section>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">10. Foro</h3>
              <p>
                Fica eleito o foro da cidade de Brasília-DF, com renúncia a qualquer outro, para dirimir litígios decorrentes destes Termos.
              </p>
            </section>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Última atualização: 20/08/2025 • Termos de Uso do Alugae
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-6 pb-4 px-6">
          {/* Checkbox section */}
          <div className="flex items-start space-x-3 mb-6 w-full">
            <Checkbox
              id="accept-terms"
              checked={accepted}
              onCheckedChange={(value) => setAccepted(value === true)}
              data-testid="accept-terms-checkbox"
              className="mt-0.5"
            />
            <label htmlFor="accept-terms" className="text-sm text-gray-700 leading-relaxed flex-1">
              Li e aceito integralmente os termos de uso da plataforma
            </label>
          </div>

          {/* Buttons section - properly aligned */}
          <div className="flex items-center justify-end space-x-3 w-full">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-terms"
              className="px-6 py-2 min-w-[100px] border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAccept} 
              disabled={!accepted}
              className="px-6 py-2 min-w-[140px] bg-gradient-to-r from-primary to-red-500 hover:from-primary/90 hover:to-red-500/90 text-white font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
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

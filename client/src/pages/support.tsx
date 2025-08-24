import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock, 
  Star, 
  Shield, 
  CreditCard, 
  Car, 
  FileText, 
  User,
  AlertCircle,
  CheckCircle2,
  Globe,
  Smartphone,
  ArrowLeft
} from "lucide-react";

export default function Support() {
  const [, navigate] = useLocation();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    priority: "medium"
  });
  const [openAccordionItem, setOpenAccordionItem] = useState<string>("");
  const { toast } = useToast();
  
  // Fetch contact information from admin settings
  const { data: contactInfo } = useQuery({
    queryKey: ['/api/public/contact-info'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Handle anchor navigation on load
  useEffect(() => {
    const handleAnchorNavigation = () => {
      const hash = window.location.hash.substring(1); // Remove the '#'
      if (hash) {
        setTimeout(() => {
          // First, try to expand the accordion item
          setOpenAccordionItem(hash);
          
          // Then scroll to the element
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        }, 100);
      }
    };

    // Run on initial load
    handleAnchorNavigation();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleAnchorNavigation);
    
    return () => {
      window.removeEventListener('hashchange', handleAnchorNavigation);
    };
  }, []);

  // Handle support channel actions
  const handleChannelAction = (channelTitle: string) => {
    const supportEmail = (contactInfo as any)?.supportEmail || "sac@alugae.mobi";
    const supportPhone = (contactInfo as any)?.supportPhone || "(11) 9999-9999";
    
    switch (channelTitle) {
      case "Chat Online":
        // Placeholder for chat functionality - could integrate with Intercom, Zendesk, etc.
        toast({
          title: "Chat em desenvolvimento",
          description: "Em breve você poderá conversar conosco pelo chat online!",
        });
        break;
      case "E-mail":
        window.open(`mailto:${supportEmail}?subject=Suporte alugae.mobi`, "_blank");
        break;
      case "WhatsApp":
        // Remove formatting from phone number for WhatsApp
        const cleanPhone = supportPhone.replace(/\D/g, "");
        const fullNumber = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
        const message = "Olá! Preciso de ajuda com o alugae.mobi";
        const whatsappUrl = `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
        break;
      default:
        break;
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(contactForm)
      });

      if (response.ok) {
        toast({
          title: "Mensagem enviada!",
          description: "Recebemos sua mensagem e responderemos em breve.",
        });
        setContactForm({
          name: "",
          email: "",
          subject: "",
          message: "",
          priority: "medium"
        });
      } else {
        throw new Error('Falha ao enviar mensagem');
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente ou use um dos outros canais de contato.",
        variant: "destructive"
      });
    }
  };

  const faqItems = [
    // Geral
    {
      id: "alugae-locadora",
      category: "Geral",
      question: "O Alugae é uma locadora de carros?",
      answer: "Não. O Alugae é uma plataforma de intermediação. Nós conectamos locadores (pessoas que têm carros disponíveis) com locatários (pessoas que querem alugar). Não possuímos frota própria e não participamos da negociação."
    },
    {
      id: "preco-negociavel",
      category: "Geral",
      question: "O preço do carro pode ser negociado?",
      answer: "Não. O valor exibido no anúncio é definido pelo locador e é fixo. Isso evita discussões e torna o processo mais objetivo."
    },
    {
      id: "como-funciona-aluguel",
      category: "Geral",
      question: "Como funciona o aluguel de carros pela plataforma Alugae?",
      answer: "O Alugae conecta locadores (donos de veículos) a locatários (pessoas que desejam alugar). O locatário compra moedas dentro do app, escolhe o carro de interesse e usa as moedas para liberar o contato do locador. A partir desse momento, as partes tratam diretamente da locação. A plataforma não interfere nas condições de uso do veículo, sendo apenas responsável pela intermediação inicial."
    },
    {
      id: "alugae-garante",
      category: "Geral",
      question: "O Alugae garante o veículo ou o pagamento da locação?",
      answer: "Não. O Alugae atua apenas como facilitador de contato entre locador e locatário. Toda a negociação, contrato, pagamento e uso do veículo é de responsabilidade das partes envolvidas."
    },
    {
      id: "responsabilidade-danos",
      category: "Geral",
      question: "O Alugae é responsável por danos ao veículo ou problemas entre as partes?",
      answer: "Não. A plataforma atua exclusivamente como intermediadora, sem responsabilidade por mau uso, acidentes, multas ou qualquer divergência entre locador e locatário. Para maior segurança, recomendamos contratar seguro e formalizar contrato entre as partes."
    },
    
    // Para Locadores (Proprietários)
    {
      id: "pagar-anunciar",
      category: "Para Proprietários",
      question: "Preciso pagar para anunciar um carro?",
      answer: "Depende. O primeiro carro é gratuito. Se quiser anunciar mais veículos, será necessário contratar um dos planos pagos (Premium ou Enterprise), que oferecem benefícios extras, como relatórios avançados e maior visibilidade dos anúncios."
    },
    {
      id: "documentos-locador",
      category: "Para Proprietários",
      question: "Quais documentos o locador precisa apresentar para anunciar seu carro?",
      answer: "O locador deve fornecer: Documento do veículo atualizado (CRLV) e foto legível do carro."
    },
    {
      id: "planos-disponíveis",
      category: "Para Proprietários",
      question: "Quais são os planos disponíveis para locadores?",
      answer: "O Alugae funciona no modelo freemium, oferecendo diferentes planos: Básico (Gratuito): permite cadastrar até 1 carro, com funcionalidades básicas. Premium (R$39,90/mês): até 3 carros, direito a destaque Premium por 3 dias, relatórios avançados e suporte por e-mail. Enterprise (R$149,90/mês): anúncios ilimitados, destaque Premium por 7 dias, integração via API, suporte via WhatsApp e gestão de frotas."
    },
    {
      id: "mais-carros-gratuito",
      category: "Para Proprietários",
      question: "Posso anunciar mais de um carro no plano gratuito?",
      answer: "Não. O plano gratuito (Básico) permite apenas 1 carro ativo. Para quem deseja anunciar mais veículos, é necessário migrar para o plano Premium ou Enterprise."
    },
    {
      id: "destaque-anuncio",
      category: "Para Proprietários",
      question: "O que significa colocar um anúncio em 'Destaque'?",
      answer: "Anúncios destacados aparecem no topo da lista de resultados. É possível destacar um anúncio na página inicial ou em uma categoria específica, pagando um valor adicional por tempo limitado."
    },
    {
      id: "alterar-plano",
      category: "Para Proprietários",
      question: "Posso alterar meu plano de assinatura a qualquer momento?",
      answer: "Sim. Você pode fazer upgrade ou downgrade do seu plano de acordo com suas necessidades. A mudança passa a valer na próxima cobrança, conforme o ciclo contratado."
    },
    {
      id: "preco-negociavel-locador",
      category: "Para Proprietários",
      question: "O preço dos anúncios é negociável entre locador e locatário?",
      answer: "Não. O valor exibido no anúncio é fixo e não pode ser alterado ou negociado entre as partes."
    },
    
    // Para Locatários
    {
      id: "compra-moedas",
      category: "Para Locatários",
      question: "Como funciona a compra de moedas?",
      answer: "O usuário adquire moedas dentro do app, utilizando o sistema seguro de pagamentos Stripe. Cada vez que desejar liberar o contato de um locador, basta utilizar suas moedas."
    },
    {
      id: "o-que-sao-moedas",
      category: "Para Locatários",
      question: "O que são as moedas e como elas funcionam?",
      answer: "As moedas são a forma de liberar o contato do locador dentro da plataforma. O locatário compra moedas e, ao utilizá-las, tem acesso ao telefone do anúncio escolhido para finalizar a negociação diretamente com o dono do carro."
    },
    {
      id: "estorno-moedas",
      category: "Para Locatários",
      question: "Posso estornar a compra de moedas?",
      answer: "Não. As moedas compradas não são reembolsáveis. Por isso, é importante avaliar bem antes de realizar a compra."
    },
    {
      id: "moedas-expiram",
      category: "Para Locatários",
      question: "Minhas moedas expiram?",
      answer: "Não. As moedas não têm prazo de validade e podem ser utilizadas a qualquer momento, desde que a conta do usuário esteja ativa e regular."
    },
    {
      id: "documentos-locatario",
      category: "Para Locatários",
      question: "Quais documentos o locatário precisa apresentar para alugar um carro?",
      answer: "O locatário deve possuir CNH válida e em seu nome, além de enviar foto legível do documento no momento da solicitação de contato. Sem esse envio, não será possível prosseguir."
    },
    {
      id: "valor-negociavel",
      category: "Para Locatários",
      question: "O valor do aluguel pode ser negociado diretamente com o dono do carro?",
      answer: "Não. O preço exibido na plataforma é fixo e inegociável, garantindo transparência e evitando divergências."
    },
    {
      id: "pagamento-aluguel",
      category: "Para Locatários",
      question: "Como funciona o pagamento do aluguel?",
      answer: "O pagamento é feito direto para o proprietário após a negociação de datas e local de entrega do carro dentro do app."
    },
    {
      id: "reembolso-problema",
      category: "Para Locatários",
      question: "A plataforma faz reembolso em caso de problema na locação?",
      answer: "Não. O Alugae atua apenas como intermediador entre locadores e locatários. Reforçamos a importância das melhores práticas recomendadas (como seguro, contrato e verificação de documentos) para garantir a segurança da negociação."
    },
    
    // Suporte e Conta
    {
      id: "excluir-conta",
      category: "Suporte e Conta",
      question: "Como faço para excluir minha conta?",
      answer: "Você pode solicitar a exclusão da sua conta diretamente pelo aplicativo, na área de configurações do perfil. A exclusão é definitiva e remove todas as informações associadas, incluindo anúncios ativos. Recomendamos concluir ou cancelar eventuais locações antes de solicitar a exclusão."
    },
    {
      id: "reativar-conta",
      category: "Suporte e Conta",
      question: "Posso reativar minha conta depois de excluí-la?",
      answer: "Não. A exclusão da conta é permanente. Caso queira voltar a usar a plataforma, será necessário criar um novo cadastro."
    },
    {
      id: "contato-suporte",
      category: "Suporte e Conta",
      question: "Como entro em contato com o suporte do Alugae?",
      answer: "Você pode falar com nossa equipe pela página de contato do site ou diretamente pelo aplicativo, na aba de suporte. O tempo de resposta varia conforme o plano de assinatura do locador."
    }
  ];

  const supportChannels = [
    {
      icon: MessageCircle,
      title: "Chat Online",
      description: "Atendimento direto pelo aplicativo",
      availability: "24/7",
      action: "Abrir Chat"
    },
    {
      icon: Mail,
      title: "E-mail",
      description: (contactInfo as any)?.supportEmail || "sac@alugae.mobi",
      availability: "Resposta em até 24h",
      action: "Enviar E-mail"
    },
    {
      icon: Phone,
      title: "WhatsApp",
      description: (contactInfo as any)?.supportPhone || "(11) 9999-9999",
      availability: "Seg-Sex: 8h às 22h",
      action: "Enviar Mensagem"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            
            <h1 className="text-xl font-semibold text-gray-900">Central de Suporte</h1>
            
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Como podemos ajudar?</h2>
          <p className="text-xl text-red-100">
            Estamos aqui para ajudar você a ter a melhor experiência no alugae.mobi
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Contact Channels */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Canais de Atendimento
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {supportChannels.map((channel, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <channel.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <CardTitle>{channel.title}</CardTitle>
                  <CardDescription>{channel.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {channel.availability}
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => handleChannelAction(channel.title)}
                      data-testid={`button-${channel.action.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {channel.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Perguntas Frequentes
          </h2>
          
          {/* FAQ Categories Navigation */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {["Geral", "Para Proprietários", "Para Locatários", "Suporte e Conta"].map((category) => (
              <Button
                key={category}
                variant="outline"
                onClick={() => document.getElementById(`category-${category.toLowerCase().replace(/\s+/g, '-')}`)?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* FAQ by Categories */}
          {["Geral", "Para Proprietários", "Para Locatários", "Suporte e Conta"].map((category) => (
            <Card key={category} className="mb-6" id={`category-${category.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion 
                  type="single" 
                  collapsible 
                  className="w-full"
                  value={openAccordionItem}
                  onValueChange={setOpenAccordionItem}
                >
                  {faqItems
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <AccordionItem key={item.id} value={item.id} id={item.id}>
                        <AccordionTrigger className="text-left hover:text-red-600">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-gray-600 leading-relaxed">
                            {item.answer}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Status and Updates */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Status do Sistema
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                  Serviços Operacionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Aplicativo Mobile</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Site Web</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pagamentos</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Notificações</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 text-blue-600 mr-2" />
                  Últimas Atualizações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="font-medium">Nova versão do app</p>
                  <p className="text-sm text-gray-600">Melhorias na vistoria digital e interface</p>
                  <p className="text-xs text-gray-500">18/08/2025</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="font-medium">Sistema de pagamentos</p>
                  <p className="text-sm text-gray-600">Novos métodos de pagamento disponíveis</p>
                  <p className="text-xs text-gray-500">15/08/2025</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Form */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Envie sua Mensagem
          </h2>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Formulário de Contato</CardTitle>
              <CardDescription>
                Descreva seu problema ou dúvida e entraremos em contato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Seu nome completo"
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      required
                      data-testid="input-email"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="subject">Assunto</Label>
                  <Input
                    id="subject"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Resumo do seu problema ou dúvida"
                    required
                    data-testid="input-subject"
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <select
                    id="priority"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={contactForm.priority}
                    onChange={(e) => setContactForm(prev => ({ ...prev, priority: e.target.value }))}
                    data-testid="select-priority"
                  >
                    <option value="low">Baixa - Dúvida geral</option>
                    <option value="medium">Média - Problema no app</option>
                    <option value="high">Alta - Problema com pagamento</option>
                    <option value="urgent">Urgente - Problema durante aluguel</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Descreva detalhadamente sua dúvida ou problema..."
                    rows={5}
                    required
                    data-testid="textarea-message"
                  />
                </div>

                <Button type="submit" className="w-full" data-testid="button-submit-contact">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Additional Resources */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Recursos Adicionais
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Termos de Uso</h3>
                <p className="text-sm text-gray-600">
                  Consulte nossos termos e condições
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Política de Privacidade</h3>
                <p className="text-sm text-gray-600">
                  Como protegemos seus dados
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <CreditCard className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Política de Pagamentos</h3>
                <p className="text-sm text-gray-600">
                  Informações sobre pagamentos e reembolsos
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <Car className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Guia do Usuário</h3>
                <p className="text-sm text-gray-600">
                  Tutorial completo da plataforma
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* App Information */}
        <section className="bg-white rounded-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Sobre o alugae.mobi
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Smartphone className="h-6 w-6 mr-2 text-blue-600" />
                Informações do App
              </h3>
              <div className="space-y-3 text-gray-600">
                <p><strong>Versão atual:</strong> 2.1.0</p>
                <p><strong>Compatibilidade:</strong> iOS 14.0+ / Android 8.0+</p>
                <p><strong>Tamanho:</strong> ~25 MB</p>
                <p><strong>Última atualização:</strong> 18 de Agosto, 2025</p>
                <p><strong>Desenvolvedor:</strong> alugae.mobi</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Globe className="h-6 w-6 mr-2 text-green-600" />
                Informações da Empresa
              </h3>
              <div className="space-y-3 text-gray-600">
                <p><strong>CNPJ:</strong> 00.000.000/0001-00</p>
                <p><strong>Razão Social:</strong> Alugae Tecnologia Ltda</p>
                <p><strong>Endereço:</strong> São Paulo, SP</p>
                <p><strong>Site:</strong> https://alugae.mobi</p>
                <p><strong>E-mail:</strong> {(contactInfo as any)?.supportEmail || "contato@alugae.mobi"}</p>
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Footer */}
        <footer className="text-center text-gray-600">
          <p className="mb-4">
            © 2025 alugae.mobi - Todos os direitos reservados
          </p>
          <div className="flex justify-center items-center space-x-4">
            <span className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-green-600 mr-1" />
              Sistema seguro
            </span>
            <span className="flex items-center">
              <Shield className="h-4 w-4 text-blue-600 mr-1" />
              Dados protegidos
            </span>
            <span className="flex items-center">
              <Star className="h-4 w-4 text-yellow-600 mr-1" />
              Suporte 24/7
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
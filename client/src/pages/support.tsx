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
    switch (channelTitle) {
      case "Chat Online":
        // Placeholder for chat functionality - could integrate with Intercom, Zendesk, etc.
        toast({
          title: "Chat em desenvolvimento",
          description: "Em breve você poderá conversar conosco pelo chat online!",
        });
        break;
      case "E-mail":
        window.open("mailto:suporte@alugae.mobi?subject=Suporte alugae.mobi", "_blank");
        break;
      case "WhatsApp":
        const whatsappNumber = "5561995098662";
        const message = "Olá! Preciso de ajuda com o alugae.mobi";
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
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
    // Para Locatários
    {
      id: "como-alugar",
      category: "Para Locatários",
      question: "Como alugar um veículo?",
      answer: "Pesquise veículos disponíveis na sua região, selecione as datas, revise os detalhes do aluguel, efetue o pagamento e aguarde a confirmação do proprietário. Após confirmação, você receberá instruções para retirada do veículo."
    },
    {
      id: "seguros",
      category: "Para Locatários", 
      question: "Como funciona o seguro dos veículos?",
      answer: "É recomendado que o proprietario possua seguro próprio para evitar transtornos. Verifique sempre se o veículo possui seguro válido antes de confirmar o aluguel."
    },
    {
      id: "documentos-necessarios",
      category: "Para Locatários",
      question: "Quais documentos preciso para alugar?",
      answer: "CNH válida, documento de identidade (RG ou CPF) e cartão de crédito para caução. Alguns proprietários podem solicitar documentos adicionais como comprovante de renda ou residência."
    },
    {
      id: "faq-geral",
      category: "Para Locatários",
      question: "Perguntas frequentes sobre locação",
      answer: "Tire suas principais dúvidas sobre como funciona o processo de locação, desde a busca até a devolução do veículo. Consulte nosso guia completo de locatários."
    },
    
    // Para Proprietários
    {
      id: "como-anunciar",
      category: "Para Proprietários",
      question: "Como anunciar meu veículo?",
      answer: "Acesse seu perfil, clique em 'Cadastrar Veículo', preencha as informações detalhadas, envie fotos de qualidade e documentos necessários. Após aprovação da nossa equipe, seu veículo ficará disponível para aluguel."
    },
    {
      id: "precificacao",
      category: "Para Proprietários",
      question: "Como definir o preço do meu veículo?",
      answer: "Nossa plataforma oferece sugestões de preços baseadas no mercado local, modelo do veículo e demanda. Você pode ajustar os valores conforme sua estratégia, considerando temporadas e eventos locais."
    },
    {
      id: "protecao-total",
      category: "Para Proprietários", 
      question: "O que é a proteção total?",
      answer: "A proteção total inclui cobertura para danos, roubo e outras situações imprevistas. É uma camada adicional de segurança para proprietários que desejam maior tranquilidade ao alugar seus veículos."
    },
    {
      id: "suporte-24-7",
      category: "Para Proprietários",
      question: "Como funciona o suporte 24/7?",
      answer: "Oferecemos suporte contínuo através de chat online, WhatsApp e e-mail. Nossa equipe está disponível para ajudar com emergências, dúvidas sobre reservas e questões técnicas da plataforma."
    },
    
    // Suporte
    {
      id: "central-de-ajuda",
      category: "Suporte",
      question: "Como acessar a central de ajuda?",
      answer: "Nossa central de ajuda está disponível 24/7 através do chat online, WhatsApp (+55 61 99509-8662) e e-mail (suporte@alugae.mobi). Escolha o canal que preferir para receber atendimento personalizado."
    },
    {
      id: "contato",
      category: "Suporte",
      question: "Como entrar em contato conosco?",
      answer: "Você pode nos contatar através de múltiplos canais: Chat online (24/7), WhatsApp (+55 61 99509-8662) em horário comercial, ou e-mail suporte@alugae.mobi com resposta em até 24h."
    },
    {
      id: "termos-de-uso",
      category: "Suporte",
      question: "Onde encontro os termos de uso?",
      answer: "Os termos de uso estão disponíveis no rodapé de todas as páginas e durante o cadastro. Eles contêm informações importantes sobre direitos, deveres e responsabilidades de usuários e proprietários."
    },
    {
      id: "politica-privacidade",
      category: "Suporte", 
      question: "Como protegemos sua privacidade?",
      answer: "Seguimos rigorosas políticas de proteção de dados pessoais, conforme LGPD. Seus dados são criptografados, nunca compartilhados com terceiros sem consentimento e você tem controle total sobre suas informações."
    },
    
    // Gerais
    {
      id: "como-funciona-vistoria",
      category: "Geral",
      question: "Como funciona a vistoria do veículo?",
      answer: "Antes e após o aluguel, é recomendado que a vistoria seja realizada documentando o estado do veículo para proteger locatário e proprietário. Use fotos e descreva qualquer dano existente."
    },
    {
      id: "cancelamento-reserva",
      category: "Geral",
      question: "Posso cancelar minha reserva?",
      answer: "Sim, você pode cancelar conforme nossa política de cancelamento. Os termos variam dependendo do tempo de antecedência: 24h+ (reembolso total), 12-24h (50% de reembolso), menos de 12h (sem reembolso)."
    },
    {
      id: "problemas-pagamento",
      category: "Geral",
      question: "Problemas com pagamento - o que fazer?",
      answer: "Verifique os dados do cartão, limite disponível e tente novamente. Se o problema persistir, entre em contato conosco. Aceitamos cartões de crédito, débito e PIX para maior conveniência."
    },
    {
      id: "criar-conta",
      category: "Geral",
      question: "Como criar uma conta no alugae.mobi?",
      answer: "Clique em 'Cadastrar', preencha seus dados pessoais, confirme seu e-mail e comece a usar a plataforma. O processo é rápido e seguro, levando apenas alguns minutos para completar."
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
      description: "suporte@alugae.mobi",
      availability: "Resposta em até 24h",
      action: "Enviar E-mail"
    },
    {
      icon: Phone,
      title: "WhatsApp",
      description: "+55 (61) 99509-8662",
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
            {["Para Locatários", "Para Proprietários", "Suporte", "Geral"].map((category) => (
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
          {["Para Locatários", "Para Proprietários", "Suporte", "Geral"].map((category) => (
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
                <p><strong>E-mail:</strong> contato@alugae.mobi</p>
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
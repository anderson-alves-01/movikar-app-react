import { useState, useEffect } from 'react';

// Definição de tipos para o Facebook Pixel
declare global {
  interface Window {
    fbq?: (action: string, eventName: string, parameters?: any) => void;
  }
}
import logoImage from '@/assets/logo.png';
import peopleCarImage from "@/assets/people-car.png";
import carWheelImage from "@/assets/car-wheel.png";
import luxuryCarImage from "@/assets/luxury-car.png";
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  MapPin, 
  Clock, 
  DollarSign, 
  Shield, 
  CreditCard,
  Users,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';

export default function LaunchLandingPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isRenter, setIsRenter] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Buscar dados do contador do banco de dados
  const { data: featureToggles } = useQuery({
    queryKey: ['/api/public/feature-toggles'],
    staleTime: 30 * 1000, // Cache por 30 segundos
    refetchInterval: 60 * 1000, // Atualizar a cada minuto
  });

  const waitlistCount = (featureToggles as any)?.waitlistCount || 1247;

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      return response;
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: (error) => {
      console.error('Erro no cadastro:', error);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email && name) {
      const userData = {
        name,
        email,
        phone,
        password: 'temp123',
        wantsToRent: isRenter, // Mapear isRenter para wantsToRent
        isOwner: isOwner,
        fromLandingPage: true
      };
      
      registerMutation.mutate(userData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <img src={logoImage} alt="Alugaê" className="h-8 w-auto" />
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#como-funciona" className="text-gray-600 hover:text-red-500">Como Funciona</a>
              <a href="#motoristas" className="text-gray-600 hover:text-red-500">Para Motoristas</a>
              <a href="#locadores" className="text-gray-600 hover:text-red-500">Para Locadores</a>
              <a href="#cadastro" className="text-gray-600 hover:text-red-500">Cadastre-se</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={peopleCarImage} 
            alt="Pessoas felizes dirigindo" 
            className="w-full h-full object-cover opacity-75"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/30 to-white/40"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <Badge className="mb-4 bg-red-100 text-red-800 hover:bg-red-100">
              LANÇAMENTO EXCLUSIVO!
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              REVOLUÇÃO NO<br />
              <span className="text-red-500">ALUGUEL DE CARROS</span><br />
              EM BRASÍLIA!
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Até 70% MAIS BARATO que locadoras tradicionais<br />
              PROCESSO 100% DIGITAL em menos de 5 minutos
            </p>
            
            {/* Benefícios principais */}
            <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <Card className="p-6 border-none shadow-lg bg-white">
                <DollarSign className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Mais barato que locadoras tradicionais</h3>
              </Card>
              <Card className="p-6 border-none shadow-lg bg-white">
                <Clock className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Rápido: sem filas ou papelada</h3>
              </Card>
              <Card className="p-6 border-none shadow-lg bg-white">
                <MapPin className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Próximo de você: carros disponíveis no seu bairro</h3>
              </Card>
            </div>

            {/* CTAs principais */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                id="banner-cta-1"
                size="lg" 
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg"
                onClick={() => {
                  if (window.fbq) {
                    window.fbq("trackCustom", "BannerCTA", {
                      button_id: "banner-cta-1",
                      label: "Quero alugar um carro"
                    });
                  }
                  setTimeout(() => {
                    document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }}
              >
                Quero alugar um carro
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                id="banner-cta-2"
                size="lg" 
                variant="outline" 
                className="border-red-500 text-red-500 hover:bg-red-50 px-8 py-4 text-lg"
                onClick={() => {
                  if (window.fbq) {
                    window.fbq("trackCustom", "BannerCTA", {
                      button_id: "banner-cta-2",
                      label: "Tenho um carro para alugar"
                    });
                  }
                  setTimeout(() => {
                    document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }}
              >
                Tenho um carro para alugar
              </Button>
            </div>

            {/* Contador de pessoas na lista */}
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-3 rounded-full shadow-lg inline-flex items-center space-x-2 animate-pulse">
                <span><strong>{waitlistCount.toLocaleString()}+</strong> pessoas já estão na lista de espera!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="relative py-20 bg-white overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={carWheelImage} 
            alt="Detalhe roda de carro" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="absolute inset-0 bg-white/70"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Como Funciona?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              No Alugaê, você se cadastra em poucos minutos, escolhe se quer disponibilizar seu carro ou alugar, e pronto! 
              Todo o processo é digital, seguro e transparente.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 border-none shadow-lg">
              <div className="bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Cadastro simples</h3>
              <p className="text-gray-600 text-sm">Crie sua conta em poucos minutos</p>
            </Card>
            
            <Card className="text-center p-6 border-none shadow-lg">
              <div className="bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Car className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Encontre ou ofereça um carro</h3>
              <p className="text-gray-600 text-sm">Procure carros próximos ou anuncie o seu</p>
            </Card>
            
            <Card className="text-center p-6 border-none shadow-lg">
              <div className="bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Aluguel seguro e sem burocracia</h3>
              <p className="text-gray-600 text-sm">Processo 100% digital e protegido</p>
            </Card>
            
          </div>
        </div>
      </section>

      {/* Para Motoristas */}
      <section id="motoristas" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Para <span className="text-red-500">Motoristas</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Alugue com liberdade, sem dor de cabeça. Aqui você tem acesso a carros de forma prática e sem burocracia, 
                pagando um preço justo e com a flexibilidade que precisa.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-red-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">Mais barato que locadoras tradicionais</h3>
                    <p className="text-gray-600">Preços justos diretamente com os proprietários</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-red-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">Processo 100% digital</h3>
                    <p className="text-gray-600">Alugue pelo app, sem filas ou papelada</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-red-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">Carros próximos de você</h3>
                    <p className="text-gray-600">Encontre opções no seu bairro</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-xl p-8 overflow-hidden relative">
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80" 
                  alt="Motorista dirigindo" 
                  className="w-full h-full object-cover opacity-20"
                />
              </div>
              <div className="relative z-10">
                <Car className="h-16 w-16 text-teal-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-center mb-4">Pronto para dirigir?</h3>
                <p className="text-gray-600 text-center mb-6">
                  Cadastre-se na lista de espera e seja um dos primeiros a usar o Alugaê.
                </p>
                <Button 
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  onClick={() => document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Quero alugar um carro
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Para você que tem carro */}
      <section id="locadores" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Para <span className="text-red-500">você que tem carro</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Transforme seu carro parado em renda extra. Você cadastra o carro em poucos minutos, 
                define a disponibilidade e recebe por cada aluguel, sem se preocupar com burocracia.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Star className="h-6 w-6 text-red-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">Mais visibilidade</h3>
                    <p className="text-gray-600">Alcance quem quer alugar perto de você</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Star className="h-6 w-6 text-red-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">Controle total</h3>
                    <p className="text-gray-600">Você escolhe preço e quando alugar</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Star className="h-6 w-6 text-red-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">Renda extra</h3>
                    <p className="text-gray-600">Aproveite o tempo em que o carro ficaria parado</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-teal-50 rounded-lg shadow-xl p-8 overflow-hidden relative">
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80" 
                  alt="Carro elegante" 
                  className="w-full h-full object-cover opacity-30"
                />
              </div>
              <div className="relative z-10">
                <DollarSign className="h-16 w-16 text-teal-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-center mb-4">Transforme seu carro em renda</h3>
                <p className="text-gray-600 text-center mb-6">
                  Você cadastra o carro em poucos minutos, define a disponibilidade e recebe por cada aluguel.
                </p>
                <Button 
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Tenho um carro para alugar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Perguntas Frequentes</h2>
          </div>
          
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">1. Quanto custa para começar a anunciar?</h3>
              <p className="text-gray-600">Nada, você pode começar grátis com 1 anúncio.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">2. Ter o nome negativado impede que eu use o Alugaê?</h3>
              <p className="text-gray-600">Ter o nome negativado não impede que você cadastre seu carro ou alugue na Alugaê.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">3. Posso anunciar mais de um carro?</h3>
              <p className="text-gray-600">Sim! Temos planos flexíveis para frotas de até 50 carros.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">4. Preciso ter empresa para anunciar?</h3>
              <p className="text-gray-600">Não! Pessoas físicas e jurídicas podem anunciar seus carros na plataforma.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">5. É muita burocracia para anunciar ou alugar?</h3>
              <p className="text-gray-600">Não! No Alugaê, você cadastra seu carro ou faz um aluguel em poucos minutos, de forma totalmente digital e simples, sem filas ou papelada.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Formulário de Cadastro */}
      <section id="cadastro" className="py-20 bg-red-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Cadastre-se e seja avisado em primeira mão!
            </h2>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 text-teal-700">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Não fique de fora! Mais de <strong className="text-teal-600">{waitlistCount.toLocaleString()}</strong> pessoas já estão na lista de espera.</span>
              </div>
            </div>
          </div>

          {!isSubmitted ? (
            <Card className="max-w-2xl mx-auto p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(61) 99999-9999"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Tenho interesse em:
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={isRenter}
                        onChange={(e) => setIsRenter(e.target.checked)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">Quero alugar</div>
                        <div className="text-sm text-gray-600">Preciso de um carro</div>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={isOwner}
                        onChange={(e) => setIsOwner(e.target.checked)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">Sou locador</div>
                        <div className="text-sm text-gray-600">Tenho carro para alugar</div>
                      </div>
                    </label>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3"
                  disabled={!email || !name || registerMutation.isPending}
                >
                  {registerMutation.isPending ? 'Cadastrando...' : 'Entrar na lista de espera'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="max-w-2xl mx-auto p-8 text-center">
              <CheckCircle className="h-16 w-16 text-teal-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Cadastro realizado com sucesso!
              </h3>
              <p className="text-gray-600 mb-6">
                Obrigado por se cadastrar, <strong>{name}</strong>! 
                Você receberá um email em <strong>{email}</strong> assim que o Alugaê estiver disponível.
              </p>
              <p className="text-sm text-gray-500">
                Enquanto isso, nos siga nas redes sociais para ficar por dentro das novidades.
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <img src={logoImage} alt="Alugaê" className="h-8 w-auto" />
            </div>
            <p className="text-gray-400 mb-6">alugae.mobi</p>
            <p className="text-gray-500 text-sm">
              © 2025 Alugaê – Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
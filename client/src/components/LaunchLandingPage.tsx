import { useState, useEffect } from 'react';
import logoImage from '@/assets/logo.png';
import { useMutation } from '@tanstack/react-query';
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
  const [waitlistCount, setWaitlistCount] = useState(1247);

  // Incrementar contador a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setWaitlistCount(prev => prev + Math.floor(Math.random() * 3) + 1); // Aumenta 1-3 pessoas por minuto
    }, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, []);

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
        isRenter,
        isOwner,
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
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge className="mb-4 bg-red-100 text-red-800 hover:bg-red-100">
              O Alugaê está chegando!
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              O jeito inteligente de alugar e<br />
              <span className="text-red-500">compartilhar carros</span> em Brasília
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Conectamos quem tem carro disponível com quem precisa de um, de forma simples, rápida e segura.
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
                size="lg" 
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg"
                onClick={() => document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Quero alugar um carro
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-red-500 text-red-500 hover:bg-red-50 px-8 py-4 text-lg"
                onClick={() => document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Tenho um carro para alugar
              </Button>
            </div>

            {/* Contador de pessoas na lista */}
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <Users className="h-5 w-5" />
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-full shadow-lg inline-flex items-center space-x-2 animate-pulse">
                <Users className="h-5 w-5" />
                <span><strong>{waitlistCount.toLocaleString()}+</strong> pessoas já estão na lista de espera!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Como Funciona?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              No Alugaê, você se cadastra em poucos minutos, escolhe se quer disponibilizar seu carro ou alugar, e pronto! 
              Todo o processo é digital, seguro e transparente.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="text-center p-6 border-none shadow-lg">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="font-semibold mb-2">Cadastro simples</h3>
              <p className="text-gray-600 text-sm">Crie sua conta em poucos minutos</p>
            </Card>
            
            <Card className="text-center p-6 border-none shadow-lg">
              <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Car className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="font-semibold mb-2">Encontre ou ofereça um carro</h3>
              <p className="text-gray-600 text-sm">Procure carros próximos ou anuncie o seu</p>
            </Card>
            
            <Card className="text-center p-6 border-none shadow-lg">
              <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="font-semibold mb-2">Aluguel seguro e sem burocracia</h3>
              <p className="text-gray-600 text-sm">Processo 100% digital e protegido</p>
            </Card>
            
            <Card className="text-center p-6 border-none shadow-lg">
              <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="font-semibold mb-2">Pagamento garantido via plataforma</h3>
              <p className="text-gray-600 text-sm">Transações seguras e automáticas</p>
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
            
            <div className="bg-white rounded-lg shadow-xl p-8">
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
      </section>

      {/* Para Locadores */}
      <section id="locadores" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-teal-50 rounded-lg shadow-xl p-8">
              <DollarSign className="h-16 w-16 text-teal-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-center mb-4">Transforme seu carro em renda</h3>
              <p className="text-gray-600 text-center mb-6">
                Você cadastra o carro em poucos minutos, define a disponibilidade e recebe por cada aluguel.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-teal-600 text-teal-600 hover:bg-teal-50"
                onClick={() => document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Tenho um carro para alugar
              </Button>
            </div>
            
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Para <span className="text-red-500">Locadores</span>
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
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
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
            <p className="text-xl text-teal-100">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-2 text-red-700">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Não fique de fora! Mais de <strong className="text-red-600">{waitlistCount.toLocaleString()}</strong> pessoas já estão na lista de espera.</span>
                </div>
              </div>
            </p>
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
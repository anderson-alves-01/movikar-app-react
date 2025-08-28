import { useState, useEffect } from 'react';
import logoImage from '@/assets/logo.png';
import peopleCarImage from "@/assets/people-car.png";
import carWheelImage from "@/assets/car-wheel.png";
import luxuryCarImage from "@/assets/luxury-car.png";
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
  Star,
  Zap,
  TrendingUp,
  Award
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
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-orange-500">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <img src={logoImage} alt="Alugaê" className="h-10 w-auto brightness-0 invert" />
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#como-funciona" className="text-white/90 hover:text-white font-medium transition-colors">Como Funciona</a>
              <a href="#motoristas" className="text-white/90 hover:text-white font-medium transition-colors">Para Motoristas</a>
              <a href="#locadores" className="text-white/90 hover:text-white font-medium transition-colors">Para Locadores</a>
              <a href="#cadastro" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-semibold transition-all">Cadastre-se</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={peopleCarImage} 
            alt="Pessoas felizes dirigindo" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40"></div>
        
        {/* Elementos visuais de impacto */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/4 right-20 w-16 h-16 bg-white rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-orange-300 rounded-full opacity-25 animate-ping"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <div className="mb-8 animate-pulse">
              <Badge className="mb-4 bg-yellow-400 text-black hover:bg-yellow-300 text-lg font-bold px-6 py-2 shadow-2xl">
                🔥 LANÇAMENTO EXCLUSIVO!
              </Badge>
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white mb-8 drop-shadow-2xl leading-tight">
              REVOLUÇÃO NO
              <br />
              <span className="text-yellow-400 animate-pulse">ALUGUEL DE CARROS</span>
              <br />
              <span className="text-3xl md:text-5xl">EM BRASÍLIA!</span>
            </h1>
            <p className="text-2xl md:text-3xl text-white/90 mb-12 max-w-4xl mx-auto font-bold drop-shadow-lg">
              Até 70% MAIS BARATO que locadoras tradicionais<br/>
              PROCESSO 100% DIGITAL em menos de 5 minutos
            </p>
            
            {/* Benefícios principais com impacto */}
            <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
              <Card className="p-8 border-none shadow-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white transform hover:scale-105 transition-all duration-300">
                <TrendingUp className="h-16 w-16 text-white mx-auto mb-6 drop-shadow-lg" />
                <h3 className="font-black text-xl mb-4">70% MAIS BARATO</h3>
                <p className="font-semibold">Economia real</p>
              </Card>
              <Card className="p-8 border-none shadow-2xl bg-gradient-to-br from-green-400 to-teal-500 text-white transform hover:scale-105 transition-all duration-300">
                <Zap className="h-16 w-16 text-white mx-auto mb-6 drop-shadow-lg" />
                <h3 className="font-black text-xl mb-4">EM 5 MINUTOS</h3>
                <p className="font-semibold">Zero burocracia</p>
              </Card>
              <Card className="p-8 border-none shadow-2xl bg-gradient-to-br from-blue-400 to-purple-500 text-white transform hover:scale-105 transition-all duration-300">
                <MapPin className="h-16 w-16 text-white mx-auto mb-6 drop-shadow-lg" />
                <h3 className="font-black text-xl mb-4">NO SEU BAIRRO</h3>
                <p className="font-semibold">Carros próximos</p>
              </Card>
            </div>

            {/* CTAs principais com máximo impacto */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
              <Button 
                size="lg" 
                className="bg-yellow-400 hover:bg-yellow-300 text-black px-12 py-6 text-2xl font-black shadow-2xl transform hover:scale-110 transition-all duration-300 animate-pulse"
                onClick={() => document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Car className="mr-3 h-8 w-8" />
                QUERO ALUGAR AGORA!
                <ArrowRight className="ml-3 h-8 w-8" />
              </Button>
              <Button 
                size="lg" 
                className="bg-white/20 hover:bg-white/30 text-white border-2 border-white px-12 py-6 text-2xl font-black shadow-2xl transform hover:scale-110 transition-all duration-300 backdrop-blur-sm"
                onClick={() => document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <DollarSign className="mr-3 h-8 w-8" />
                GANHAR DINHEIRO
              </Button>
            </div>

            {/* Contador de pessoas na lista com urgência */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl shadow-2xl inline-flex items-center space-x-3 animate-bounce border-4 border-yellow-400">
                <TrendingUp className="h-6 w-6" />
                <span className="text-xl font-black">{waitlistCount.toLocaleString()}+ PESSOAS JÁ SE CADASTRARAM!</span>
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="text-white/90 text-lg font-bold animate-pulse">
                <Clock className="inline h-5 w-5 mr-2" />
                ÚLTIMAS HORAS PARA GARANTIR SEU LUGAR!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="relative py-24 bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={carWheelImage} 
            alt="Detalhe roda de carro" 
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-red-500/10"></div>
        
        {/* Elementos de fundo animados */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-yellow-400/20 rounded-full animate-spin-slow"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-red-500/20 rounded-full animate-pulse"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-2xl">
              ⚡ SIMPLES ASSIM!
            </h2>
            <p className="text-2xl md:text-3xl text-yellow-400 max-w-4xl mx-auto font-bold">
              3 PASSOS E VOCÊ ESTÁ DIRIGINDO!
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center transform hover:scale-110 transition-all duration-500">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl w-32 h-32 flex items-center justify-center mx-auto mb-8 shadow-2xl border-4 border-white animate-bounce">
                <span className="text-5xl font-black text-white drop-shadow-lg">1</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-4">CADASTRO RÁPIDO</h3>
              <p className="text-xl text-yellow-400 font-bold">2 minutos</p>
            </div>
            
            <div className="text-center transform hover:scale-110 transition-all duration-500">
              <div className="bg-gradient-to-br from-green-400 to-teal-500 rounded-3xl w-32 h-32 flex items-center justify-center mx-auto mb-8 shadow-2xl border-4 border-white animate-bounce" style={{animationDelay: '0.5s'}}>
                <span className="text-5xl font-black text-white drop-shadow-lg">2</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-4">ESCOLHA O CARRO</h3>
              <p className="text-xl text-yellow-400 font-bold">Centenas disponíveis</p>
            </div>
            
            <div className="text-center transform hover:scale-110 transition-all duration-500">
              <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl w-32 h-32 flex items-center justify-center mx-auto mb-8 shadow-2xl border-4 border-white animate-bounce" style={{animationDelay: '1s'}}>
                <span className="text-5xl font-black text-white drop-shadow-lg">3</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-4">JÁ ESTÁ DIRIGINDO!</h3>
              <p className="text-xl text-yellow-400 font-bold">Zero complicação</p>
            </div>
          </div>
        </div>
      </section>

      {/* Para Motoristas */}
      <section id="motoristas" className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 drop-shadow-2xl">
                <Car className="inline h-16 w-16 mr-4" />
                PARA VOCÊ QUE
                <br/>
                <span className="text-yellow-400 animate-pulse">QUER DIRIGIR!</span>
              </h2>
              <p className="text-2xl text-white/90 mb-10 font-bold leading-relaxed">
                ECONOMIA REAL: Até 70% mais barato!<br/>
                ZERO BUROCRACIA: Sem filas nem papelada!<br/>
                PERTO DE VOCÊ: Carros no seu bairro!
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="bg-green-400 rounded-full p-2">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">ECONOMIA REAL!</h3>
                    <p className="text-lg text-yellow-400 font-semibold">Preços justos</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="bg-blue-400 rounded-full p-2">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">RAPIDEZ TOTAL!</h3>
                    <p className="text-lg text-yellow-400 font-semibold">Tudo pelo celular</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="bg-purple-400 rounded-full p-2">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">CONVENIENTE!</h3>
                    <p className="text-lg text-yellow-400 font-semibold">Carro perto de você</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-2xl p-10 overflow-hidden relative transform hover:scale-105 transition-all duration-300 border-4 border-white">
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1549317336-206569e8475c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80" 
                  alt="Pessoas felizes dirigindo" 
                  className="w-full h-full object-cover opacity-10"
                />
              </div>
              <div className="relative z-10">
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8 shadow-xl animate-bounce">
                  <Car className="h-12 w-12 text-orange-500" />
                </div>
                <h3 className="text-3xl font-black text-white text-center mb-6 drop-shadow-lg">PRONTO PARA A LIBERDADE?</h3>
                <p className="text-xl text-white font-bold text-center mb-8">
                  Cadastre-se AGORA e seja um dos primeiros!
                </p>
                <Button 
                  className="w-full bg-white hover:bg-gray-100 text-black py-4 text-xl font-black shadow-xl transform hover:scale-105 transition-all"
                  onClick={() => document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Car className="mr-2 h-6 w-6" />
                  QUERO DIRIGIR JÁ!
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Para Locadores */}
      <section id="locadores" className="relative py-24 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={luxuryCarImage} 
            alt="Carro de luxo" 
            className="w-full h-full object-cover opacity-15"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30"></div>
        
        {/* Elementos visuais de dinheiro */}
        <div className="absolute top-10 left-1/4 text-6xl animate-bounce text-yellow-400 opacity-30">💰</div>
        <div className="absolute bottom-20 right-1/4 text-5xl animate-pulse text-green-400 opacity-40">💵</div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="bg-gradient-to-br from-yellow-400 to-green-500 rounded-3xl shadow-2xl p-10 overflow-hidden relative transform hover:scale-105 transition-all duration-300 border-4 border-white">
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80" 
                  alt="Carro elegante" 
                  className="w-full h-full object-cover opacity-10"
                />
              </div>
              <div className="relative z-10">
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8 shadow-xl animate-spin-slow">
                  <DollarSign className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-3xl font-black text-white text-center mb-6 drop-shadow-lg">TRANSFORME SEU CARRO EM DINHEIRO!</h3>
                <p className="text-xl text-white font-bold text-center mb-8">
                  Ganhe até R$ 3.000/mês com seu carro parado!
                </p>
                <Button 
                  className="w-full bg-white hover:bg-gray-100 text-black py-4 text-xl font-black shadow-xl transform hover:scale-105 transition-all"
                  onClick={() => document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <DollarSign className="mr-2 h-6 w-6" />
                  QUERO GANHAR DINHEIRO!
                </Button>
              </div>
            </div>
            
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 drop-shadow-2xl">
                <DollarSign className="inline h-16 w-16 mr-4" />
                PARA VOCÊ QUE
                <br/>
                <span className="text-yellow-400 animate-pulse">TEM CARRO!</span>
              </h2>
              <p className="text-2xl text-white/90 mb-10 font-bold leading-relaxed">
                CARRO PARADO = DINHEIRO PERDIDO!<br/>
                GANHE ATÉ R$ 3.000/MÊS!<br/>
                CADASTRO EM 5 MINUTOS!
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="bg-yellow-400 rounded-full p-2">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">VISIBILIDADE MÁXIMA!</h3>
                    <p className="text-lg text-yellow-400 font-semibold">Milhares veem seu carro</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="bg-green-400 rounded-full p-2">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">VOCÊ MANDA!</h3>
                    <p className="text-lg text-yellow-400 font-semibold">Seu preço, seu lucro</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="bg-blue-400 rounded-full p-2">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">DINHEIRO TODO DIA!</h3>
                    <p className="text-lg text-yellow-400 font-semibold">Carro parado em grana</p>
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
      <section id="cadastro" className="py-32 bg-gradient-to-br from-red-600 via-pink-600 to-purple-700 relative overflow-hidden">
        {/* Elementos de fundo animados */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400/20 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/10 rounded-full animate-bounce"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-orange-400/30 rounded-full animate-ping"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="mb-8">
              <Badge className="bg-yellow-400 text-black text-2xl font-black px-8 py-3 mb-6 animate-bounce">
                <Award className="inline h-6 w-6 mr-2" />
                ÚLTIMA CHANCE!
              </Badge>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 drop-shadow-2xl leading-tight">
              GARANTE SEU LUGAR
              <br/>
              <span className="text-yellow-400 animate-pulse">AGORA!</span>
            </h2>
            <div className="bg-black/30 backdrop-blur-sm border-2 border-yellow-400 rounded-3xl p-8 mb-8">
              <div className="flex items-center justify-center space-x-4 text-white">
                <Clock className="h-8 w-8 animate-spin" />
                <span className="text-2xl font-black">JÁ SÃO {waitlistCount.toLocaleString()}+ PESSOAS NA FILA!</span>
                <TrendingUp className="h-8 w-8 animate-bounce" />
              </div>
            </div>
          </div>

          {!isSubmitted ? (
            <Card className="max-w-3xl mx-auto p-12 bg-gradient-to-br from-white to-gray-50 shadow-2xl border-4 border-yellow-400 rounded-3xl">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-black text-gray-900 mb-4">
                  <Zap className="inline h-8 w-8 mr-2" />
                  CADASTRO INSTANTÂNEO!
                </h3>
                <p className="text-xl text-gray-600 font-semibold">
                  2 minutos na lista VIP!
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-8">
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
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black py-6 text-2xl font-black shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-yellow-600"
                  disabled={!email || !name || registerMutation.isPending}
                >
                  {registerMutation.isPending ? 'CADASTRANDO...' : 'GARANTIR MINHA VAGA AGORA!'}
                  <ArrowRight className="ml-3 h-8 w-8" />
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="max-w-3xl mx-auto p-12 text-center bg-gradient-to-br from-green-400 to-teal-500 shadow-2xl border-4 border-white rounded-3xl">
              <div className="bg-white rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8 shadow-xl animate-bounce">
                <CheckCircle className="h-20 w-20 text-green-500" />
              </div>
              <h3 className="text-4xl font-black text-white mb-6 drop-shadow-lg">
                <Award className="inline h-12 w-12 mr-4" />
                PARABÉNS, {name.toUpperCase()}!
              </h3>
              <p className="text-2xl text-white font-bold mb-8">
                <CheckCircle className="inline h-8 w-8 mr-2" />
                VOCÊ ESTÁ OFICIALMENTE NA LISTA VIP!<br/>
                Avisaremos você em <strong>{email}</strong>
              </p>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-white">
                <p className="text-xl text-white font-semibold">
                  <TrendingUp className="inline h-6 w-6 mr-2" />
                  Prepare-se para a REVOLUÇÃO do aluguel de carros!
                </p>
              </div>
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
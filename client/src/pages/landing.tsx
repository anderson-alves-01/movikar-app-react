import { Button } from "@/components/ui/button";
import { Car, Shield, Zap, Check, ArrowRight, Star } from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          {/* Logo */}
          <div className="text-center mb-12">
            <h1 className="text-6xl sm:text-7xl font-bold mb-2">
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                alugae
              </span>
            </h1>
          </div>

          {/* Main Headline */}
          <div className="text-center max-w-5xl mx-auto mb-16">
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
              Alugue o carro dos seus sonhos em{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                minutos
              </span>
            </h2>
            <p className="text-xl sm:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Conectamos você diretamente com donos de carros. 
              <span className="text-white font-semibold"> Sem burocracia, sem complicação.</span>
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href="/">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-2xl shadow-emerald-500/50"
                data-testid="button-cta-browse"
              >
                Ver Carros Disponíveis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth">
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 border-2 border-white/20 text-white hover:bg-white/10"
                data-testid="button-cta-register"
              >
                Cadastrar Meu Carro
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Rápido e Fácil</h3>
              <p className="text-slate-300">
                Reserve em poucos cliques. Sem formulários intermináveis ou espera.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">100% Seguro</h3>
              <p className="text-slate-300">
                Pagamentos protegidos e contratos digitais assinados via DocuSign.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Preços Justos</h3>
              <p className="text-slate-300">
                Valores transparentes direto com o dono. Sem taxas escondidas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="bg-slate-900/50 border-t border-white/10 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">Por que escolher o alugae?</h3>
            <p className="text-slate-300 text-lg">Junte-se a milhares de usuários satisfeitos</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              </div>
              <p className="text-white font-semibold text-2xl mb-1">4.9/5</p>
              <p className="text-slate-400">Avaliação média</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Check className="h-8 w-8 text-emerald-400" />
              </div>
              <p className="text-white font-semibold text-2xl mb-1">88,000+</p>
              <p className="text-slate-400">Usuários cadastrados</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Car className="h-8 w-8 text-cyan-400" />
              </div>
              <p className="text-white font-semibold text-2xl mb-1">50+</p>
              <p className="text-slate-400">Carros disponíveis</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Shield className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-white font-semibold text-2xl mb-1">100%</p>
              <p className="text-slate-400">Transações seguras</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h3 className="text-4xl font-bold text-white mb-6">
          Pronto para começar sua jornada?
        </h3>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Cadastre-se agora e tenha acesso aos melhores carros da sua região
        </p>
        <Link href="/auth">
          <Button 
            size="lg" 
            className="text-lg px-12 py-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-2xl shadow-emerald-500/50"
            data-testid="button-final-cta"
          >
            Começar Agora - É Grátis!
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-400">
            © 2025 alugae.mobi - Aluguel de carros entre pessoas
          </p>
        </div>
      </div>
    </div>
  );
}

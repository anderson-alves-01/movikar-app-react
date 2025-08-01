import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, Star, Sparkles, ArrowRight, Home, Car } from "lucide-react";

export default function SubscriptionSuccess() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const planName = searchParams.get('plan') || 'essencial';

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);
  }, []);

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'essencial':
        return <Star className="h-12 w-12 text-amber-500" />;
      case 'plus':
        return <Crown className="h-12 w-12 text-purple-500" />;
      default:
        return <Sparkles className="h-12 w-12 text-blue-500" />;
    }
  };

  const getPlanDisplayName = (planName: string) => {
    switch (planName) {
      case 'essencial':
        return 'Plano Essencial';
      case 'plus':
        return 'Plano Plus';
      default:
        return 'Plano';
    }
  };

  const getPlanFeatures = (planName: string) => {
    switch (planName) {
      case 'essencial':
        return [
          'Anúncios ilimitados de veículos',
          'Destaque prata (3x mais visualizações)',
          'Suporte prioritário via email',
          'Estatísticas básicas de performance',
        ];
      case 'plus':
        return [
          'Anúncios ilimitados de veículos',
          'Destaque diamante (10x mais visualizações)',
          'Suporte VIP 24/7',
          'Analytics avançados e relatórios',
          'Badge de proprietário premium',
        ];
      default:
        return [];
    }
  };

  const getNextSteps = (planName: string) => {
    const highlightCount = planName === 'essencial' ? 3 : planName === 'plus' ? 10 : 0;
    
    return [
      {
        title: 'Publique seus veículos',
        description: 'Agora você pode publicar quantos veículos quiser sem limite',
        action: 'Publicar Veículo',
        link: '/vehicles/create',
        icon: <Car className="h-5 w-5" />,
      },
      {
        title: `Use seus ${highlightCount} destaques`,
        description: 'Destaque seus melhores veículos para aparecer no topo das pesquisas',
        action: 'Ver Meus Veículos',
        link: '/my-vehicles',
        icon: <Star className="h-5 w-5" />,
      },
      {
        title: 'Acompanhe suas estatísticas',
        description: 'Monitore visualizações, contatos e performance dos seus anúncios',
        action: 'Ver Dashboard',
        link: '/dashboard',
        icon: <ArrowRight className="h-5 w-5" />,
      },
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Assinatura Ativada com Sucesso! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Parabéns! Agora você tem acesso completo ao {getPlanDisplayName(planName)}
          </p>

          <Badge variant="secondary" className="text-lg px-4 py-2">
            {getPlanDisplayName(planName)} Ativo
          </Badge>
        </div>

        {/* Plan Summary */}
        <Card className="mb-8 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getPlanIcon(planName)}
            </div>
            <CardTitle className="text-2xl">
              Seu {getPlanDisplayName(planName)} Inclui:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {getPlanFeatures(planName).map((feature, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Próximos Passos
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {getNextSteps(planName).map((step, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
                      {step.icon}
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </div>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={step.link}>
                    <Button className="w-full">
                      {step.action}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-4">
            <Link to="/my-vehicles">
              <Button size="lg" className="px-8">
                <Car className="h-5 w-5 mr-2" />
                Gerenciar Meus Veículos
              </Button>
            </Link>
            
            <Link to="/">
              <Button variant="outline" size="lg" className="px-8">
                <Home className="h-5 w-5 mr-2" />
                Voltar ao Início
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-6">
            Tem dúvidas? Entre em contato com nosso suporte prioritário em{" "}
            <a href="mailto:sac@alugae.mobi" className="text-blue-600 hover:underline">
              sac@alugae.mobi
            </a>
          </p>
        </div>

        {/* Welcome Message */}
        <Card className="mt-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">
              Bem-vindo ao time premium do alugae! 🚗
            </h3>
            <p className="text-lg opacity-90">
              Agora você faz parte de um grupo seleto de proprietários que maximizam
              seus ganhos com aluguel de veículos. Aproveite todos os recursos exclusivos
              e aumente significativamente sua renda mensal.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
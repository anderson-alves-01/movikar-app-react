import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    confirmPassword: '',
    rememberMe: false,
    acceptTerms: false,
  });

  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  const authMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Importante para cookies httpOnly
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Para sistema httpOnly cookies, o token pode vir vazio
      setAuth(data.user, data.token || '');
      toast({
        title: authMode === 'login' ? "✅ Login realizado com sucesso!" : "✅ Conta criada!",
        description: authMode === 'login' 
          ? "Redirecionando para a página principal..." 
          : "Conta criada! Redirecionando para a página principal...",
      });

      // Verificar se há URL de retorno salva (ex: página de planos)
      const returnUrl = localStorage.getItem('returnUrl');
      
      setTimeout(() => {
        if (returnUrl) {
          localStorage.removeItem('returnUrl');
          setLocation(returnUrl);
        } else {
          setLocation('/'); // Redirecionar para a tela principal
        }
      }, 1000); // Delay de 1s para mostrar a mensagem
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha na autenticação",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (authMode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Erro",
          description: "As senhas não coincidem",
          variant: "destructive",
        });
        return;
      }

      if (!formData.acceptTerms) {
        toast({
          title: "Erro",
          description: "Você deve aceitar os termos de uso",
          variant: "destructive",
        });
        return;
      }

      authMutation.mutate({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
      });
    } else {
      authMutation.mutate({
        email: formData.email,
        password: formData.password,
      });
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const switchMode = () => {
    setAuthMode(prev => prev === 'login' ? 'register' : 'login');
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      confirmPassword: '',
      rememberMe: false,
      acceptTerms: false,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">CarShare</h1>
          <h2 className="text-2xl font-bold text-gray-900">
            {authMode === 'login' ? 'Entrar na sua conta' : 'Criar nova conta'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {authMode === 'login' 
              ? 'Acesse sua conta para continuar' 
              : 'Junte-se à maior plataforma de compartilhamento de carros'
            }
          </p>
        </div>

        {/* Auth Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {authMode === 'login' ? 'Entrar' : 'Cadastrar'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field (Register only) */}
              {authMode === 'register' && (
                <div>
                  <Label htmlFor="name">Nome completo</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      required
                      className="pl-10"
                      placeholder="Seu nome completo"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Phone Field (Register only) */}
              {authMode === 'register' && (
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      className="pl-10"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <Label htmlFor="email">E-mail</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    required
                    className="pl-10"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password">Senha</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="pl-10 pr-10"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm Password Field (Register only) */}
              {authMode === 'register' && (
                <div>
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      className="pl-10"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Remember Me / Accept Terms */}
              <div className="space-y-3">
                {authMode === 'login' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="rememberMe"
                        checked={formData.rememberMe}
                        onCheckedChange={(checked) => handleInputChange('rememberMe', checked as boolean)}
                      />
                      <Label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
                        Lembrar de mim
                      </Label>
                    </div>
                    <Button variant="link" className="text-sm text-primary hover:text-red-600 p-0">
                      Esqueci minha senha
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <Checkbox
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                      className="mt-1"
                    />
                    <Label htmlFor="acceptTerms" className="ml-3 text-sm text-gray-700">
                      Aceito os{" "}
                      <a href="#" className="text-primary hover:text-red-600">
                        termos de uso
                      </a>{" "}
                      e{" "}
                      <a href="#" className="text-primary hover:text-red-600">
                        política de privacidade
                      </a>
                    </Label>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary text-white font-semibold hover:bg-red-600 transition-colors"
                disabled={authMutation.isPending}
              >
                {authMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {authMode === 'login' ? 'Entrando...' : 'Criando conta...'}
                  </>
                ) : (
                  authMode === 'login' ? 'Entrar' : 'Criar conta'
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">ou</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => toast({ title: "Em breve", description: "Login social será implementado em breve" })}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar com Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => toast({ title: "Em breve", description: "Login social será implementado em breve" })}
                >
                  <svg className="w-5 h-5 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continuar com Facebook
                </Button>
              </div>

              {/* Switch Mode */}
              <div className="text-center text-sm text-gray-600">
                {authMode === 'login' ? (
                  <>
                    Não tem uma conta?{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="text-primary hover:text-red-600 font-medium p-0"
                      onClick={switchMode}
                    >
                      Cadastre-se
                    </Button>
                  </>
                ) : (
                  <>
                    Já tem uma conta?{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="text-primary hover:text-red-600 font-medium p-0"
                      onClick={switchMode}
                    >
                      Entrar
                    </Button>
                  </>
                )}
              </div>

              {/* Home Button */}
              <div className="text-center pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation('/')}
                >
                  🏠 Voltar ao Início
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
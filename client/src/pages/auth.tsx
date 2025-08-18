import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, Gift, MapPin, Check, ChevronsUpDown } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatPhoneNumber, validatePhoneNumber, filterCities } from "@/utils/phoneFormatter";
import { cn } from "@/lib/utils";

export default function Auth() {
  const [, setLocation] = useLocation();
  const currentPath = window.location.pathname;
  const initialMode = currentPath === '/register' ? 'register' : 'login';
  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    location: '',
    confirmPassword: '',
    rememberMe: false,
    acceptTerms: false,
  });
  const [cityOpen, setCityOpen] = useState(false);
  const [citySearchValue, setCitySearchValue] = useState("");
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  // Check for referral code in URL parameters and validate it
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const oauthSuccess = urlParams.get('oauth_success');
    
    // Handle OAuth success
    if (oauthSuccess === '1') {
      toast({
        title: "✅ Login realizado com sucesso!",
        description: "Redirecionando...",
      });

      // Clean URL and redirect
      window.history.replaceState({}, '', window.location.pathname);
      
      // Force auth check to reload user data
      const checkAuthAfterOAuth = async () => {
        try {
          const response = await fetch('/api/auth/user', {
            method: 'GET',
            credentials: 'include',
          });

          if (response.ok) {
            const userData = await response.json();
            setAuth(userData, '');
          }
        } catch (error) {
          console.error('Failed to load user after OAuth:', error);
        }
      };

      checkAuthAfterOAuth();
      
      setTimeout(() => {
        const pendingSubscription = localStorage.getItem('pendingSubscription');
        const returnUrl = localStorage.getItem('returnUrl');
        
        if (pendingSubscription) {
          setLocation('/subscription-plans?from=oauth');
        } else if (returnUrl) {
          localStorage.removeItem('returnUrl');
          setLocation(returnUrl);
        } else {
          setLocation('/');
        }
      }, 1500);
      return;
    }
    
    if (refCode) {
      setReferralCode(refCode);
      setAuthMode('register'); // Switch to register mode if there's a referral code
      
      // Validate referral code and get inviter name
      fetch(`/api/referrals/validate/${refCode}`)
        .then(response => response.json())
        .then(data => {
          if (data.valid && data.inviterName) {
            setInviterName(data.inviterName);
            toast({
              title: "🎉 Código de convite detectado!",
              description: `Você foi convidado por ${data.inviterName}!`,
            });
          } else {
            toast({
              title: "🎉 Código de convite detectado!",
              description: `Você foi convidado com o código: ${refCode}`,
            });
          }
        })
        .catch(() => {
          // Fallback message if validation fails
          toast({
            title: "🎉 Código de convite detectado!",
            description: `Você foi convidado com o código: ${refCode}`,
          });
        });
    }
  }, [toast, setLocation]);

  const applyReferralMutation = useMutation({
    mutationFn: async (referralCode: string) => {
      const response = await apiRequest('POST', '/api/referrals/use-code', {
        referralCode
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🎉 Código de convite aplicado!",
        description: "Você ganhou pontos de recompensa!",
      });
    },
    onError: (error: any) => {
      console.warn('Failed to apply referral code:', error.message);
      // Don't show error to user as it's not critical for registration
    },
  });

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
      
      // Apply referral code if present and this is a registration
      if (authMode === 'register' && referralCode) {
        console.log('🎯 Applying referral code after registration:', referralCode);
        applyReferralMutation.mutate(referralCode);
      }
      
      toast({
        title: authMode === 'login' ? "✅ Login realizado com sucesso!" : "✅ Conta criada!",
        description: authMode === 'login' 
          ? "Redirecionando para a página principal..." 
          : "Conta criada! Redirecionando para a página principal...",
      });

      // Check for pending subscription or return URL
      const pendingSubscription = localStorage.getItem('pendingSubscription');
      const returnUrl = localStorage.getItem('returnUrl');
      
      setTimeout(() => {
        if (pendingSubscription) {
          console.log('📋 Found pending subscription, redirecting to plans');
          setLocation('/subscription-plans?from=login');
        } else if (returnUrl) {
          localStorage.removeItem('returnUrl');
          setLocation(returnUrl);
        } else {
          setLocation('/'); // Redirect to main page
        }
      }, 1000);
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
        location: formData.location,
      });
    } else {
      authMutation.mutate({
        email: formData.email,
        password: formData.password,
      });
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === 'phone' && typeof value === 'string') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else if (field === 'location' && typeof value === 'string') {
      setFormData(prev => ({ ...prev, [field]: value }));
      setCitySearchValue(value);
      const filtered = filterCities(value);
      setCityOptions(filtered);
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const switchMode = () => {
    setAuthMode(prev => prev === 'login' ? 'register' : 'login');
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      location: '',
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
          <h1 className="text-3xl font-bold text-primary mb-2">alugae</h1>
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

        {/* Referral Code Banner */}
        {referralCode && authMode === 'register' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2 text-green-800">
                <Gift className="h-5 w-5" />
                <div>
                  <p className="font-medium">
                    {inviterName ? `Você foi convidado por ${inviterName}!` : 'Você foi convidado!'}
                  </p>
                  <p className="text-sm">Código de convite: <span className="font-mono font-bold">{referralCode}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                      data-testid="input-name"
                    />
                  </div>
                </div>
              )}

              {/* Phone Field (Register only) */}
              {authMode === 'register' && (
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Aceitamos números brasileiros e internacionais para turistas
                  </p>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      className="pl-10"
                      placeholder="+55 (11) 99999-9999 ou (11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      data-testid="input-phone"
                    />
                  </div>
                  {formData.phone && !validatePhoneNumber(formData.phone) && (
                    <p className="text-xs text-red-500 mt-1">
                      Formato inválido. Use: (11) 99999-9999 ou +55 (11) 99999-9999
                    </p>
                  )}
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
                    onChange={(e) => {
                      // Preserve dots and validate email format
                      const emailValue = e.target.value;
                      if (emailValue.includes('.') || emailValue.includes('@')) {
                        setFormData(prev => ({ ...prev, email: emailValue }));
                      } else {
                        handleInputChange('email', emailValue);
                      }
                    }}
                    data-testid="input-email"
                  />
                </div>
                {formData.email && !formData.email.includes('@') && formData.email.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Digite um e-mail válido com @
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password">Senha</Label>
                {authMode === 'register' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 8 caracteres, com pelo menos: 1 número, 1 letra maiúscula e 1 minúscula
                  </p>
                )}
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
                    data-testid="input-password"
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

              {/* Location Field (Register only) */}
              {authMode === 'register' && (
                <div>
                  <Label htmlFor="location">Localização</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Digite sua cidade para busca inteligente
                  </p>
                  <div className="relative mt-1">
                    <Popover open={cityOpen} onOpenChange={setCityOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={cityOpen}
                          className="w-full justify-between pl-10 font-normal"
                          data-testid="button-select-city"
                        >
                          <MapPin className="absolute left-3 h-4 w-4 text-gray-400" />
                          {formData.location || "Selecione sua cidade..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Digite sua cidade..." 
                            value={citySearchValue}
                            onValueChange={(value) => {
                              setCitySearchValue(value);
                              const filtered = filterCities(value);
                              setCityOptions(filtered);
                            }}
                          />
                          <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                          <CommandGroup>
                            {cityOptions.map((city) => (
                              <CommandItem
                                key={city}
                                value={city}
                                onSelect={(currentValue) => {
                                  setFormData(prev => ({ ...prev, location: currentValue }));
                                  setCityOpen(false);
                                  setCitySearchValue("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.location === city ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {city}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

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
                      data-testid="input-confirm-password"
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
                data-testid="button-submit"
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
                  className="w-full hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    const returnUrl = localStorage.getItem('returnUrl') || window.location.pathname;
                    window.location.href = `/api/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`;
                  }}
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
                  className="w-full hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    const returnUrl = localStorage.getItem('returnUrl') || window.location.pathname;
                    window.location.href = `/api/auth/apple?returnUrl=${encodeURIComponent(returnUrl)}`;
                  }}
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.024C8.953 22.82 9.557 22.075 9.557 21.416c0-.593-.028-2.681-.028-4.85-3.338.725-4.038-1.416-4.038-1.416-.544-1.359-1.359-1.719-1.359-1.719-1.093-.744.084-.744.084-.744 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112.017 5.769a11.49 11.49 0 013.001.405c2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801 1.595 4.773-1.6 8.213-6.074 8.213-11.384C23.973 5.39 18.592.029 12.017.029z"/>
                  </svg>
                  Continuar com Apple
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
                      data-testid="link-register"
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
                      data-testid="link-login"
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
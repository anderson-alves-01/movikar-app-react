
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface SocialLoginProps {
  returnUrl?: string;
  showApple?: boolean;
  showGoogle?: boolean;
  className?: string;
}

export default function SocialLogin({ 
  returnUrl = '/', 
  showApple = true, 
  showGoogle = true,
  className = "space-y-3"
}: SocialLoginProps) {
  const [isLoading, setIsLoading] = useState<'google' | 'apple' | null>(null);

  const handleGoogleLogin = () => {
    setIsLoading('google');
    const finalReturnUrl = returnUrl || window.location.pathname;
    window.location.href = `/api/auth/google?returnUrl=${encodeURIComponent(finalReturnUrl)}`;
  };

  const handleAppleLogin = () => {
    setIsLoading('apple');
    const finalReturnUrl = returnUrl || window.location.pathname;
    window.location.href = `/api/auth/apple?returnUrl=${encodeURIComponent(finalReturnUrl)}`;
  };

  return (
    <div className={className}>
      {showGoogle && (
        <Button
          type="button"
          variant="outline"
          className="w-full hover:bg-gray-50 transition-colors"
          onClick={handleGoogleLogin}
          disabled={isLoading !== null}
        >
          {isLoading === 'google' ? (
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          ) : (
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continuar com Google
        </Button>
      )}
      
      {showApple && (
        <Button
          type="button"
          variant="outline"
          className="w-full hover:bg-gray-50 transition-colors"
          onClick={handleAppleLogin}
          disabled={isLoading !== null}
        >
          {isLoading === 'apple' ? (
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          ) : (
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.024C8.953 22.82 9.557 22.075 9.557 21.416c0-.593-.028-2.681-.028-4.85-3.338.725-4.038-1.416-4.038-1.416-.544-1.359-1.359-1.719-1.359-1.719-1.093-.744.084-.744.084-.744 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112.017 5.769a11.49 11.49 0 013.001.405c2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801 1.595 4.773-1.6 8.213-6.074 8.213-11.384C23.973 5.39 18.592.029 12.017.029z"/>
            </svg>
          )}
          Continuar com Apple
        </Button>
      )}
    </div>
  );
}

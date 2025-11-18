import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import GlassSurface from '../components/ui/GlassSurface';

export default function SignUp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, isAuthenticated } = useAuth();

  // Se já estiver autenticado, redirecionar
  React.useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleSignUp = async (provider = 'google') => {
    const redirectTo = searchParams.get('redirect') || '/';
    // No Auth.js, sign up é o mesmo que sign in para OAuth providers
    await signIn(provider, { callbackUrl: redirectTo });
  };

  return (
    <main className="bg-background text-foreground flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('pages.landing.signUp') || 'Criar Conta'}</h1>
          <p className="text-muted-foreground">
            Crie sua conta para começar a usar a plataforma
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleSignUp('google')}
            className="w-full"
            type="button"
          >
            <div style={{ "--i": "#f7971e", "--j": "#ffd200", background: "transparent" }}>
              <GlassSurface 
                width="100%" 
                height="100%" 
                borderRadius={9999} 
                className="!p-4 flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <UserPlusIcon className="w-6 h-6" />
                <span className="font-medium">Continuar com Google</span>
              </GlassSurface>
            </div>
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Ao criar uma conta, você concorda com nossos{' '}
            <a href="/terms" className="underline hover:text-foreground">
              Termos de Serviço
            </a>{' '}
            e{' '}
            <a href="/privacy" className="underline hover:text-foreground">
              Política de Privacidade
            </a>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <a 
              href="/sign-in" 
              className="underline hover:text-foreground font-medium"
              onClick={(e) => {
                e.preventDefault();
                navigate('/sign-in');
              }}
            >
              Faça login
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}


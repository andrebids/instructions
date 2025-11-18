import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import GlassSurface from '../components/ui/GlassSurface';
import { Input, Button } from '@heroui/react';

export default function SignIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Se já estiver autenticado, redirecionar
  React.useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validação básica
    if (!email.trim()) {
      setError('Por favor, insira seu email');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Por favor, insira sua senha');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const baseUrl = apiUrl.replace('/api', '');
      
      console.log('🔐 [SignIn] Iniciando login...');
      console.log('   - Base URL:', baseUrl);
      console.log('   - Email:', email.trim());
      
      // Primeiro, obter o token CSRF do Auth.js
      console.log('🔐 [SignIn] Obtendo token CSRF...');
      const csrfResponse = await fetch(`${baseUrl}/auth/csrf`, {
        credentials: 'include',
      }).catch(csrfError => {
        console.error('❌ [SignIn] Erro ao obter CSRF:', csrfError);
        throw new Error(`Erro ao conectar com o servidor: ${csrfError.message}`);
      });
      
      if (!csrfResponse || !csrfResponse.ok) {
        const errorText = csrfResponse ? await csrfResponse.text().catch(() => 'Erro desconhecido') : 'Sem resposta';
        console.error('❌ [SignIn] Erro ao obter CSRF:', errorText);
        throw new Error(`Erro ao obter token CSRF: ${csrfResponse?.status || 'Sem resposta'}`);
      }
      
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;
      console.log('✅ [SignIn] Token CSRF obtido');
      
      // Auth.js Credentials provider usa /auth/callback/credentials com CSRF token
      console.log('🔐 [SignIn] Enviando credenciais...');
      const credentialsUrl = `${baseUrl}/auth/callback/credentials`;
      console.log('   - URL:', credentialsUrl);
      
      // Usar redirect: 'manual' para capturar redirecionamentos e verificar sessão
      const response = await fetch(credentialsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        redirect: 'manual', // Não seguir redirecionamentos automaticamente
        body: new URLSearchParams({
          email: email.trim(),
          password: password,
          csrfToken: csrfToken,
          redirect: 'false', // Pedir ao Auth.js para não redirecionar (retornar JSON)
        }),
      }).catch(fetchError => {
        console.error('❌ [SignIn] Erro na requisição fetch:', fetchError);
        console.error('   - Tipo:', fetchError.name);
        console.error('   - Mensagem:', fetchError.message);
        console.error('   - Stack:', fetchError.stack);
        throw new Error(`Erro de rede: ${fetchError.message}. Verifique se o servidor está rodando na porta 5000.`);
      });

      // Verificar se a resposta é válida (status 0 indica requisição bloqueada ou opaqueredirect)
      if (!response || response.status === 0) {
        // Se for opaqueredirect, significa que o servidor tentou redirecionar
        // Isso geralmente indica sucesso, mas o navegador bloqueou devido a CORS
        // Vamos verificar a sessão para confirmar
        if (response?.type === 'opaqueredirect') {
          console.log('🔄 [SignIn] Opaque redirect detectado - verificando sessão...');
          
          // Aguardar um pouco para garantir que a sessão foi criada
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verificar se a sessão foi criada
          try {
            const sessionResponse = await fetch(`${baseUrl}/auth/session`, {
              credentials: 'include',
            });
            
            console.log('📡 [SignIn] Resposta da sessão:', {
              status: sessionResponse.status,
              ok: sessionResponse.ok,
              contentType: sessionResponse.headers.get('content-type')
            });
            
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              console.log('📋 [SignIn] Dados da sessão:', sessionData);
              
              if (sessionData?.user) {
                console.log('✅ [SignIn] Login bem-sucedido (verificado via sessão)');
                const redirectTo = searchParams.get('redirect') || '/';
                window.location.href = redirectTo;
                return;
              } else {
                console.warn('⚠️  [SignIn] Sessão OK mas sem usuário - credenciais podem estar incorretas');
              }
            } else {
              console.warn('⚠️  [SignIn] Sessão não OK - status:', sessionResponse.status);
              const errorText = await sessionResponse.text().catch(() => '');
              console.warn('   - Resposta:', errorText.substring(0, 200));
            }
          } catch (sessionError) {
            console.error('❌ [SignIn] Erro ao verificar sessão:', sessionError);
            console.error('   - Tipo:', sessionError.name);
            console.error('   - Mensagem:', sessionError.message);
          }
          
          // Se chegou aqui, a sessão não foi criada - pode ser erro de autenticação
          console.error('❌ [SignIn] Login falhou - sessão não criada');
          setError('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
          return;
        }
        
        console.error('❌ [SignIn] Requisição bloqueada (status 0) - possível problema de CORS ou rede');
        console.error('   - Response:', response);
        console.error('   - Response type:', response?.type);
        console.error('   - Response url:', response?.url);
        
        // Tentar verificar se o servidor está acessível
        try {
          const healthCheck = await fetch(`${baseUrl}/health`, { method: 'GET' });
          console.log('   - Health check:', healthCheck.status);
        } catch (healthError) {
          console.error('   - Health check falhou:', healthError);
        }
        
        setError('Erro de conexão (Status 0). Isso geralmente indica que a requisição foi bloqueada pelo navegador. Verifique: 1) Se o servidor está rodando na porta 5000, 2) Se não há problemas de CORS, 3) Se não há extensões do navegador bloqueando requisições.');
        return;
      }

      // Log da resposta para debug
      console.log('📡 [SignIn] Resposta do servidor:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        type: response.type,
        url: response.url
      });

      // Verificar se foi redirecionado (status 302 ou 303)
      if (response.status === 302 || response.status === 303) {
        const location = response.headers.get('location') || '';
        console.log('🔄 [SignIn] Redirecionamento detectado:', location);
        
        // Verificar se foi redirecionado para página de erro
        if (location.includes('/auth/error') || location.includes('error=')) {
          const urlParams = new URLSearchParams(location.split('?')[1] || '');
          const errorType = urlParams.get('error');
          console.error('❌ [SignIn] Erro de autenticação:', errorType);
          
          // Determinar mensagem de erro específica
          if (errorType === 'CredentialsSignin') {
            setError('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
          } else if (errorType === 'Configuration') {
            setError('Erro de configuração do servidor. Por favor, entre em contato com o suporte.');
          } else {
            setError(`Erro ao fazer login: ${errorType || 'Erro desconhecido'}. Verifique os logs do servidor.`);
          }
        } else if (location.includes('/sign-in')) {
          // Redirecionado de volta para sign-in significa falha na autenticação
          console.warn('⚠️  [SignIn] Redirecionado de volta para sign-in');
          setError('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
        } else {
          // Redirecionamento para outra página (sucesso)
          console.log('✅ [SignIn] Login bem-sucedido, redirecionando...');
          const redirectTo = searchParams.get('redirect') || '/';
          window.location.href = redirectTo;
          return;
        }
      } else if (response.ok) {
        // Sucesso - redirecionar
        console.log('✅ [SignIn] Login bem-sucedido (status OK)');
        const redirectTo = searchParams.get('redirect') || '/';
        window.location.href = redirectTo;
        return;
      } else {
        // Tentar ler resposta JSON ou texto
        try {
          const contentType = response.headers.get('content-type') || '';
          let data;
          
          if (contentType.includes('application/json')) {
            data = await response.json();
          } else {
            const text = await response.text();
            console.error('❌ [SignIn] Resposta de erro (texto):', text.substring(0, 200));
            
            // Tentar parsear como JSON mesmo que não seja
            try {
              data = JSON.parse(text);
            } catch {
              data = { error: text || 'Erro desconhecido' };
            }
          }
          
          console.error('❌ [SignIn] Erro completo:', data);
          setError(data.error || data.message || `Erro ao fazer login (Status: ${response.status})`);
        } catch (parseError) {
          // Se não conseguir ler a resposta, verificar status
          console.error('❌ [SignIn] Erro ao parsear resposta:', parseError);
          if (response.status === 401) {
            setError('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
          } else if (response.status === 400) {
            setError('Dados inválidos. Verifique o email e senha informados.');
          } else if (response.status === 0) {
            setError('Erro de conexão. Verifique se o servidor está rodando na porta 5000.');
          } else {
            setError(`Erro ao fazer login (Status: ${response.status}). Verifique os logs do servidor.`);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      if (error.message.includes('CSRF')) {
        setError('Erro de segurança. Por favor, recarregue a página e tente novamente.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setError('Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.');
      } else {
        setError('Erro inesperado. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-background text-foreground flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('pages.landing.signIn')}</h1>
          <p className="text-muted-foreground">{t('pages.landing.signInSubtitle')}</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          {error && (
            <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm flex items-start gap-2">
              <svg 
                className="w-5 h-5 flex-shrink-0 mt-0.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <div className="flex-1">
                <p className="font-medium mb-1">Erro no login</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <Input
            type="email"
            label="Email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full"
          />

          <Input
            type="password"
            label="Senha"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full"
          />

          <Button
            type="submit"
            color="primary"
            size="lg"
            className="w-full"
            isLoading={loading}
            disabled={loading || !email || !password}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Ao continuar, você concorda com nossos{' '}
            <a href="/terms" className="underline hover:text-foreground">
              Termos de Serviço
            </a>{' '}
            e{' '}
            <a href="/privacy" className="underline hover:text-foreground">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}


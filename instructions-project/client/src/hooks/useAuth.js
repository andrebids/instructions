import { useState, useEffect, useCallback } from 'react';
import i18n from '../i18n';
import { getServerBaseUrl } from '../utils/serverUrl.js';

/**
 * Hook para gerenciar autenticação com Auth.js
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Buscar sessão do Auth.js
  const fetchSession = useCallback(async () => {
    try {
      const baseUrl = getServerBaseUrl();
      const sessionUrl = baseUrl ? `${baseUrl}/auth/session` : '/auth/session';

      const response = await fetch(sessionUrl, {
        credentials: 'include',
        // Em desenvolvimento, adicionar cache: 'no-store' para evitar interferência do SW
        cache: import.meta.env.DEV ? 'no-store' : 'default',
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setSession(data);

          // Salvar sessão no localStorage para fallback offline
          if (data?.user) {
            localStorage.setItem('auth_session_backup', JSON.stringify(data));
          } else {
            localStorage.removeItem('auth_session_backup');
          }
        } else {
          // Se não for JSON, pode ser HTML (erro 404 ou página de erro)
          const text = await response.text();
          console.warn('Resposta não é JSON:', text.substring(0, 100));
          setSession(null);
        }
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error('Erro ao buscar sessão Auth.js:', error);

      // Fallback para localStorage se estiver offline ou erro de rede
      try {
        const cachedSession = localStorage.getItem('auth_session_backup');
        if (cachedSession) {
          console.log('🔌 [Offline] Usando sessão em cache do localStorage');
          setSession(JSON.parse(cachedSession));
        } else {
          setSession(null);
        }
      } catch (e) {
        console.error('Erro ao recuperar sessão do cache:', e);
        setSession(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();

    // Polling para atualizar sessão periodicamente
    const interval = setInterval(fetchSession, 5 * 60 * 1000); // A cada 5 minutos

    return () => clearInterval(interval);
  }, [fetchSession]);

  const signIn = async (email, password, options = {}) => {
    try {
      const baseUrl = getServerBaseUrl();

      // Auth.js Credentials provider usa /auth/callback/credentials
      const response = await fetch(`${baseUrl}/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        // Em desenvolvimento, adicionar cache: 'no-store' para evitar interferência do SW
        cache: import.meta.env.DEV ? 'no-store' : 'default',
        body: new URLSearchParams({
          email: email.trim(),
          password: password,
          redirect: 'false',
        }),
      });

      if (response.ok) {
        // Atualizar sessão após login bem-sucedido
        const fetchSession = async () => {
          const sessionUrl = `${baseUrl}/auth/session`;
          const sessionResponse = await fetch(sessionUrl, { 
            credentials: 'include',
            cache: import.meta.env.DEV ? 'no-store' : 'default',
          });
          if (sessionResponse.ok) {
            const data = await sessionResponse.json();
            setSession(data);
          }
        };
        await fetchSession();

        // Redirecionar se especificado
        if (options.callbackUrl) {
          window.location.href = options.callbackUrl;
        }
      } else {
        throw new Error('Falha na autenticação');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Usar caminho relativo em produção para evitar problemas de CSP
      const isDev = import.meta.env.DEV;
      let baseUrl;

      if (isDev && import.meta.env.VITE_API_URL) {
        const apiUrl = import.meta.env.VITE_API_URL;
        baseUrl = apiUrl.replace('/api', '');
      } else {
        // Em produção, usar caminho relativo (mesma origem)
        baseUrl = '';
      }

      // Obter token CSRF antes de fazer logout
      const csrfResponse = await fetch(`${baseUrl}/auth/csrf`, { 
        credentials: 'include',
        cache: import.meta.env.DEV ? 'no-store' : 'default',
      });
      const { csrfToken } = await csrfResponse.json();

      await fetch(`${baseUrl}/auth/signout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          csrfToken: csrfToken,
          callbackUrl: window.location.origin,
        }),
        credentials: 'include',
        // Em desenvolvimento, adicionar cache: 'no-store' para evitar interferência do SW
        cache: import.meta.env.DEV ? 'no-store' : 'default',
      });
      setSession(null);
      localStorage.removeItem('auth_session_backup'); // Limpar backup local
      
      // Definir idioma como inglês antes de redirecionar
      // Isso garante que as páginas de login e landing page sempre apareçam em inglês após logout
      localStorage.setItem('i18nextLng', 'en');
      i18n.changeLanguage('en');
      
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Função para forçar atualização da sessão
  const refreshSession = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  return {
    session,
    user: session?.user || null,
    loading,
    isAuthenticated: !!session?.user,
    signIn,
    signOut,
    refreshSession,
  };
}


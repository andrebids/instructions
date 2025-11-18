import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gerenciar autenticação com Auth.js
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Buscar sessão do Auth.js
  const fetchSession = useCallback(async () => {
    try {
      // Usar caminho relativo em produção para evitar problemas de CSP
      const isDev = import.meta.env.DEV;
      let sessionUrl;
      
      if (isDev && import.meta.env.VITE_API_URL) {
        const apiUrl = import.meta.env.VITE_API_URL;
        const baseUrl = apiUrl.replace('/api', ''); // Remover /api para obter base URL
        sessionUrl = `${baseUrl}/auth/session`;
      } else {
        // Em produção, usar caminho relativo (mesma origem)
        sessionUrl = '/auth/session';
      }
      
      const response = await fetch(sessionUrl, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setSession(data);
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
      setSession(null);
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
      
      // Auth.js Credentials provider usa /auth/callback/credentials
      const response = await fetch(`${baseUrl}/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
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
          const sessionResponse = await fetch(sessionUrl, { credentials: 'include' });
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
      
      await fetch(`${baseUrl}/auth/signout`, {
        method: 'POST',
        credentials: 'include',
      });
      setSession(null);
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


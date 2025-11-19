import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.js';

const AuthContext = createContext(null);

// Valor padrão para evitar erros durante hot reload
const defaultAuthValue = {
  session: null,
  user: null,
  loading: true,
  isAuthenticated: false,
  signIn: async () => {},
  signOut: async () => {},
  refreshSession: async () => {},
  source: 'authjs'
};

/**
 * Provider de autenticação usando Auth.js
 */
export function AuthProvider({ children }) {
  const authJs = useAuth();
  
  const activeAuth = useMemo(() => ({
    ...authJs,
    source: 'authjs'
  }), [authJs]);

  return (
    <AuthContext.Provider value={activeAuth}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook compatível com Fast Refresh
// Deve ser uma função nomeada exportada diretamente
function useAuthContext() {
  const context = useContext(AuthContext);
  
  // Durante hot reload, o contexto pode estar temporariamente null
  // Retornar valor padrão em vez de lançar erro
  if (!context) {
    // Em desenvolvimento, durante hot reload, retornar valor padrão
    if (import.meta.env.DEV) {
      console.warn('⚠️ [AuthContext] Contexto não disponível durante hot reload, usando valor padrão');
      return defaultAuthValue;
    }
    // Em produção, lançar erro
    throw new Error('useAuthContext deve ser usado dentro de AuthProvider');
  }
  
  return context;
}

// Exportar como named export para compatibilidade com Fast Refresh
export { useAuthContext };


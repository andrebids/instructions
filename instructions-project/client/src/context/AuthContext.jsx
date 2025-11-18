import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth.js';

const AuthContext = createContext(null);

/**
 * Provider de autenticação usando Auth.js
 */
export function AuthProvider({ children }) {
  const authJs = useAuth();
  
  const activeAuth = {
    ...authJs,
    source: 'authjs'
  };

  return (
    <AuthContext.Provider value={activeAuth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de AuthProvider');
  }
  return context;
}


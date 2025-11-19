import React from 'react';
import { useAuthContext } from '../../context/AuthContext';

/**
 * Componente que renderiza children apenas quando o usuário está autenticado
 * Compatível com Auth.js e Clerk
 */
export function SignedIn({ children }) {
  try {
    const { isAuthenticated, loading } = useAuthContext();

    if (loading) {
      return null; // ou um loading spinner se preferir
    }

    return isAuthenticated ? <>{children}</> : null;
  } catch (error) {
    // Durante hot reload, pode haver erros temporários
    if (import.meta.env.DEV) {
      console.warn('⚠️ [SignedIn] Erro durante hot reload:', error.message);
      return null;
    }
    throw error;
  }
}

/**
 * Componente que renderiza children apenas quando o usuário NÃO está autenticado
 * Compatível com Auth.js e Clerk
 */
export function SignedOut({ children }) {
  try {
    const { isAuthenticated, loading } = useAuthContext();

    if (loading) {
      return null; // ou um loading spinner se preferir
    }

    return !isAuthenticated ? <>{children}</> : null;
  } catch (error) {
    // Durante hot reload, pode haver erros temporários
    if (import.meta.env.DEV) {
      console.warn('⚠️ [SignedOut] Erro durante hot reload:', error.message);
      return null;
    }
    throw error;
  }
}


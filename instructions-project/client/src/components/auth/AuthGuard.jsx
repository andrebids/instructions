import React from 'react';
import { useAuthContext } from '../../context/AuthContext';

/**
 * Componente que renderiza children apenas quando o usuário está autenticado
 * Compatível com Auth.js e Clerk
 */
export function SignedIn({ children }) {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return null; // ou um loading spinner se preferir
  }

  return isAuthenticated ? <>{children}</> : null;
}

/**
 * Componente que renderiza children apenas quando o usuário NÃO está autenticado
 * Compatível com Auth.js e Clerk
 */
export function SignedOut({ children }) {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return null; // ou um loading spinner se preferir
  }

  return !isAuthenticated ? <>{children}</> : null;
}


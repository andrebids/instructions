import { useUser as useClerkUser } from '@clerk/clerk-react';
import { useMemo } from 'react';

/**
 * Hook para obter e verificar roles do usuário
 * Extrai o role do Clerk user publicMetadata
 * 
 * @returns {Object} - Objeto com role e funções helper
 */
export function useUserRole() {
  const { user: clerkUser, isLoaded } = useClerkUser();
  
  const role = useMemo(() => {
    if (!isLoaded || !clerkUser) {
      return null;
    }
    
    // Clerk armazena roles em publicMetadata.role
    // Pode ser uma string ou um array (se o usuário tiver múltiplos roles)
    const userRole = clerkUser.publicMetadata?.role;
    
    if (Array.isArray(userRole)) {
      // Se for array, retornar o primeiro role
      return userRole[0] || null;
    }
    
    return userRole || null;
  }, [clerkUser, isLoaded]);
  
  const isAdmin = useMemo(() => role === 'admin', [role]);
  const isComercial = useMemo(() => role === 'comercial', [role]);
  const isEditorStock = useMemo(() => role === 'editor_stock', [role]);
  
  const hasRole = useMemo(() => {
    return (requiredRole) => {
      if (!role) return false;
      return role === requiredRole;
    };
  }, [role]);
  
  const hasAnyRole = useMemo(() => {
    return (...roles) => {
      if (!role) return false;
      return roles.includes(role);
    };
  }, [role]);
  
  return {
    role,
    isAdmin,
    isComercial,
    isEditorStock,
    hasRole,
    hasAnyRole,
    isLoaded,
    userId: clerkUser?.id || null,
  };
}


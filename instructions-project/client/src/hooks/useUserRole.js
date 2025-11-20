import { useAuth } from './useAuth.js';
import { useMemo } from 'react';

/**
 * Hook para obter e verificar roles do usuário usando Auth.js
 * 
 * @returns {Object} - Objeto com role e funções helper
 */
export function useUserRole() {
  const authJs = useAuth();
  const activeUser = authJs.user;
  const isLoaded = !authJs.loading;

  const role = useMemo(() => {
    if (!isLoaded || !activeUser) {
      return null;
    }

    return activeUser.role || null;
  }, [activeUser, isLoaded]);

  const isAdmin = useMemo(() => role === 'admin', [role]);
  const isComercial = useMemo(() => role === 'comercial', [role]);
  const isEditorStock = useMemo(() => role === 'editor_stock', [role]);
  const isDesigner = useMemo(() => role === 'designer', [role]);

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
    isDesigner,
    hasRole,
    hasAnyRole,
    isLoaded,
    userId: activeUser?.id || null,
  };
}


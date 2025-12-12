import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import { Spinner } from '@heroui/react';

/**
 * Componente para proteger rotas baseado em roles
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes filhos a renderizar
 * @param {string|string[]} props.requireRole - Role(s) necessário(s) para acessar a rota
 * @param {string} props.redirectTo - Rota para redirecionar se não tiver permissão (padrão: '/')
 */
export default function ProtectedRoute({ 
  children, 
  requireRole, 
  redirectTo = '/' 
}) {
  const { role, isLoaded, hasAnyRole, isAdmin } = useUserRole();
  
  // Mostrar loading enquanto carrega dados do usuário
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Se não tiver role, negar acesso
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-gray-500">O seu utilizador não tem um role atribuído. Contacte o administrador.</p>
        </div>
      </div>
    );
  }
  
  // Admins têm acesso a todas as páginas
  if (isAdmin) {
    return children;
  }
  
  // Se requireRole foi especificado, verificar se o usuário tem o role necessário
  if (requireRole) {
    const requiredRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
    
    if (!hasAnyRole(...requiredRoles)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-gray-500">
              Não tem permissão para aceder a esta página.
              {requiredRoles.length > 1 
                ? ` Roles necessários: ${requiredRoles.join(', ')}.` 
                : ` Role necessário: ${requiredRoles[0]}.`}
              {' '}Seu role: {role}
            </p>
            <button
              onClick={() => window.location.href = redirectTo}
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-500/90"
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }
  }
  
  return children;
}


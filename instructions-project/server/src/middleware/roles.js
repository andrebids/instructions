import { getAuth } from '@clerk/express';

/**
 * Middleware para verificar roles do usuário
 * Extrai o role do Clerk user publicMetadata
 */

/**
 * Obtém o role do usuário autenticado
 * @param {Request} req - Express request object
 * @returns {string|null} - Role do usuário ou null se não encontrado
 */
export function getUserRole(req) {
  try {
    const auth = getAuth(req);
    
    if (!auth || !auth.userId) {
      return null;
    }
    
    // Clerk armazena roles em publicMetadata.role
    // Pode ser uma string ou um array (se o usuário tiver múltiplos roles)
    const role = auth.userPublicMetadata?.role;
    
    if (Array.isArray(role)) {
      // Se for array, retornar o primeiro role (ou podemos retornar todos)
      return role[0] || null;
    }
    
    return role || null;
  } catch (error) {
    console.error('Erro ao obter role do usuário:', error);
    return null;
  }
}

/**
 * Middleware para verificar se o usuário tem um dos roles especificados
 * @param {...string} allowedRoles - Roles permitidos
 * @returns {Function} - Express middleware function
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    try {
      const auth = getAuth(req);
      
      // Verificar se está autenticado
      if (!auth || !auth.userId) {
        return res.status(401).json({ 
          error: 'Não autenticado',
          message: 'É necessário estar autenticado para aceder a este recurso'
        });
      }
      
      // Obter role do usuário
      const userRole = getUserRole(req);
      
      // Se não tiver role definido, negar acesso
      if (!userRole) {
        return res.status(403).json({ 
          error: 'Sem permissão',
          message: 'O seu utilizador não tem um role atribuído. Contacte o administrador.'
        });
      }
      
      // Verificar se o role está na lista de roles permitidos
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          error: 'Sem permissão',
          message: `Acesso negado. Roles permitidos: ${allowedRoles.join(', ')}. Seu role: ${userRole}`
        });
      }
      
      // Adicionar role ao request para uso posterior
      req.userRole = userRole;
      req.userId = auth.userId;
      
      next();
    } catch (error) {
      console.error('Erro no middleware requireRole:', error);
      return res.status(500).json({ 
        error: 'Erro interno',
        message: 'Erro ao verificar permissões'
      });
    }
  };
}

/**
 * Middleware para verificar se o usuário é admin
 * @returns {Function} - Express middleware function
 */
export function requireAdmin() {
  return requireRole('admin');
}

/**
 * Middleware para verificar se o usuário é comercial ou admin
 * @returns {Function} - Express middleware function
 */
export function requireComercialOrAdmin() {
  return requireRole('admin', 'comercial');
}

/**
 * Middleware para verificar se o usuário é editor_stock ou admin
 * @returns {Function} - Express middleware function
 */
export function requireEditorStockOrAdmin() {
  return requireRole('admin', 'editor_stock');
}


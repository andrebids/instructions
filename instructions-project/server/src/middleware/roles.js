import { getAuth } from './auth.js';

/**
 * Middleware para verificar roles do usuário usando Auth.js
 */

/**
 * Obtém o role do usuário autenticado
 * @param {Request} req - Express request object
 * @returns {Promise<string|null>} - Role do usuário ou null se não encontrado
 */
export async function getUserRole(req) {
  try {
    const auth = await getAuth(req);
    
    if (!auth || !auth.userId) {
      console.debug('🔍 [Roles] getAuth retornou null ou sem userId');
      return null;
    }
    
    // Role vem da sessão do Auth.js
    const role = auth.role || auth.user?.role;
    
    console.debug('🔍 [Roles] Extraindo role:', {
      roleFromAuth: auth.role,
      roleFromUser: auth.user?.role,
      finalRole: role,
      userId: auth.userId
    });
    
    if (Array.isArray(role)) {
      // Se for array, retornar o primeiro role
      const firstRole = role[0] || null;
      console.debug('🔍 [Roles] Role é array, retornando primeiro:', firstRole);
      return firstRole;
    }
    
    const finalRole = role || null;
    console.debug('🔍 [Roles] Role final:', finalRole);
    return finalRole;
  } catch (error) {
    // Se houver erro, retornar null
    console.error('❌ [Roles] Erro ao obter role do usuário:', error.message);
    console.error('   - Stack:', error.stack);
    return null;
  }
}

/**
 * Middleware para verificar se o usuário tem um dos roles especificados
 * @param {...string} allowedRoles - Roles permitidos
 * @returns {Function} - Express middleware function
 */
export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const useAuthJs = process.env.USE_AUTH_JS === 'true';
      const enableAuth = process.env.ENABLE_AUTH === 'true';
      
      console.debug('🔍 [Roles Middleware] Verificando role:', {
        allowedRoles,
        useAuthJs,
        enableAuth,
        path: req.path
      });
      
      // Se Auth.js não estiver configurado, permitir acesso (modo desenvolvimento)
      if (!useAuthJs || !enableAuth) {
        console.debug('⚠️  [Roles Middleware] Auth desabilitado, permitindo acesso em modo desenvolvimento');
        // Em desenvolvimento sem auth, permitir acesso mas sem role
        req.userRole = null;
        req.userId = null;
        return next();
      }
      
      const auth = await getAuth(req);
      
      console.debug('🔍 [Roles Middleware] Resultado de getAuth:', {
        hasAuth: !!auth,
        userId: auth?.userId,
        role: auth?.role,
        source: auth?.source
      });
      
      // Verificar se está autenticado
      if (!auth || !auth.userId) {
        console.warn('⚠️  [Roles Middleware] Usuário não autenticado para:', req.path);
        return res.status(401).json({ 
          error: 'Não autenticado',
          message: 'É necessário estar autenticado para aceder a este recurso'
        });
      }
      
      // Obter role do usuário
      const userRole = await getUserRole(req);
      
      console.debug('🔍 [Roles Middleware] Role do usuário:', {
        userRole,
        userId: auth.userId,
        roleFromAuth: auth.role
      });
      
      // Se não tiver role definido, negar acesso
      if (!userRole) {
        console.warn('⚠️  [Roles Middleware] Usuário sem role atribuído:', {
          userId: auth.userId,
          email: auth.user?.email
        });
        return res.status(403).json({ 
          error: 'Sem permissão',
          message: 'O seu utilizador não tem um role atribuído. Contacte o administrador.'
        });
      }
      
      // Verificar se o role está na lista de roles permitidos
      if (!allowedRoles.includes(userRole)) {
        console.warn('⚠️  [Roles Middleware] Role insuficiente:', {
          userRole,
          allowedRoles,
          userId: auth.userId,
          path: req.path
        });
        return res.status(403).json({ 
          error: 'Sem permissão',
          message: `Acesso negado. Roles permitidos: ${allowedRoles.join(', ')}. Seu role: ${userRole}`
        });
      }
      
      // Adicionar role ao request para uso posterior
      req.userRole = userRole;
      req.userId = auth.userId;
      
      console.log('✅ [Roles Middleware] Acesso permitido:', {
        userId: auth.userId,
        role: userRole,
        path: req.path
      });
      
      next();
    } catch (error) {
      console.error('❌ [Roles Middleware] Erro no middleware requireRole:', error);
      console.error('   - Stack:', error.stack);
      // Se houver erro e Auth.js não estiver configurado, permitir acesso em desenvolvimento
      if (!process.env.USE_AUTH_JS || process.env.ENABLE_AUTH !== 'true') {
        console.debug('⚠️  [Roles Middleware] Auth desabilitado, permitindo acesso após erro');
        req.userRole = null;
        req.userId = null;
        return next();
      }
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


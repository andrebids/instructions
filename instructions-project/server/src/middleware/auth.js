/**
 * Middleware de autenticação usando Auth.js
 */

import { getSession } from '@auth/express';
import { getAuthConfig } from '../auth.config.js';
import http from 'http';

const useAuthJs = process.env.USE_AUTH_JS === 'true';

// Obter o handler do Auth.js uma vez
let authHandler = null;
if (useAuthJs) {
  try {
    authHandler = getAuthConfig();
  } catch (error) {
    console.warn('⚠️  [Auth Middleware] Não foi possível obter authConfig:', error.message);
  }
}

/**
 * Obtém informações de autenticação do usuário atual usando Auth.js
 */
export async function getAuth(req) {
  // Usar Auth.js
  if (useAuthJs && authHandler) {
    // Primeiro, tentar getSession diretamente (mais eficiente)
    // Nota: getSession pode falhar se req.authOptions não estiver configurado
    // Nesse caso, usamos o fallback HTTP que sempre funciona
    try {
      const session = await getSession(req);
      if (session?.user) {
        const authData = {
          userId: session.user.id,
          sessionId: session.sessionToken || session.sessionId,
          user: session.user,
          role: session.user.role,
          source: 'authjs'
        };
        console.log('✅ [Auth Middleware] Sessão obtida via getSession:', {
          userId: authData.userId,
          role: authData.role,
          email: authData.user?.email
        });
        return authData;
      } else {
        console.debug('🔍 [Auth Middleware] getSession retornou sessão sem usuário');
      }
    } catch (sessionError) {
      // getSession pode falhar se req.authOptions não estiver configurado
      // Isso é esperado quando chamado fora do contexto do handler do Auth.js
      // Usar requisição HTTP interna como fallback (sempre funciona)
      const isBasePathError = sessionError.message?.includes('basePath');
      if (isBasePathError) {
        // Erro esperado - getSession precisa do handler do Auth.js
        // Silenciosamente usar fallback HTTP
      } else {
        console.debug('⚠️  [Auth Middleware] getSession falhou, tentando requisição HTTP interna:', sessionError.message);
      }
      
      try {
        // Fazer requisição HTTP interna para /auth/session
        // Esta é a forma mais confiável já que sabemos que a rota funciona
        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        const sessionUrl = `${protocol}://${host}/auth/session`;
        
        console.debug('🔍 [Auth Middleware] Fazendo requisição HTTP interna para:', sessionUrl);
        
        // Fazer requisição HTTP usando o módulo http do Node.js
        const sessionData = await new Promise((resolve, reject) => {
          const url = new URL(sessionUrl);
          const options = {
            hostname: url.hostname,
            port: url.port || (protocol === 'https' ? 443 : 80),
            path: url.pathname,
            method: 'GET',
            headers: {
              'Cookie': req.headers.cookie || '',
              'Accept': 'application/json',
              'User-Agent': req.headers['user-agent'] || 'Node.js',
            }
          };
          
          const httpReq = http.request(options, (httpRes) => {
            let data = '';
            
            httpRes.on('data', (chunk) => {
              data += chunk;
            });
            
            httpRes.on('end', () => {
              if (httpRes.statusCode === 200) {
                try {
                  const parsed = JSON.parse(data);
                  resolve(parsed);
                } catch (e) {
                  console.error('❌ [Auth Middleware] Erro ao fazer parse da resposta JSON:', e.message);
                  reject(new Error('Invalid JSON response'));
                }
              } else {
                console.debug(`⚠️  [Auth Middleware] Requisição HTTP retornou status ${httpRes.statusCode}`);
                reject(new Error(`HTTP ${httpRes.statusCode}`));
              }
            });
          });
          
          httpReq.on('error', (error) => {
            console.error('❌ [Auth Middleware] Erro na requisição HTTP interna:', error.message);
            reject(error);
          });
          
          httpReq.setTimeout(2000, () => {
            httpReq.destroy();
            console.debug('⏱️  [Auth Middleware] Timeout na requisição HTTP interna');
            reject(new Error('Timeout'));
          });
          
          httpReq.end();
        });
        
        if (sessionData?.user) {
          const authData = {
            userId: sessionData.user.id,
            sessionId: sessionData.sessionToken || sessionData.sessionId,
            user: sessionData.user,
            role: sessionData.user.role,
            source: 'authjs'
          };
          console.log('✅ [Auth Middleware] Sessão obtida via requisição HTTP:', {
            userId: authData.userId,
            role: authData.role,
            email: authData.user?.email
          });
          return authData;
        } else {
          console.debug('🔍 [Auth Middleware] Requisição HTTP retornou sessão sem usuário');
        }
        } catch (httpError) {
        // Não logar erros comuns (timeout, basePath, etc)
        const isCommonError = 
          httpError.message?.includes('Timeout') ||
          httpError.message?.includes('basePath') ||
          httpError.message?.includes('ECONNREFUSED');
        
        if (!isCommonError) {
          console.error('❌ [Auth Middleware] Erro ao obter sessão via requisição HTTP:', httpError.message);
        } else {
          console.debug('🔍 [Auth Middleware] Erro comum ignorado:', httpError.message);
        }
      }
    }
  }

  return null;
}

/**
 * Middleware para verificar se o usuário está autenticado usando Auth.js
 */
export function requireAuth() {
  return async (req, res, next) => {
    const auth = await getAuth(req);
    
    if (!auth || !auth.userId) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'É necessário estar autenticado para aceder a este recurso'
      });
    }

    // Adicionar informações de auth ao request
    req.auth = auth;
    req.userId = auth.userId;
    req.userRole = auth.role;

    next();
  };
}


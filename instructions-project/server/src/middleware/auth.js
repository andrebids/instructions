/**
 * Middleware de autenticação usando Auth.js
 */

import { getSession } from '@auth/express';
import { getAuthConfig } from '../auth.config.js';
import http from 'http';
import https from 'https';

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
        
        // Detectar HTTPS corretamente (importante para produção atrás de proxy)
        // Verificar req.secure primeiro (configurado pelo Express quando trust proxy está ativo)
        // Depois verificar X-Forwarded-Proto header (comum em proxies reversos)
        // Por último usar req.protocol como fallback
        let protocol = 'http';
        if (req.secure) {
          protocol = 'https';
        } else if (req.get('x-forwarded-proto') === 'https') {
          protocol = 'https';
        } else if (req.protocol === 'https') {
          protocol = 'https';
        }
        
        const host = req.get('host') || 'localhost:5000';
        const sessionUrl = `${protocol}://${host}/auth/session`;
        
        console.debug('🔍 [Auth Middleware] Fazendo requisição HTTP interna para:', sessionUrl, {
          secure: req.secure,
          forwardedProto: req.get('x-forwarded-proto'),
          protocol: req.protocol,
          hasCookies: !!req.headers.cookie
        });
        
        // Fazer requisição HTTP/HTTPS usando o módulo apropriado do Node.js
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
              // Preservar headers importantes do request original
              'X-Forwarded-For': req.get('x-forwarded-for') || '',
              'X-Forwarded-Proto': protocol,
            }
          };
          
          // Usar módulo https para HTTPS, http para HTTP
          const httpModule = protocol === 'https' ? https : http;
          
          const httpReq = httpModule.request(options, (httpRes) => {
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
                  console.error('❌ [Auth Middleware] Erro ao fazer parse da resposta JSON:', e.message, {
                    statusCode: httpRes.statusCode,
                    dataPreview: data.substring(0, 200)
                  });
                  reject(new Error('Invalid JSON response'));
                }
              } else {
                console.debug(`⚠️  [Auth Middleware] Requisição HTTP retornou status ${httpRes.statusCode}`, {
                  url: sessionUrl,
                  hasCookies: !!req.headers.cookie
                });
                reject(new Error(`HTTP ${httpRes.statusCode}`));
              }
            });
          });
          
          httpReq.on('error', (error) => {
            console.error('❌ [Auth Middleware] Erro na requisição HTTP interna:', {
              message: error.message,
              code: error.code,
              url: sessionUrl,
              protocol: protocol
            });
            reject(error);
          });
          
          httpReq.setTimeout(5000, () => {
            httpReq.destroy();
            console.debug('⏱️  [Auth Middleware] Timeout na requisição HTTP interna', {
              url: sessionUrl,
              timeout: 5000
            });
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
        // Não logar erros comuns (timeout, basePath, etc) em modo debug
        const isCommonError = 
          httpError.message?.includes('Timeout') ||
          httpError.message?.includes('basePath') ||
          httpError.message?.includes('ECONNREFUSED');
        
        if (!isCommonError) {
          console.error('❌ [Auth Middleware] Erro ao obter sessão via requisição HTTP:', {
            message: httpError.message,
            code: httpError.code,
            stack: httpError.stack,
            hasCookies: !!req.headers.cookie,
            host: req.get('host'),
            protocol: req.protocol,
            secure: req.secure,
            forwardedProto: req.get('x-forwarded-proto')
          });
        } else {
          console.debug('🔍 [Auth Middleware] Erro comum ignorado:', httpError.message);
        }
      }
    }
  }

  // Se chegou aqui, não há sessão válida
  console.debug('🔍 [Auth Middleware] Nenhuma sessão encontrada', {
    useAuthJs,
    hasAuthHandler: !!authHandler,
    hasCookies: typeof req !== 'undefined' && !!req.headers?.cookie
  });
  
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


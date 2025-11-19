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
    // Configurar req.authOptions se não estiver configurado
    // Isso permite que getSession funcione mesmo quando chamado fora do contexto do handler
    try {
      // Se req.authOptions não estiver configurado, tentar obter do handler
      if (!req.authOptions && authHandler) {
        // O ExpressAuth handler tem uma propriedade que contém as opções
        // Tentar acessar através do handler
        try {
          // Criar um objeto de opções básico baseado na configuração
          req.authOptions = {
            basePath: '/auth',
            baseURL: process.env.AUTH_URL || undefined,
            trustHost: true,
          };
        } catch (e) {
          // Ignorar erro ao configurar authOptions
        }
      }
      
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
      // getSession pode falhar se req.authOptions não estiver configurado corretamente
      // Isso é esperado quando chamado fora do contexto do handler do Auth.js
      // Usar requisição HTTP interna como fallback (sempre funciona)
      const isBasePathError = sessionError.message?.includes('basePath') || 
                              sessionError.message?.includes('authOptions');
      if (isBasePathError) {
        // Erro esperado - getSession precisa do handler do Auth.js configurado corretamente
        console.debug('🔍 [Auth Middleware] getSession falhou (erro esperado), usando fallback HTTP:', sessionError.message);
      } else {
        console.debug('⚠️  [Auth Middleware] getSession falhou, tentando requisição HTTP interna:', sessionError.message);
      }
      
      try {
        // Fazer requisição HTTP interna para /auth/session
        // IMPORTANTE: Para requisições internas, sempre usar localhost e HTTP
        // mesmo que o request original seja HTTPS (o proxy já tratou isso)
        // Isso evita problemas com certificados SSL e conexões HTTPS internas
        
        // Obter a porta do servidor (padrão 5000) ou da variável de ambiente
        const serverPort = process.env.PORT || process.env.SERVER_PORT || 5000;
        
        // Tentar usar 127.0.0.1 primeiro (mais confiável em alguns ambientes)
        // Se falhar, tentar localhost
        const hostnames = ['127.0.0.1', 'localhost'];
        
        // Log detalhado para diagnóstico
        const cookieHeader = req.headers.cookie || '';
        const cookieNames = cookieHeader ? cookieHeader.split(';').map(c => c.trim().split('=')[0]).filter(Boolean) : [];
        
        console.log('🔍 [Auth Middleware] Tentando obter sessão via requisição HTTP interna', {
          secure: req.secure,
          forwardedProto: req.get('x-forwarded-proto'),
          protocol: req.protocol,
          hasCookies: !!cookieHeader,
          cookieCount: cookieNames.length,
          cookieNames: cookieNames.slice(0, 5), // Mostrar primeiros 5 nomes de cookies
          serverPort: serverPort,
          hostnames: hostnames
        });
        
        // Tentar cada hostname até um funcionar
        let lastError = null;
        let sessionData = null;
        for (const hostname of hostnames) {
          try {
            const sessionUrl = `http://${hostname}:${serverPort}/auth/session`;
            console.debug(`🔍 [Auth Middleware] Tentando ${hostname}:${serverPort}/auth/session`);
            
            // Fazer requisição HTTP interna
            sessionData = await new Promise((resolve, reject) => {
              const options = {
                hostname: hostname,
                port: serverPort,
                path: '/auth/session',
                method: 'GET',
                headers: {
                  'Cookie': req.headers.cookie || '',
                  'Accept': 'application/json',
                  'User-Agent': req.headers['user-agent'] || 'Node.js',
                  // Preservar headers importantes do request original para que o Auth.js funcione corretamente
                  // IMPORTANTE: Manter o Host original para que o Auth.js possa validar corretamente
                  'Host': req.get('host') || `${hostname}:${serverPort}`,
                  'X-Forwarded-For': req.get('x-forwarded-for') || req.ip || '',
                  'X-Forwarded-Proto': req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http'),
                  'X-Forwarded-Host': req.get('host') || `${hostname}:${serverPort}`,
                  'X-Real-IP': req.ip || '',
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
                      console.error('❌ [Auth Middleware] Erro ao fazer parse da resposta JSON:', e.message, {
                        statusCode: httpRes.statusCode,
                        dataPreview: data.substring(0, 200),
                        contentType: httpRes.headers['content-type']
                      });
                      reject(new Error('Invalid JSON response'));
                    }
                  } else {
                    // Log detalhado quando a requisição falha
                    console.error(`❌ [Auth Middleware] Requisição HTTP retornou status ${httpRes.statusCode}`, {
                      hostname: hostname,
                      port: serverPort,
                      hasCookies: !!req.headers.cookie,
                      cookieHeader: req.headers.cookie ? req.headers.cookie.substring(0, 200) : 'none',
                      responseHeaders: httpRes.headers,
                      responseData: data.substring(0, 500)
                    });
                    reject(new Error(`HTTP ${httpRes.statusCode}: ${data.substring(0, 100)}`));
                  }
                });
              });
              
              httpReq.on('error', (error) => {
                console.debug(`⚠️  [Auth Middleware] Erro na requisição HTTP interna para ${hostname}:`, {
                  message: error.message,
                  code: error.code,
                  port: serverPort
                });
                reject(error);
              });
              
              httpReq.setTimeout(3000, () => {
                httpReq.destroy();
                console.debug(`⏱️  [Auth Middleware] Timeout na requisição HTTP interna para ${hostname}`);
                reject(new Error('Timeout'));
              });
              
              httpReq.end();
            });
            
            // Se chegou aqui, a requisição foi bem-sucedida
            break;
          } catch (error) {
            lastError = error;
            console.debug(`⚠️  [Auth Middleware] Falha ao conectar em ${hostname}, tentando próximo...`);
            // Continuar para o próximo hostname
          }
        }
        
        // Se todas as tentativas falharam, lançar o último erro
        if (lastError || !sessionData) {
          if (lastError) {
            throw lastError;
          } else {
            throw new Error('Nenhuma requisição HTTP interna retornou dados válidos');
          }
        }
        
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


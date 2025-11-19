import { ExpressAuth } from "@auth/express";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import Credentials from "@auth/express/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import sequelize from "./config/database.js";

// Criar cliente Supabase para o adapter
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verificar se Auth.js está habilitado
const useAuthJs = process.env.USE_AUTH_JS === 'true';

export function getAuthConfig() {
  if (!useAuthJs) {
    return null; // Retornar null se não estiver usando Auth.js
  }

  console.log('🔧 [Auth Config] Inicializando configuração do Auth.js...');
  console.log('   - USE_AUTH_JS:', useAuthJs);
  console.log('   - AUTH_SECRET:', process.env.AUTH_SECRET ? '✅ configurado' : '❌ não configurado');
  console.log('   - SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ configurado' : '❌ não configurado');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ configurado' : '❌ não configurado');

  // Validar variáveis obrigatórias
  if (!process.env.AUTH_SECRET) {
    console.error('❌ AUTH_SECRET não está configurado! Auth.js requer AUTH_SECRET.');
    throw new Error('AUTH_SECRET não está configurado');
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não estão configurados!');
    throw new Error('Configuração do Supabase incompleta');
  }

  // Usar apenas Credentials provider (email/password)
  const providers = [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 [Auth] ========== AUTHORIZE CALLBACK ==========');
        console.log('🔐 [Auth] Tentativa de login:', { email: credentials?.email });

        if (!credentials?.email || !credentials?.password) {
          console.warn('⚠️  [Auth] Credenciais incompletas');
          return null;
        }

        try {
          const emailLower = credentials.email.toLowerCase().trim();
          console.log('🔍 [Auth] Buscando usuário:', emailLower);

          // Usar SQL direto via Sequelize porque o schema next_auth não está acessível via REST API
          // mesmo após expor o schema, pode haver delay ou problemas de configuração
          const users = await sequelize.query(
            `SELECT * FROM next_auth.users WHERE LOWER(TRIM(email)) = :email LIMIT 1`,
            {
              replacements: { email: emailLower },
              type: sequelize.QueryTypes.SELECT
            }
          );

          const user = users && users.length > 0 ? users[0] : null;

          if (!user) {
            console.warn('⚠️  [Auth] Usuário não encontrado:', emailLower);
            return null;
          }

          console.log('✅ [Auth] Usuário encontrado:', { id: user.id, email: user.email, hasPassword: !!user.password });

          // Verificar se o usuário tem senha configurada
          if (!user.password) {
            console.warn('⚠️  [Auth] Usuário não tem senha configurada:', user.email);
            return null;
          }

          console.log('🔐 [Auth] Verificando senha...');
          // Verificar senha usando bcrypt
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);

          if (!passwordMatch) {
            console.warn('⚠️  [Auth] Senha incorreta para usuário:', user.email);
            return null;
          }

          console.log('✅ [Auth] Senha correta! Criando sessão para:', user.email);

          // Atualizar last_login
          try {
            await sequelize.query(
              `UPDATE next_auth.users SET last_login = NOW() WHERE id = :userId`,
              {
                replacements: { userId: user.id },
                type: sequelize.QueryTypes.UPDATE
              }
            );
            console.log('✅ [Auth] last_login atualizado para:', user.email);
          } catch (updateError) {
            console.error('❌ [Auth] Erro ao atualizar last_login:', updateError);
            // Não bloquear login por erro na atualização de data
          }

          // Retornar dados do usuário para criar sessão
          const userData = {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            image: user.image,
            role: user.role || 'comercial',
          };

          console.log('✅ [Auth] Retornando dados do usuário:', userData);
          console.log('🔐 [Auth] ========== FIM AUTHORIZE ==========');

          return userData;
        } catch (error) {
          console.error('❌ [Auth] Erro na autenticação:', error);
          console.error('   - Stack:', error.stack);
          return null;
        }
      }
    })
  ];

  console.log('🔧 [Auth Config] Criando ExpressAuth com SupabaseAdapter...');

  try {
    // Criar o adapter uma única vez
    const adapter = SupabaseAdapter({
      url: process.env.SUPABASE_URL,
      secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
    console.log('✅ [Auth Config] SupabaseAdapter criado com sucesso');

    // Criar ExpressAuth com o adapter
    // IMPORTANTE: O provider Credentials requer strategy: "jwt" mesmo quando usando adapter
    // O adapter será usado para armazenar sessões, mas a estratégia deve ser JWT
    const isProduction = process.env.NODE_ENV === 'production';
    const authConfig = ExpressAuth({
      trustHost: true, // Necessário quando servido através de proxy
      secret: process.env.AUTH_SECRET,
      adapter: adapter,
      // Configurar URL base para produção (importante para cookies)
      basePath: '/auth',
      ...(process.env.AUTH_URL && { baseURL: process.env.AUTH_URL }),
      session: {
        strategy: "jwt", // Credentials provider requer JWT strategy, mesmo com adapter
        // Configuração de cookies para produção
        ...(isProduction && {
          maxAge: 30 * 24 * 60 * 60, // 30 dias
        }),
      },
      // Configuração de cookies para produção HTTPS
      cookies: isProduction ? {
        sessionToken: {
          name: isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token',
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: true, // Apenas HTTPS em produção
          },
        },
        callbackUrl: {
          name: isProduction ? '__Secure-authjs.callback-url' : 'authjs.callback-url',
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: true,
          },
        },
        csrfToken: {
          name: isProduction ? '__Host-authjs.csrf-token' : 'authjs.csrf-token',
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: true,
          },
        },
      } : undefined,
      providers: providers,
      callbacks: {
        async session({ session, token }) {
          // Com JWT strategy, os dados do usuário vêm do token, não do user
          console.log('🔐 [Auth] Session callback chamado');
          console.log('   - Session:', session ? `existe (user: ${session.user ? 'existe' : 'null'})` : 'null');
          console.log('   - Token:', token ? `existe (sub: ${token.sub}, role: ${token.role})` : 'null');

          if (!token) {
            console.warn('⚠️  [Auth] Session callback - token não disponível');
            console.warn('   - Retornando sessão vazia');
            return session;
          }

          if (token.sub) {
            console.log('✅ [Auth] Adicionando dados do usuário à sessão');

            // Garantir que o ID do usuário está na sessão (vem do token.sub)
            if (!session.user) {
              session.user = {};
            }
            session.user.id = token.sub;

            // Buscar dados atualizados do usuário da tabela next_auth.users usando SQL direto
            // Isso garante que sempre temos os dados mais recentes (nome, email, role, image)
            try {
              const userDataArray = await sequelize.query(
                `SELECT id, name, email, image, role FROM next_auth.users WHERE id = :userId LIMIT 1`,
                {
                  replacements: { userId: token.sub },
                  type: sequelize.QueryTypes.SELECT
                }
              );
              const userData = userDataArray && userDataArray.length > 0 ? userDataArray[0] : null;

              if (userData) {
                // Sempre usar dados do banco (mais atualizados)
                session.user.name = userData.name || userData.email || token.name || session.user.email;
                session.user.email = userData.email || token.email || session.user.email;
                session.user.role = userData.role || token.role || 'comercial';
                session.user.image = userData.image || token.image || session.user.image;
                console.log('   - Dados do banco:', {
                  name: session.user.name,
                  email: session.user.email,
                  role: session.user.role
                });
              } else {
                // Fallback para dados do token se não encontrar no banco
                session.user.email = token.email || session.user.email;
                session.user.name = token.name || session.user.email;
                session.user.role = token?.role || 'comercial';
                console.log('   - Usando dados do token (usuário não encontrado no banco)');
              }
            } catch (error) {
              console.error('❌ [Auth] Erro ao buscar dados do usuário:', error);
              // Fallback para dados do token em caso de erro
              session.user.email = token.email || session.user.email;
              session.user.name = token.name || session.user.email;
              session.user.role = token?.role || 'comercial';
            }

            console.log('✅ [Auth] Sessão atualizada:', {
              userId: session.user.id,
              email: session.user.email,
              role: session.user.role
            });
          } else {
            console.warn('⚠️  [Auth] Session callback - token.sub não disponível');
            console.warn('   - Token completo:', JSON.stringify(token, null, 2));
          }

          return session;
        },
        async jwt({ token, user, account, profile }) {
          // Adicionar dados do usuário ao token quando fizer login
          console.log('🔐 [Auth] JWT callback chamado');
          console.log('   - Token:', token ? `existe (sub: ${token.sub})` : 'null');
          console.log('   - User:', user ? `existe (id: ${user.id}, email: ${user.email})` : 'null');
          console.log('   - Account:', account ? 'existe' : 'null');
          console.log('   - Profile:', profile ? 'existe' : 'null');

          if (user) {
            // Durante o login, usar dados do user
            console.log('✅ [Auth] Adicionando dados do usuário ao token (login)');
            token.sub = user.id;
            token.role = user.role || 'comercial';
            token.email = user.email;
            token.name = user.name;
            console.log('   - Token atualizado:', { sub: token.sub, role: token.role, email: token.email, name: token.name });
          } else if (token.sub) {
            // Durante refresh/atualização, buscar dados mais recentes do banco
            console.log('🔄 [Auth] JWT callback - buscando dados atualizados do banco para userId:', token.sub);
            try {
              const users = await sequelize.query(
                `SELECT id, name, email, image, role FROM next_auth.users WHERE id = :userId LIMIT 1`,
                {
                  replacements: { userId: token.sub },
                  type: sequelize.QueryTypes.SELECT
                }
              );

              if (users && users.length > 0) {
                const dbUser = users[0];
                console.log('✅ [Auth] Dados atualizados encontrados no banco:', {
                  id: dbUser.id,
                  name: dbUser.name,
                  email: dbUser.email,
                  role: dbUser.role
                });

                // Atualizar token com dados mais recentes
                token.role = dbUser.role || token.role || 'comercial';
                token.email = dbUser.email || token.email;
                token.name = dbUser.name || token.email; // Usar email como fallback se name for null
                console.log('   - Token atualizado com dados do banco:', {
                  sub: token.sub,
                  role: token.role,
                  email: token.email,
                  name: token.name
                });
              } else {
                console.warn('⚠️  [Auth] Usuário não encontrado no banco para atualizar token');
              }
            } catch (error) {
              console.error('❌ [Auth] Erro ao buscar dados atualizados do banco:', error.message);
              // Em caso de erro, manter dados do token existente
            }
          } else {
            console.log('⚠️  [Auth] JWT callback - token sem sub, não é possível atualizar');
          }

          return token;
        },
        async redirect({ url, baseUrl }) {
          // Permitir redirecionamentos relativos e absolutos dentro do mesmo domínio
          // O Auth.js já gerencia isso automaticamente
          return url.startsWith(baseUrl) ? url : baseUrl;
        }
      },
      pages: {
        signIn: '/sign-in',
        signOut: '/sign-out',
        error: '/auth/error',
      },
    });
    console.log('✅ [Auth Config] ExpressAuth criado com sucesso');
    return authConfig;
  } catch (authError) {
    console.error('❌ [Auth Config] Erro ao criar ExpressAuth:', authError);
    console.error('   - Mensagem:', authError.message);
    console.error('   - Stack:', authError.stack);
    throw authError;
  }
}


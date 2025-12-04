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

  const isDevelopment = process.env.NODE_ENV !== 'production';
  if (isDevelopment) {
    console.log('🔧 [Auth Config] Inicializando configuração do Auth.js...');
  }

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
        if (!credentials?.email || !credentials?.password) {
          console.warn('⚠️  [Auth] Credenciais incompletas');
          return null;
        }

        try {
          const emailLower = credentials.email.toLowerCase().trim();

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

          // Verificar se o usuário tem senha configurada
          if (!user.password) {
            console.warn('⚠️  [Auth] Usuário não tem senha configurada:', user.email);
            return null;
          }

          // Verificar senha usando bcrypt
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);

          if (!passwordMatch) {
            console.warn('⚠️  [Auth] Senha incorreta para usuário:', user.email);
            return null;
          }

          // Atualizar last_login
          try {
            await sequelize.query(
              `UPDATE next_auth.users SET last_login = NOW() WHERE id = :userId`,
              {
                replacements: { userId: user.id },
                type: sequelize.QueryTypes.UPDATE
              }
            );
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

          return userData;
        } catch (error) {
          console.error('❌ [Auth] Erro na autenticação:', error);
          console.error('   - Stack:', error.stack);
          return null;
        }
      }
    })
  ];

  try {
    // Criar o adapter uma única vez
    const adapter = SupabaseAdapter({
      url: process.env.SUPABASE_URL,
      secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
    });

    // Criar ExpressAuth com o adapter
    // IMPORTANTE: O provider Credentials requer strategy: "jwt" mesmo quando usando adapter
    // O adapter será usado para armazenar sessões, mas a estratégia deve ser JWT
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Configurar basePath/baseURL sem redundância
    // Se AUTH_URL estiver definido, ele já deve incluir o caminho completo (ex: http://localhost:5001/auth)
    // Se não estiver definido, usar apenas basePath
    const authConfigOptions = {
      trustHost: true, // Necessário quando servido através de proxy
      secret: process.env.AUTH_SECRET,
      adapter: adapter,
    };
    
    if (process.env.AUTH_URL) {
      // Se AUTH_URL está definido, usar apenas baseURL (ele já inclui o caminho)
      authConfigOptions.baseURL = process.env.AUTH_URL;
    } else {
      // Se AUTH_URL não está definido, usar apenas basePath
      authConfigOptions.basePath = '/auth';
    }
    
    const authConfig = ExpressAuth({
      ...authConfigOptions,
      session: {
        strategy: "jwt", // Credentials provider requer JWT strategy, mesmo com adapter
        // Configuração de cookies para produção
        ...(isProduction && {
          maxAge: 30 * 24 * 60 * 60, // 30 dias
        }),
      },
      // Configuração de cookies - usar configuração padrão do Auth.js
      // O Auth.js já configura cookies corretamente baseado no ambiente
      // Não sobrescrever a menos que seja absolutamente necessário
      providers: providers,
      callbacks: {
        async session({ session, token }) {
          // Com JWT strategy, os dados do usuário vêm do token, não do user
          if (!token) {
            console.warn('⚠️  [Auth] Session callback - token não disponível');
            return session;
          }

          if (token.sub) {
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
              } else {
                // Fallback para dados do token se não encontrar no banco
                session.user.email = token.email || session.user.email;
                session.user.name = token.name || session.user.email;
                session.user.role = token?.role || 'comercial';
              }
            } catch (error) {
              console.error('❌ [Auth] Erro ao buscar dados do usuário:', error);
              // Fallback para dados do token em caso de erro
              session.user.email = token.email || session.user.email;
              session.user.name = token.name || session.user.email;
              session.user.role = token?.role || 'comercial';
            }
          } else {
            console.warn('⚠️  [Auth] Session callback - token.sub não disponível');
          }

          return session;
        },
        async jwt({ token, user, account, profile }) {
          // Adicionar dados do usuário ao token quando fizer login
          if (user) {
            // Durante o login, usar dados do user
            token.sub = user.id;
            token.role = user.role || 'comercial';
            token.email = user.email;
            token.name = user.name;
          } else if (token.sub) {
            // Durante refresh/atualização, buscar dados mais recentes do banco
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
                // Atualizar token com dados mais recentes
                token.role = dbUser.role || token.role || 'comercial';
                token.email = dbUser.email || token.email;
                token.name = dbUser.name || token.email; // Usar email como fallback se name for null
              }
            } catch (error) {
              console.error('❌ [Auth] Erro ao buscar dados atualizados do banco:', error.message);
              // Em caso de erro, manter dados do token existente
            }
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
    if (isDevelopment) {
      console.log('✅ [Auth Config] ExpressAuth configurado com sucesso');
    }
    return authConfig;
  } catch (authError) {
    console.error('❌ [Auth Config] Erro ao criar ExpressAuth:', authError);
    console.error('   - Mensagem:', authError.message);
    console.error('   - Stack:', authError.stack);
    throw authError;
  }
}


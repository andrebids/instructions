import express from 'express';
import { signIn, signOut } from '../auth.js';
import { getAuthConfig } from '../auth.config.js';

const router = express.Router();

// Verificar se Auth.js está habilitado
const useAuthJs = process.env.USE_AUTH_JS === 'true';

// Tentar obter configuração do Auth.js com tratamento de erros
let authConfig = null;
if (useAuthJs) {
  try {
    authConfig = getAuthConfig();
    if (!authConfig) {
      console.error('❌ [Auth Routes] getAuthConfig() retornou null');
    }
  } catch (error) {
    console.error('❌ [Auth Routes] Erro ao inicializar Auth.js:', error);
    console.error('   - Stack:', error.stack);
    console.error('   - Verifique se AUTH_SECRET, SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão configurados');
    authConfig = null;
  }
}

if (useAuthJs && authConfig) {
  // Conforme a documentação do Auth.js Express:
  // "To signin or signout with Express, send a request to the appropriate REST API Endpoints
  // from your client (i.e. /auth/signin, /auth/signout, etc.)"
  //
  // A documentação mostra criar rotas POST explícitas que chamam signIn e signOut:
  // router.post("/auth/signin", async (req, res) => { await signIn(req, res); res.redirect("/dashboard"); })
  // router.post("/auth/signout", async (req, res) => { await signOut(req, res); res.redirect("/"); })

  // POST /auth/signin - Rota para fazer login
  // Conforme documentação: router.post("/auth/signin", async (req, res) => { await signIn(req, res); res.redirect("/dashboard"); })
  router.post('/signin', async (req, res) => {
    try {
      await signIn(req, res);
      // Se não houve redirecionamento automático, redirecionar para dashboard
      if (!res.headersSent) {
        const redirectTo = req.body?.redirectTo || req.query?.redirectTo || '/dashboard';
        res.redirect(redirectTo);
      }
    } catch (error) {
      console.error('❌ [Auth] Erro no signin:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Sign in failed', message: error.message });
      }
    }
  });

  // POST /auth/signout - Rota para fazer logout
  // Conforme documentação: router.post("/auth/signout", async (req, res) => { await signOut(req, res); res.redirect("/"); })
  router.post('/signout', async (req, res) => {
    try {
      await signOut(req, res);
      // Se não houve redirecionamento automático, redirecionar para home
      if (!res.headersSent) {
        res.redirect('/');
      }
    } catch (error) {
      console.error('❌ [Auth] Erro no signout:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Sign out failed', message: error.message });
      }
    }
  });

  // Montar todas as outras rotas do Auth.js em /auth/*
  // Isso inclui /auth/callback/credentials, /auth/session, /auth/csrf, etc.
  // IMPORTANTE: Esta linha deve vir DEPOIS das rotas customizadas acima
  // para que as rotas customizadas tenham prioridade
  router.use('/*', authConfig);
  
  console.log('✅ Auth.js routes configuradas em /auth/*');
  console.log('✅ Rotas customizadas /auth/signin e /auth/signout criadas conforme documentação');
  console.log('   - POST /auth/signin (chama signIn e redireciona para /dashboard)');
  console.log('   - POST /auth/signout (chama signOut e redireciona para /)');
  console.log('   - POST /auth/callback/credentials (para login com email/senha)');
  console.log('   - GET /auth/session (para obter sessão atual)');
  console.log('   - GET /auth/csrf (para obter token CSRF)');
} else if (useAuthJs && !authConfig) {
  // Se Auth.js está habilitado mas a configuração falhou
  router.use('/*', (req, res) => {
    res.status(500).json({ 
      error: 'Auth.js configuration error',
      message: 'There was a problem with the server configuration. Check the server logs for more information.',
      details: 'Auth.js está habilitado mas a configuração falhou. Verifique: AUTH_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
    });
  });
  console.error('❌ Auth.js está habilitado mas a configuração falhou!');
  console.error('   Verifique os logs acima para mais detalhes');
} else {
  // Se Auth.js não estiver habilitado, retornar 404 ou mensagem
  router.use('/*', (req, res) => {
    res.status(404).json({ 
      error: 'Auth.js não está habilitado',
      message: 'Configure USE_AUTH_JS=true no .env para habilitar'
    });
  });
  console.log('⚠️  Auth.js desabilitado (USE_AUTH_JS != true)');
}

export default router;


/**
 * Arquivo auth.js que exporta funções signIn e signOut
 * Conforme documentação do Auth.js Express
 */

import { getAuthConfig } from './auth.config.js';

const useAuthJs = process.env.USE_AUTH_JS === 'true';
const authConfig = getAuthConfig();

/**
 * Função signIn - processa o login do usuário
 * Conforme documentação: await signIn(req, res)
 */
export async function signIn(req, res) {
  if (!useAuthJs || !authConfig) {
    return res.status(500).json({ error: 'Auth.js não está configurado' });
  }

  try {
    // O ExpressAuth já gerencia a rota /auth/signin automaticamente
    // Vamos passar a requisição para o middleware do Auth.js
    // O Auth.js processará a requisição e redirecionará conforme configurado
    await new Promise((resolve, reject) => {
      authConfig(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (error) {
    console.error('❌ [Auth] Erro no signIn:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Sign in failed', message: error.message });
    }
    throw error;
  }
}

/**
 * Função signOut - processa o logout do usuário
 * Conforme documentação: await signOut(req, res)
 */
export async function signOut(req, res) {
  if (!useAuthJs || !authConfig) {
    return res.status(500).json({ error: 'Auth.js não está configurado' });
  }

  try {
    // O ExpressAuth já gerencia a rota /auth/signout automaticamente
    // Vamos passar a requisição para o middleware do Auth.js
    await new Promise((resolve, reject) => {
      authConfig(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (error) {
    console.error('❌ [Auth] Erro no signOut:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Sign out failed', message: error.message });
    }
    throw error;
  }
}


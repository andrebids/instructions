import { createClient } from '@supabase/supabase-js';
import { logError, logInfo } from '../utils/projectLogger.js';

/**
 * Serviço para integração com Supabase Auth Admin API
 * Gerencia todas as operações de autenticação e usuários no Supabase
 */

// Cliente Supabase Admin (singleton)
let supabaseAdmin = null;

/**
 * Obtém ou cria o cliente Supabase Admin
 * @returns {Object} Cliente Supabase Admin
 * @throws {Error} Se SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não estiverem configurados
 */
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return supabaseAdmin;
}

/**
 * Lista todos os usuários do Supabase Auth
 * @returns {Promise<Object>} Lista de usuários
 */
export async function listSupabaseUsers() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      logError('Erro ao listar usuários do Supabase', {
        error: error.message,
        code: error.status,
      });
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    logError('Erro ao listar usuários do Supabase', error);
    throw error;
  }
}

/**
 * Busca usuário no Supabase Auth por ID
 * @param {string} id - ID do usuário
 * @returns {Promise<Object>} Dados do usuário
 * @throws {Error} Se usuário não for encontrado
 */
export async function getSupabaseUserById(id) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.getUserById(id);

    if (error) {
      logError('Erro ao buscar usuário no Supabase', {
        error: error.message,
        userId: id,
      });
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Utilizador não encontrado');
    }

    return data.user;
  } catch (error) {
    logError('Erro ao buscar usuário no Supabase', { error: error.message, userId: id });
    throw error;
  }
}

/**
 * Verifica se um email já existe no Supabase Auth
 * @param {string} email - Email a verificar
 * @returns {Promise<boolean>} True se email existe, false caso contrário
 */
export async function checkEmailExistsInSupabase(email) {
  try {
    const { users } = await listSupabaseUsers();
    if (!users) {
      return false;
    }

    return users.some(user => user.email === email);
  } catch (error) {
    logError('Erro ao verificar email no Supabase', error);
    // Em caso de erro, retornar false para não bloquear operações
    return false;
  }
}

/**
 * Cria um novo usuário no Supabase Auth
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.email - Email
 * @param {string} userData.password - Senha
 * @param {Object} [userData.user_metadata] - Metadados do usuário
 * @param {Object} [userData.app_metadata] - Metadados da aplicação (role, etc.)
 * @param {boolean} [userData.email_confirm=true] - Confirmar email automaticamente
 * @returns {Promise<Object>} Dados do usuário criado
 */
export async function createSupabaseUser(userData) {
  try {
    const supabase = getSupabaseAdmin();
    
    logInfo('Criando usuário no Supabase Auth', {
      email: userData.email,
      email_confirm: userData.email_confirm !== false,
    });

    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: userData.email_confirm !== false,
      user_metadata: userData.user_metadata || {},
      app_metadata: userData.app_metadata || {},
    });

    if (error) {
      logError('Erro ao criar usuário no Supabase', {
        error: error.message,
        code: error.status,
        email: userData.email,
      });
      throw new Error(error.message);
    }

    logInfo('Usuário criado com sucesso no Supabase Auth', {
      userId: data?.user?.id,
      email: data?.user?.email,
    });

    return data.user;
  } catch (error) {
    logError('Erro ao criar usuário no Supabase', error);
    throw error;
  }
}

/**
 * Atualiza um usuário no Supabase Auth
 * @param {string} id - ID do usuário
 * @param {Object} updates - Dados a atualizar
 * @returns {Promise<Object>} Dados do usuário atualizado
 */
export async function updateSupabaseUser(id, updates) {
  try {
    const supabase = getSupabaseAdmin();
    
    logInfo('Atualizando usuário no Supabase Auth', {
      userId: id,
      updates: Object.keys(updates),
    });

    const { data, error } = await supabase.auth.admin.updateUserById(id, updates);

    if (error) {
      logError('Erro ao atualizar usuário no Supabase', {
        error: error.message,
        userId: id,
      });
      throw new Error(error.message);
    }

    logInfo('Usuário atualizado com sucesso no Supabase Auth', {
      userId: id,
    });

    return data.user;
  } catch (error) {
    logError('Erro ao atualizar usuário no Supabase', { error: error.message, userId: id });
    throw error;
  }
}

/**
 * Remove um usuário do Supabase Auth
 * @param {string} id - ID do usuário
 * @returns {Promise<void>}
 */
export async function deleteSupabaseUser(id) {
  try {
    const supabase = getSupabaseAdmin();
    
    logInfo('Removendo usuário do Supabase Auth', { userId: id });

    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      logError('Erro ao remover usuário do Supabase', {
        error: error.message,
        userId: id,
      });
      throw new Error(error.message);
    }

    logInfo('Usuário removido com sucesso do Supabase Auth', { userId: id });
  } catch (error) {
    logError('Erro ao remover usuário do Supabase', { error: error.message, userId: id });
    throw error;
  }
}

/**
 * Envia convite por email para um usuário
 * @param {string} email - Email do usuário
 * @param {Object} [options] - Opções do convite
 * @param {string} [options.role] - Role do usuário
 * @returns {Promise<Object>} Dados do usuário convidado
 */
export async function inviteUserByEmail(email, options = {}) {
  try {
    const supabase = getSupabaseAdmin();
    
    logInfo('Enviando convite via Supabase', {
      email,
      role: options.role || 'comercial',
    });

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        role: options.role || 'comercial',
      },
    });

    if (error) {
      logError('Erro ao enviar convite via Supabase', {
        error: error.message,
        email,
      });
      throw new Error(error.message);
    }

    logInfo('Convite enviado com sucesso via Supabase', {
      email,
      userId: data?.user?.id,
    });

    return data.user;
  } catch (error) {
    logError('Erro ao enviar convite via Supabase', { error: error.message, email });
    throw error;
  }
}


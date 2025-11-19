import { logError } from './projectLogger.js';

/**
 * Utilitários para transformação de dados de usuários
 * Converte entre formatos de diferentes fontes (next_auth.users, Supabase Auth)
 */

/**
 * Transforma usuário da tabela next_auth.users para formato da aplicação
 * @param {Object} user - Usuário da tabela next_auth.users
 * @returns {Object} Usuário no formato da aplicação
 */
export function transformUserFromNextAuth(user) {
  // Validar que user existe e tem id
  if (!user || !user.id) {
    logError('transformUserFromNextAuth - Usuário inválido ou sem ID', { user });
    throw new Error('Usuário inválido: sem ID');
  }

  // Separar nome completo em firstName e lastName
  const nameParts = parseNameParts(user.name || '');
  const firstName = nameParts.firstName;
  const lastName = nameParts.lastName;
  const fullName = buildFullName(firstName, lastName, user.email);

  // Transformar emailVerified: se for timestamp, verificar se não é null; se for boolean, usar diretamente
  let emailVerified = false;
  if (user.emailVerified !== null && user.emailVerified !== undefined) {
    // Se for timestamp, verificar se é uma data válida
    if (user.emailVerified instanceof Date || (typeof user.emailVerified === 'string' && user.emailVerified.length > 0)) {
      emailVerified = true;
    } else if (typeof user.emailVerified === 'boolean') {
      emailVerified = user.emailVerified;
    }
  }

  const transformed = {
    id: user.id,
    firstName: firstName,
    lastName: lastName,
    fullName: fullName,
    email: user.email || '',
    role: user.role || null,
    imageUrl: user.image || null,
    createdAt: user.created_at ? new Date(user.created_at).toISOString() : null,
    lastLogin: user.last_login ? new Date(user.last_login).toISOString() : null,
    emailVerified: emailVerified,
  };

  return transformed;
}

/**
 * Transforma usuário do Supabase Auth para formato da aplicação
 * @param {Object} user - Usuário do Supabase Auth
 * @returns {Object} Usuário no formato da aplicação
 */
export function transformUserFromSupabase(user) {
  const rawUserMeta = user.user_metadata || {};
  const rawAppMeta = user.app_metadata || {};

  // Extrair nome (firstName, lastName) de raw_user_meta_data
  const firstName = rawUserMeta.firstName || rawUserMeta.first_name || '';
  const lastName = rawUserMeta.lastName || rawUserMeta.last_name || '';
  const fullName = buildFullName(firstName, lastName, user.email);

  // Extrair role de raw_app_meta_data
  const role = rawAppMeta.role || null;

  // Extrair imagem de perfil
  const imageUrl = rawUserMeta.avatar_url || rawUserMeta.imageUrl || rawUserMeta.image || null;

  return {
    id: user.id,
    firstName: firstName,
    lastName: lastName,
    fullName: fullName,
    email: user.email || '',
    role: role,
    imageUrl: imageUrl,
    createdAt: user.created_at ? new Date(user.created_at).toISOString() : null,
    lastSignInAt: user.last_sign_in_at ? new Date(user.last_sign_in_at).toISOString() : null,
    emailVerified: user.email_confirmed_at !== null,
  };
}

/**
 * Constrói nome completo a partir de firstName, lastName e email (fallback)
 * @param {string} firstName - Primeiro nome
 * @param {string} lastName - Último nome
 * @param {string} email - Email (usado como fallback)
 * @returns {string} Nome completo
 */
export function buildFullName(firstName, lastName, email) {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  return fullName || email || 'Sem nome';
}

/**
 * Separa nome completo em firstName e lastName
 * @param {string} fullName - Nome completo
 * @returns {Object} Objeto com firstName e lastName
 */
export function parseNameParts(fullName) {
  if (!fullName) {
    return { firstName: '', lastName: '' };
  }

  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return { firstName, lastName };
}


import { validatePasswordStrength } from '../utils/passwordValidator.js';

/**
 * Validações centralizadas para operações de usuários
 */

/**
 * Roles válidos no sistema
 */
export const VALID_ROLES = ['admin', 'comercial', 'editor_stock'];

/**
 * Regex para validação de email
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {Object} - { isValid: boolean, error?: string }
 */
export function validateEmail(email) {
  if (!email) {
    return {
      isValid: false,
      error: 'Email é obrigatório'
    };
  }

  if (!EMAIL_REGEX.test(email)) {
    return {
      isValid: false,
      error: 'Email inválido',
      message: 'O formato do email não é válido'
    };
  }

  return { isValid: true };
}

/**
 * Valida role
 * @param {string} role - Role a validar
 * @returns {Object} - { isValid: boolean, error?: string }
 */
export function validateRole(role) {
  if (!role) {
    return {
      isValid: false,
      error: 'Role é obrigatório',
      message: `Role deve ser um dos seguintes: ${VALID_ROLES.join(', ')}`
    };
  }

  if (!VALID_ROLES.includes(role)) {
    return {
      isValid: false,
      error: 'Role inválido',
      message: `Role deve ser um dos seguintes: ${VALID_ROLES.join(', ')}`
    };
  }

  return { isValid: true };
}

/**
 * Valida senha usando o validador de força
 * @param {string} password - Senha a validar
 * @returns {Object} - { isValid: boolean, errors?: string[], strength?: string }
 */
export function validatePassword(password) {
  if (!password) {
    return {
      isValid: false,
      errors: ['Password é obrigatório']
    };
  }

  // Validação básica de comprimento mínimo (para casos simples)
  if (password.length < 6) {
    return {
      isValid: false,
      errors: ['A senha deve ter pelo menos 6 caracteres'],
      strength: 'weak'
    };
  }

  // Usar validador robusto para validação completa
  return validatePasswordStrength(password);
}

/**
 * Valida dados para criação de usuário
 * @param {Object} data - Dados do usuário
 * @param {string} data.email - Email
 * @param {string} data.password - Senha
 * @param {string} [data.role] - Role (opcional, padrão: 'comercial')
 * @returns {Object} - { isValid: boolean, errors?: string[] }
 */
export function validateUserCreation(data) {
  const errors = [];

  // Validar email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.error);
  }

  // Validar password
  if (!data.password) {
    errors.push('Password é obrigatório');
  } else {
    // Para criação, usar validação básica (6 caracteres mínimo)
    // O validador completo será usado em updatePassword
    if (data.password.length < 6) {
      errors.push('A senha deve ter pelo menos 6 caracteres');
    }
  }

  // Validar role se fornecido
  if (data.role) {
    const roleValidation = validateRole(data.role);
    if (!roleValidation.isValid) {
      errors.push(roleValidation.error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Valida dados para atualização de usuário
 * @param {Object} data - Dados a atualizar
 * @param {string} [data.email] - Email (opcional)
 * @param {string} [data.password] - Senha (opcional)
 * @param {string} [data.role] - Role (opcional)
 * @returns {Object} - { isValid: boolean, errors?: string[] }
 */
export function validateUserUpdate(data) {
  const errors = [];

  // Validar email se fornecido
  if (data.email !== undefined) {
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
      errors.push(emailValidation.error);
    }
  }

  // Validar password se fornecido
  if (data.password !== undefined) {
    if (data.password.length < 6) {
      errors.push('A senha deve ter pelo menos 6 caracteres');
    }
  }

  // Validar role se fornecido
  if (data.role !== undefined) {
    const roleValidation = validateRole(data.role);
    if (!roleValidation.isValid) {
      errors.push(roleValidation.error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Valida se uma operação pode ser realizada (não permite auto-operações perigosas)
 * @param {string} userId - ID do usuário alvo
 * @param {string} currentUserId - ID do usuário atual (quem está fazendo a operação)
 * @param {string} operation - Tipo de operação ('remove_role', 'delete', etc.)
 * @param {Object} [options] - Opções adicionais
 * @param {string} [options.newRole] - Novo role (para validação de remoção de role admin)
 * @returns {Object} - { isValid: boolean, error?: string }
 */
export function validateSelfOperation(userId, currentUserId, operation, options = {}) {
  if (userId !== currentUserId) {
    return { isValid: true };
  }

  // Não permitir que admin remova seu próprio role de admin
  if (operation === 'remove_role' || operation === 'update_role') {
    if (options.newRole && options.newRole !== 'admin') {
      return {
        isValid: false,
        error: 'Não pode alterar seu próprio role',
        message: 'Não é possível remover seu próprio role de administrador'
      };
    }
  }

  // Não permitir que admin remova a si mesmo
  if (operation === 'delete') {
    return {
      isValid: false,
      error: 'Não pode remover a si mesmo',
      message: 'Não é possível remover seu próprio utilizador'
    };
  }

  return { isValid: true };
}


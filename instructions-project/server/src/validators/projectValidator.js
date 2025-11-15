/**
 * Validador para projetos
 * Centraliza todas as validações relacionadas a projetos
 */

// Constantes de validação
export const MAX_DESCRIPTION_SIZE = 500000; // 500KB (~500.000 caracteres)

/**
 * Valida a description de um projeto
 * @param {string|null|undefined} description - Description a validar
 * @returns {Object} - { valid: boolean, error?: string }
 */
export function validateDescription(description) {
  if (description === null || description === undefined) {
    return { valid: true }; // null/undefined é permitido (limpar campo)
  }
  
  if (typeof description !== 'string') {
    return { valid: false, error: 'Description deve ser uma string' };
  }
  
  // Validar tamanho máximo
  if (description.length > MAX_DESCRIPTION_SIZE) {
    return { 
      valid: false, 
      error: `Description muito grande (${description.length} caracteres). Máximo permitido: ${MAX_DESCRIPTION_SIZE.toLocaleString()} caracteres.` 
    };
  }
  
  // Validar estrutura HTML básica (prevenir HTML malformado)
  if (description.trim() && description.includes('<')) {
    const openTags = (description.match(/<[^/][^>]*>/g) || []).length;
    const closeTags = (description.match(/<\/[^>]+>/g) || []).length;
    const selfClosingTags = (description.match(/<[^>]+\/>/g) || []).length;
    
    // Permitir diferença razoável (algumas tags podem ser self-closing)
    if (Math.abs(openTags - closeTags - selfClosingTags) > 10) {
      return { valid: false, error: 'HTML malformado detectado na description' };
    }
  }
  
  return { valid: true };
}

/**
 * Valida se um projectId foi fornecido
 * @param {string} projectId - ID do projeto
 * @returns {Object} - { valid: boolean, error?: string }
 */
export function validateProjectId(projectId) {
  if (!projectId) {
    return { valid: false, error: 'Project ID é obrigatório' };
  }
  return { valid: true };
}

/**
 * Valida se há arquivos no upload
 * @param {Array} files - Array de arquivos
 * @returns {Object} - { valid: boolean, error?: string }
 */
export function validateFiles(files) {
  if (!files || files.length === 0) {
    return { valid: false, error: 'Nenhuma imagem fornecida' };
  }
  return { valid: true };
}


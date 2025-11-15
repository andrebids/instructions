/**
 * Logger centralizado para projetos
 * Facilita controle de logs e debugging
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Log de informação geral
 */
export function logInfo(message, data = null) {
  if (isDevelopment || data) {
    console.log(`📋 [PROJECTS API] ${message}`, data || '');
  }
}

/**
 * Log de sucesso
 */
export function logSuccess(message, data = null) {
  console.log(`✅ [PROJECTS API] ${message}`, data || '');
}

/**
 * Log de erro
 */
export function logError(message, error = null) {
  console.error(`❌ [PROJECTS API] ${message}`);
  if (error) {
    console.error(`❌ [PROJECTS API] Nome do erro:`, error.name);
    console.error(`❌ [PROJECTS API] Mensagem:`, error.message);
    if (isDevelopment) {
      console.error(`❌ [PROJECTS API] Stack:`, error.stack);
    }
  }
}

/**
 * Log de operação de servidor (criação, atualização, etc)
 */
export function logServerOperation(operation, data = {}) {
  if (isDevelopment) {
    console.log(`💾 [SERVER] ===== ${operation} =====`);
    if (Object.keys(data).length > 0) {
      console.log(`💾 [SERVER]`, data);
    }
  }
}

/**
 * Log de upload
 */
export function logUpload(message, data = null) {
  console.log(`📁 [PROJECT UPLOAD] ${message}`, data || '');
}

/**
 * Log de debug
 */
export function logDebug(message, data = null) {
  if (isDevelopment) {
    console.log(`🔍 [PROJECT UPLOAD] ${message}`, data || '');
  }
}

/**
 * Log de estatísticas
 */
export function logStats(message, data = null) {
  console.log(`📊 [PROJECTS API] ${message}`, data || '');
}

/**
 * Log de deleção
 */
export function logDelete(message, data = null) {
  console.log(`🗑️  [PROJECTS API] ${message}`, data || '');
}

/**
 * Log de conversão night
 */
export function logNightConversion(message, data = null) {
  if (message.includes('falhada') || message.includes('failed')) {
    console.log(`⚠️ [NIGHT CONVERSION] ${message}`, data || '');
  } else {
    console.log(`✅ [NIGHT VERSION] ${message}`, data || '');
  }
}

/**
 * Formata mensagem de erro para o cliente
 */
export function formatErrorMessage(error) {
  let errorMessage = error.message || 'Erro desconhecido';
  
  if (error.message && error.message.indexOf('does not exist') !== -1) {
    errorMessage = 'Tabela não existe. Execute: npm run setup';
  } else if (error.message && error.message.indexOf('relation') !== -1) {
    errorMessage = 'Tabela não encontrada. Execute o setup da base de dados.';
  }
  
  return errorMessage;
}


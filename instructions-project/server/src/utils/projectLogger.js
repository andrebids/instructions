/**
 * Logger centralizado para projetos
 * Facilita controle de logs e debugging
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Log de informação geral (apenas em desenvolvimento)
 */
export function logInfo(message, data = null) {
  if (isDevelopment) {
    console.log(`📋 [PROJECTS API] ${message}`, data || '');
  }
}

/**
 * Log de sucesso (apenas em desenvolvimento)
 */
export function logSuccess(message, data = null) {
  if (isDevelopment) {
    console.log(`✅ [PROJECTS API] ${message}`, data || '');
  }
}

/**
 * Log de erro
 */
export function logError(message, error = null) {
  console.error(`❌ [PROJECTS API] ${message}`);
  if (error) {
    // Log básico do erro
    console.error(`❌ [PROJECTS API] Nome do erro:`, error.name || 'Sem nome');
    console.error(`❌ [PROJECTS API] Mensagem:`, error.message || 'Sem mensagem');
    
    // Tratamento especial para erros do Sequelize
    if (error.original) {
      console.error(`❌ [PROJECTS API] Erro original (banco de dados):`, {
        name: error.original.name || 'Sem nome',
        message: error.original.message || 'Sem mensagem',
        code: error.original.code,
        detail: error.original.detail,
        hint: error.original.hint,
        position: error.original.position,
        internalPosition: error.original.internalPosition,
        internalQuery: error.original.internalQuery,
        where: error.original.where,
        schema: error.original.schema,
        table: error.original.table,
        column: error.original.column,
        dataType: error.original.dataType,
        constraint: error.original.constraint,
        file: error.original.file,
        line: error.original.line,
        routine: error.original.routine
      });
    }
    
    // Log de informações da query SQL (se disponível)
    if (error.sql) {
      console.error(`❌ [PROJECTS API] SQL:`, error.sql);
    }
    
    if (error.parameters) {
      console.error(`❌ [PROJECTS API] Parâmetros:`, error.parameters);
    }
    
    if (error.bind) {
      console.error(`❌ [PROJECTS API] Bind parameters:`, error.bind);
    }
    
    // Log de stack trace em desenvolvimento
    if (isDevelopment) {
      console.error(`❌ [PROJECTS API] Stack:`, error.stack);
      
      // Log completo do objeto de erro em desenvolvimento
      console.error(`❌ [PROJECTS API] Erro completo:`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
        original: error.original,
        sql: error.sql,
        parameters: error.parameters,
        bind: error.bind,
        parent: error.parent,
        fields: error.fields,
        table: error.table,
        value: error.value,
        instance: error.instance,
        validatorKey: error.validatorKey,
        validatorName: error.validatorName,
        validatorArgs: error.validatorArgs
      });
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
 * Log de estatísticas (apenas em desenvolvimento)
 */
export function logStats(message, data = null) {
  if (isDevelopment) {
    console.log(`📊 [PROJECTS API] ${message}`, data || '');
  }
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


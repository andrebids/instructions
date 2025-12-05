import { LOG_CONFIG } from "../constants";

export const logger = {
  lifecycle: (component, action, data) => {
    if (!LOG_CONFIG.ENABLE_LOGS || !LOG_CONFIG.LEVELS.LIFECYCLE) return;
    console.log(`🔄 [${component}] ${action}`, data || '');
  },
  
  navigation: (from, to, data) => {
    if (!LOG_CONFIG.ENABLE_LOGS || !LOG_CONFIG.LEVELS.NAVIGATION) return;
    console.log(`🧭 Navigation: Step ${from} → Step ${to}`, data || '');
  },
  
  validation: (stepId, isValid, formData) => {
    // Logs de validação desabilitados para evitar spam no console
    // Se precisar debugar, ativar temporariamente em constants.js
    if (!LOG_CONFIG.ENABLE_LOGS || !LOG_CONFIG.LEVELS.VALIDATION) return;
    const icon = isValid ? '✅' : '❌';
    // Usar console.debug em vez de console.log para reduzir ruído
    console.debug(`${icon} Validation [${stepId}]:`, isValid, formData);
  },
  
  canvas: (action, data) => {
    if (!LOG_CONFIG.ENABLE_LOGS || !LOG_CONFIG.LEVELS.CANVAS) return;
    console.log(`🎨 Canvas: ${action}`, data || '');
  },
  
  api: (endpoint, method, data) => {
    if (!LOG_CONFIG.ENABLE_LOGS || !LOG_CONFIG.LEVELS.API) return;
    console.log(`📡 API [${method}] ${endpoint}`, data || '');
  },
  
  userAction: (action, target, value) => {
    if (!LOG_CONFIG.ENABLE_LOGS || !LOG_CONFIG.LEVELS.USER_ACTION) return;
    console.log(`👆 User: ${action}`, { target, value });
  },
  
  error: (context, error) => {
    console.error(`❌ Error [${context}]:`, error);
  },
  
  warn: (context, message) => {
    console.warn(`⚠️ Warning [${context}]:`, message);
  }
};


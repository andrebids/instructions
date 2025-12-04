/**
 * Utilitário para obter a URL base do servidor
 * Detecta automaticamente se está sendo acessado via IP da rede local
 * e ajusta a URL do servidor conforme necessário
 */

/**
 * Obtém a URL base do servidor (sem /api)
 * @returns {string} URL base do servidor ou string vazia para caminho relativo
 */
export function getServerBaseUrl() {
  const isDev = import.meta.env.DEV;
  
  if (!isDev) {
    return ''; // Caminho relativo em produção
  }

  // Em desenvolvimento, verificar se está sendo acessado via IP da rede
  const hostname = window.location.hostname;
  const isLocalNetwork = /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) || 
                         /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
                         /^172\.(1[6-9]|2[0-9]|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname);

  if (isLocalNetwork) {
    // Se acessado via IP da rede, usar o mesmo IP para o servidor (porta 5001)
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:5001`;
  }

  // Se acessado via localhost, usar VITE_API_URL ou caminho relativo
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (viteApiUrl) {
    return viteApiUrl.replace('/api', '').replace(/\/$/, '');
  }

  return ''; // Caminho relativo (proxy do Vite funciona em localhost)
}

/**
 * Obtém a URL base da API (com /api)
 * @returns {string} URL base da API
 */
export function getApiBaseUrl() {
  const isDev = import.meta.env.DEV;
  
  if (!isDev) {
    // Em produção, SEMPRE usar caminho relativo para evitar problemas de CSP
    return '/api';
  }

  // Em desenvolvimento, verificar se está sendo acessado via IP da rede
  const hostname = window.location.hostname;
  const isLocalNetwork = /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) || 
                         /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
                         /^172\.(1[6-9]|2[0-9]|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname);

  if (isLocalNetwork) {
    // Se acessado via IP da rede, usar o mesmo IP para a API (porta 5001)
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:5001/api`;
  }

  // Se acessado via localhost, usar VITE_API_URL ou caminho relativo (proxy do Vite)
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (viteApiUrl) {
    return viteApiUrl.replace(/\/$/, '');
  }

  // Fallback: usar caminho relativo (proxy do Vite funciona em localhost)
  return '/api';
}


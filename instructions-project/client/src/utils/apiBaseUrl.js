/**
 * Determina a base URL da API baseado no ambiente e no hostname
 * Suporta acesso via IP local para desenvolvimento
 */
export function getApiBaseUrl() {
  const isDev = import.meta.env.DEV;
  
  // Se VITE_API_URL estiver definido, usar ele
  if (isDev && import.meta.env.VITE_API_URL) {
    const apiUrl = import.meta.env.VITE_API_URL;
    return apiUrl.replace('/api', '');
  }
  
  // Se estiver acessando via IP local, usar o mesmo IP mas porta 5000 do servidor
  if (typeof window !== 'undefined') {
    let hostname = window.location.hostname;
    const originalHostname = hostname;
    
    // Sanitizar hostname - garantir que não há caracteres inválidos
    // Primeiro, substituir dois pontos por pontos (caso haja algum problema de encoding)
    hostname = String(hostname).replace(/:/g, '.');
    // Remover caracteres inválidos, mas manter pontos e números
    hostname = hostname.replace(/[^0-9.]/g, '');
    
    // Verificar se parece com um IP (4 números separados por pontos)
    const ipParts = hostname.split('.');
    if (ipParts.length === 4 && ipParts.every(part => /^\d{1,3}$/.test(part))) {
      // Reconstruir o IP corretamente
      hostname = ipParts.join('.');
      
      // Verificar se é um IP local
      const isLocalIP = /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);
      
      if (isLocalIP) {
        // Quando acessado via IP local, usar o mesmo IP mas porta 5000 do servidor
        const baseUrl = `http://${hostname}:5000`;
        console.log('🌐 [apiBaseUrl] Detectado IP local:', originalHostname, '-> sanitizado:', hostname, '-> Base URL:', baseUrl);
        return baseUrl;
      }
    }
    
    // Se for localhost, usar caminho relativo (proxy do Vite em dev)
    if (originalHostname === 'localhost' || originalHostname === '127.0.0.1') {
      return '';
    }
  }
  
  // Em produção com domínio, usar caminho relativo (mesma origem)
  return '';
}


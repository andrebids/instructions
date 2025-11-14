/**
 * Serviço para conversão de imagens dia/noite
 * Estrutura preparada para integração futura com API real
 */

/**
 * Converte imagem de dia para noite
 * @param {string} imageId - ID da imagem
 * @param {string} imageUrl - URL da imagem de dia
 * @param {string} projectId - ID do projeto
 * @returns {Promise<Object>} Objeto com nightVersion e status
 */
export async function convertToNight(imageId, imageUrl, projectId) {
  // TODO: Implementar quando API estiver disponível
  // Exemplo de implementação futura:
  /*
  try {
    const response = await fetch('/api/day-night/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageId,
        imageUrl,
        projectId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao converter imagem');
    }
    
    const data = await response.json();
    return {
      nightVersion: data.nightVersion,
      status: 'completed',
      conversionId: data.conversionId,
    };
  } catch (error) {
    console.error('Erro na conversão dia/noite:', error);
    throw error;
  }
  */
  
  // Por enquanto, retornar fallback (usar mesma imagem)
  // A conversão real será feita via filtros CSS até a API estar disponível
  return {
    nightVersion: imageUrl, // Por enquanto usar a mesma URL
    status: 'pending', // Status pendente até API estar disponível
    message: 'Conversão via API ainda não implementada. Usando fallback.',
  };
}

/**
 * Verifica status de uma conversão em andamento
 * @param {string} conversionId - ID da conversão
 * @returns {Promise<Object>} Status da conversão
 */
export async function checkConversionStatus(conversionId) {
  // TODO: Implementar quando API estiver disponível
  /*
  try {
    const response = await fetch(`/api/day-night/status/${conversionId}`);
    const data = await response.json();
    return {
      status: data.status, // 'pending' | 'processing' | 'completed' | 'failed'
      nightVersion: data.nightVersion,
      progress: data.progress, // 0-100
    };
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    throw error;
  }
  */
  
  return {
    status: 'pending',
    progress: 0,
  };
}

/**
 * Cancela uma conversão em andamento
 * @param {string} conversionId - ID da conversão
 * @returns {Promise<boolean>} Sucesso da operação
 */
export async function cancelConversion(conversionId) {
  // TODO: Implementar quando API estiver disponível
  /*
  try {
    const response = await fetch(`/api/day-night/cancel/${conversionId}`, {
      method: 'POST',
    });
    return response.ok;
  } catch (error) {
    console.error('Erro ao cancelar conversão:', error);
    return false;
  }
  */
  
  return true;
}


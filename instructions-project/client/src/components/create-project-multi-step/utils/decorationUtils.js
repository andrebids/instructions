// Utilitários relacionados a decorações

/**
 * Função para obter cor baseada no tipo de decoração
 * @param {string} type - Tipo da decoração
 * @returns {string} - Cor hexadecimal
 */
export const getDecorationColor = (type) => {
  const colors = {
    'tree': '#228B22',
    'plant': '#32CD32',
    'lights': '#FFD700',
    'ornament': '#FF6347',
    'holiday': '#FF69B4'
  };
  return colors[type] || '#6B7280';
};


/**
 * Utilitários para gestão de cartouche
 */

/**
 * Retorna nome padrão de rua baseado no índice da imagem
 * @param {number} imageIndex - Índice da imagem
 * @returns {string} - Nome da rua padrão
 */
export function getDefaultStreetName(imageIndex) {
  // Nomes de ruas francesas comuns
  const frenchStreets = [
    "Mairie",           // Primeira imagem
    "Rue de la République",
    "Avenue des Champs-Élysées",
    "Boulevard Saint-Michel",
    "Rue de Rivoli",
    "Place de la Concorde",
    "Rue du Faubourg Saint-Antoine",
    "Avenue Montaigne",
    "Boulevard Haussmann",
    "Rue de Vaugirard",
    "Place Vendôme",
    "Rue de la Paix",
    "Avenue des Ternes",
    "Boulevard Voltaire",
    "Rue de Belleville"
  ];
  
  // Se for a primeira imagem (índice 0), retorna "Mairie"
  if (imageIndex === 0) {
    return "Mairie";
  }
  
  // Para outras imagens, usa nomes da lista, circulando se necessário
  return frenchStreets[imageIndex % frenchStreets.length] || `Rue ${imageIndex}`;
}

/**
 * Retorna nome padrão do projeto
 * @param {string} projectName - Nome do projeto (opcional)
 * @returns {string} - Nome padrão ou fornecido
 */
export function getDefaultProjectName(projectName) {
  return projectName || "Mairie du Soleil";
}

/**
 * Obtém dados do cartouche para uma imagem específica
 * @param {Object} cartoucheByImage - Objeto com cartouches por imagem
 * @param {string} imageId - ID da imagem
 * @param {Array} uploadedImages - Array de imagens uploadadas
 * @returns {Object} - Dados do cartouche { streetOrZone, option }
 */
export function getCartoucheForImage(cartoucheByImage, imageId, uploadedImages) {
  const cartouche = cartoucheByImage?.[imageId];
  
  // Se não existe entrada, calcular valores padrão baseados no índice da imagem
  if (!cartouche) {
    const imageIndex = uploadedImages.findIndex(img => img.id === imageId);
    const defaultStreetName = imageIndex >= 0 ? getDefaultStreetName(imageIndex) : "";
    
    return {
      streetOrZone: defaultStreetName,
      option: "base"
    };
  }
  
  return {
    streetOrZone: cartouche.streetOrZone !== undefined ? cartouche.streetOrZone : "",
    option: cartouche.option !== undefined ? cartouche.option : "base"
  };
}


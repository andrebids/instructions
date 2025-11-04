// Cálculos relacionados ao canvas

/**
 * Calcular dimensões de imagem para caber no canvas mantendo aspect ratio
 * @param {number} imageAspectRatio - Aspect ratio da imagem (width/height)
 * @param {number} canvasWidth - Largura do canvas
 * @param {number} canvasHeight - Altura do canvas
 * @param {number} marginPercent - Percentual de margem (padrão 0.96 = 96%)
 * @returns {Object} - { imageWidth, imageHeight }
 */
export const calculateImageDimensions = (imageAspectRatio, canvasWidth, canvasHeight, marginPercent = 0.96) => {
  const maxWidth = canvasWidth * marginPercent;
  const maxHeight = canvasHeight * marginPercent;
  
  let imageWidth, imageHeight;
  
  // Calcular tamanho mantendo aspect ratio e garantindo que cabe no canvas
  if (maxWidth / imageAspectRatio <= maxHeight) {
    // Limitado pela largura
    imageWidth = maxWidth;
    imageHeight = maxWidth / imageAspectRatio;
  } else {
    // Limitado pela altura
    imageHeight = maxHeight;
    imageWidth = maxHeight * imageAspectRatio;
  }
  
  return { imageWidth, imageHeight };
};

/**
 * Calcular posição central do canvas
 * @param {number} canvasWidth - Largura do canvas
 * @param {number} canvasHeight - Altura do canvas
 * @returns {Object} - { centerX, centerY }
 */
export const getCenterPosition = (canvasWidth, canvasHeight) => ({
  centerX: canvasWidth / 2,
  centerY: canvasHeight / 2
});


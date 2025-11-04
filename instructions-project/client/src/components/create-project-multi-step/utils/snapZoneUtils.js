// Utilitários para cálculos de snap zones

/**
 * Função para verificar snap a uma zona
 * Verifica se uma posição (x, y) está próxima o suficiente de uma zona de snap
 * @param {number} x - Posição X
 * @param {number} y - Posição Y
 * @param {Array} zones - Array de zonas de snap
 * @returns {Object} - { x, y, snapped: boolean }
 */
export const checkSnapToZone = (x, y, zones) => {
  if (!zones || zones.length === 0) {
    return { x: x, y: y, snapped: false };
  }
  
  const snapThreshold = 50;
  let closestZone = null;
  let minDistance = Infinity;
  
  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    const zoneCenterX = zone.x + zone.width / 2;
    const zoneCenterY = zone.y + zone.height / 2;
    
    const dx = x - zoneCenterX;
    const dy = y - zoneCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < snapThreshold && distance < minDistance) {
      minDistance = distance;
      closestZone = zone;
    }
  }
  
  if (closestZone) {
    return {
      x: closestZone.x + closestZone.width / 2,
      y: closestZone.y + closestZone.height / 2,
      snapped: true
    };
  }
  
  return { x: x, y: y, snapped: false };
};


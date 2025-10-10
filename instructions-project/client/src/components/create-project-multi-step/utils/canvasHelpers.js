import { CANVAS_CONFIG } from "../constants";

// Snapping simples para grid
export const snapToGrid = (position) => {
  const { gridSize, snapDistance } = CANVAS_CONFIG;
  
  const gridX = Math.round(position.x / gridSize) * gridSize;
  const gridY = Math.round(position.y / gridSize) * gridSize;
  
  return {
    x: Math.abs(position.x - gridX) < snapDistance ? gridX : position.x,
    y: Math.abs(position.y - gridY) < snapDistance ? gridY : position.y,
  };
};

// Exportar canvas para JSON
export const exportCanvasToJSON = (decorations) => {
  return {
    version: "1.0",
    timestamp: new Date().toISOString(),
    decorations: decorations.map(d => ({
      id: d.id,
      decorationId: d.decorationId,
      x: Math.round(d.x),
      y: Math.round(d.y),
      width: Math.round(d.width),
      height: Math.round(d.height),
      rotation: Math.round(d.rotation),
      scaleX: d.scaleX,
      scaleY: d.scaleY,
    })),
  };
};

// Validar posições dentro dos limites do canvas
export const isWithinBounds = (decoration, canvasWidth, canvasHeight) => {
  return (
    decoration.x >= 0 &&
    decoration.y >= 0 &&
    decoration.x + decoration.width <= canvasWidth &&
    decoration.y + decoration.height <= canvasHeight
  );
};

// Gerar ID único para decoração
export const generateDecorationId = () => {
  return `dec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};


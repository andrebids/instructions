import React from "react";
import { Rect, Circle } from 'react-konva';

/**
 * Componente para renderizar marcas de snap zones
 * Renderiza marcadores visuais das zonas de snap no canvas
 * 
 * @param {Object} props
 * @param {Array} props.zones - Array de zonas de snap
 * @param {boolean} props.isVisible - Se deve mostrar os marcadores
 */
export const SnapZoneMarkers = ({ zones = [], isVisible = false }) => {
  if (!isVisible || !zones || zones.length === 0) {
    return null;
  }

  return (
    <>
      {zones.map(function(zone) {
        var centerX = zone.x + zone.width / 2;
        var centerY = zone.y + zone.height / 2;
        
        return (
          <React.Fragment key={zone.id}>
            {/* Retângulo da zona */}
            <Rect
              x={zone.x}
              y={zone.y}
              width={zone.width}
              height={zone.height}
              stroke="rgba(59, 130, 246, 0.6)"
              strokeWidth={2}
              fill="rgba(59, 130, 246, 0.1)"
              listening={false}
              dash={[5, 5]}
              perfectDrawEnabled={false}
            />
            {/* Ponto central indicando snap */}
            <Circle
              x={centerX}
              y={centerY}
              radius={4}
              fill="rgba(59, 130, 246, 0.8)"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth={1}
              listening={false}
              perfectDrawEnabled={false}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};


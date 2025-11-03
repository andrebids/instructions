import React, { useRef } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

// Componente para carregar imagem de fundo
const URLImage = ({ src, width, height, x, y }) => {
  const [image] = useImage(src, 'anonymous');
  return (
    <KonvaImage
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      offsetX={width / 2}
      offsetY={height / 2}
      listening={false}
    />
  );
};

// Componente para renderizar decoração
const DecorationPreview = ({ decoration }) => {
  const [image] = useImage(decoration.src || decoration.dayUrl || decoration.nightUrl, 'anonymous');
  
  if (!image) return null;
  
  return (
    <KonvaImage
      image={image}
      x={decoration.x}
      y={decoration.y}
      width={decoration.width}
      height={decoration.height}
      offsetX={decoration.width / 2}
      offsetY={decoration.height / 2}
      rotation={decoration.rotation || 0}
      listening={false}
    />
  );
};

export function SimulationPreview({ 
  canvasImage, 
  decorations = [], 
  mode = 'day', // 'day', 'night', ou 'both'
  width = 600,
  height = 400
}) {
  const stageRef = useRef(null);
  
  // Dimensões virtuais do canvas (mesmas do StepAIDesigner)
  const canvasWidth = 1200;
  const canvasHeight = 600;
  
  // Calcular escala para caber no espaço disponível
  const scale = Math.min(width / canvasWidth, height / canvasHeight);
  const scaledWidth = canvasWidth * scale;
  const scaledHeight = canvasHeight * scale;
  
  // Inferir URL night a partir da URL day se necessário
  const getImageUrl = (url, isNight) => {
    if (!url) return null;
    if (isNight && url.includes('/sourceday/')) {
      return url.replace('/sourceday/', '/sourcenight/').replace('.jpg', '.png').replace('.jpeg', '.png');
    }
    return url;
  };
  
  // Determinar qual imagem mostrar baseado no modo
  const getBackgroundImage = () => {
    if (!canvasImage) return null;
    
    const dayUrl = canvasImage.src;
    const nightUrl = getImageUrl(dayUrl, true);
    
    if (mode === 'day') return dayUrl;
    if (mode === 'night') return nightUrl || dayUrl;
    // 'both' não é usado aqui, mas retornamos day como padrão
    return dayUrl;
  };
  
  // Filtrar decorações baseado no modo
  const getDecorations = () => {
    return decorations.map(dec => {
      if (mode === 'day') {
        return { ...dec, src: dec.dayUrl || dec.src || dec.nightUrl };
      } else if (mode === 'night') {
        return { ...dec, src: dec.nightUrl || dec.dayUrl || dec.src };
      }
      return dec;
    });
  };
  
  const backgroundUrl = getBackgroundImage();
  const displayDecorations = getDecorations();
  
  if (!canvasImage || !backgroundUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-default-100 rounded-lg">
        <span className="text-default-400">No image available</span>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-default-100 rounded-lg overflow-hidden">
      <Stage
        ref={stageRef}
        width={scaledWidth}
        height={scaledHeight}
        scaleX={scale}
        scaleY={scale}
      >
        <Layer>
          {/* Imagem de fundo */}
          <URLImage
            src={backgroundUrl}
            width={canvasImage.width || canvasWidth}
            height={canvasImage.height || canvasHeight}
            x={canvasImage.x || canvasWidth / 2}
            y={canvasImage.y || canvasHeight / 2}
          />
        </Layer>
        
        <Layer>
          {/* Decorações */}
          {displayDecorations.map((decoration) => (
            <DecorationPreview key={decoration.id} decoration={decoration} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}


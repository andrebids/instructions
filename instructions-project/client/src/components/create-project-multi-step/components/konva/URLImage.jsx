import React from "react";
import { Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

/**
 * Componente para carregar Source Images (não arrastáveis)
 * Renderiza imagens estáticas no canvas Konva
 * 
 * @param {Object} props
 * @param {string} props.src - URL da imagem
 * @param {number} props.width - Largura da imagem
 * @param {number} props.height - Altura da imagem
 * @param {number} props.x - Posição X
 * @param {number} props.y - Posição Y
 */
export const URLImage = ({ src, width, height, x, y }) => {
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
      listening={false} // Não responde a eventos (não arrastável)
    />
  );
};


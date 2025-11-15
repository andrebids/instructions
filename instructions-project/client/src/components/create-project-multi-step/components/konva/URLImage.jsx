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
  // useImage retorna [image, status] onde status pode ter propriedades loading/error
  const [image, status] = useImage(src, 'anonymous');

  // Não renderizar se não houver imagem válida ou se houver erro
  // Verificar se status existe e tem propriedade error, ou se image é null/undefined
  if (!image || (status && status.error)) {
    return null;
  }

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


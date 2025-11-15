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
  // Converter caminho /uploads/ para /api/uploads/ se necessário (para passar pelo proxy do Vite)
  const baseApi = (import.meta?.env?.VITE_API_URL || '').replace(/\/$/, '') || '';
  const mapPath = (path) => {
    if (!path) return path;
    // Se já é URL completa (http/https), usar diretamente
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    // Se tem baseApi configurado, usar ele
    if (baseApi && path.indexOf('/uploads/') === 0) return baseApi + path;
    // Sem baseApi: converter /uploads/ para /api/uploads/ para passar pelo proxy
    if (path.indexOf('/uploads/') === 0) return '/api' + path;
    return path;
  };
  
  const mappedSrc = mapPath(src);
  
  // Log para debug (apenas quando src é diferente de mappedSrc)
  if (src !== mappedSrc) {
    console.log('🔄 [URLImage] Mapeando caminho:', { original: src, mapped: mappedSrc });
  }
  
  // useImage retorna [image, status] onde status pode ter propriedades loading/error
  const [image, status] = useImage(mappedSrc, 'anonymous');
  
  // Log de erro se houver problema ao carregar
  if (status && status.error) {
    console.error('❌ [URLImage] Erro ao carregar imagem:', { src, mappedSrc, error: status.error });
  }

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


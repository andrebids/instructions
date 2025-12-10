import React, { useState, useEffect, useRef } from "react";
import { Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { calculateImageDimensions } from '../../utils/canvasCalculations';

/**
 * Componente para carregar Source Images (não arrastáveis)
 * Renderiza imagens estáticas no canvas Konva
 * Calcula automaticamente o aspect ratio correto quando a imagem carrega
 * 
 * @param {Object} props
 * @param {string} props.imageId - ID da imagem (source)
 * @param {string} props.src - URL da imagem
 * @param {number} props.width - Largura inicial da imagem (será ajustada se necessário)
 * @param {number} props.height - Altura inicial da imagem (será ajustada se necessário)
 * @param {number} props.x - Posição X
 * @param {number} props.y - Posição Y
 * @param {Object|null} props.crop - Recorte normalizado { xNorm, yNorm, wNorm, hNorm }
 * @param {Object|null} props.naturalSize - Dimensões reais { width, height }
 * @param {Function} props.onImageNaturalSize - Callback quando dimensões reais forem conhecidas
 */
export const URLImage = ({ imageId, src, width, height, x, y, crop = null, naturalSize = null, onImageNaturalSize = null }) => {
  const [adjustedDimensions, setAdjustedDimensions] = useState({ width, height });
  const [hasAdjusted, setHasAdjusted] = useState(false);
  const loggedSourcesRef = useRef(new Set());
  const naturalSizeReportedRef = useRef(false);

  useEffect(() => {
    // Resetar flags ao trocar de imagem
    setHasAdjusted(false);
    setAdjustedDimensions({ width, height });
    naturalSizeReportedRef.current = false;
  }, [imageId, src, width, height]);
  
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
  
  // Log para debug (apenas em desenvolvimento e uma vez por origem)
  useEffect(() => {
    const isDev = import.meta?.env?.DEV || process.env?.NODE_ENV === 'development';
    if (!isDev || !src || src === mappedSrc) return;

    if (!loggedSourcesRef.current.has(src)) {
      loggedSourcesRef.current.add(src);
      console.log('🔄 [URLImage] Mapeando caminho:', { original: src, mapped: mappedSrc });
    }
  }, [src, mappedSrc]);
  
  // useImage retorna [image, status] onde status pode ter propriedades loading/error
  const [image, status] = useImage(mappedSrc, 'anonymous');
  
  // Log de erro se houver problema ao carregar
  if (status && status.error) {
    console.error('❌ [URLImage] Erro ao carregar imagem:', { src, mappedSrc, error: status.error });
  }

  // Calcular dimensões corretas quando a imagem carregar
  useEffect(() => {
    if (!image || hasAdjusted) return;
    
    const imgW = image.width || 0;
    const imgH = image.height || 0;
    
    if (imgW > 0 && imgH > 0) {
      // Calcular aspect ratio real da imagem
      const imageAspectRatio = imgW / imgH;
      
      // Calcular aspect ratio atual (das props)
      const currentAspectRatio = width / height;
      
      // Verificar se o aspect ratio está incorreto (diferença > 1%)
      const aspectRatioDiff = Math.abs(imageAspectRatio - currentAspectRatio);
      const isAspectRatioIncorrect = aspectRatioDiff > 0.01;
      
      if (isAspectRatioIncorrect) {
        // Canvas virtual sempre 1200x600
        const canvasWidth = 1200;
        const canvasHeight = 600;
        
        // Recalcular dimensões mantendo aspect ratio correto
        const { imageWidth, imageHeight } = calculateImageDimensions(
          imageAspectRatio, 
          canvasWidth, 
          canvasHeight, 
          0.96
        );
        
        console.log('📐 [URLImage] Ajustando dimensões:', {
          original: { width, height, aspectRatio: currentAspectRatio },
          real: { width: imgW, height: imgH, aspectRatio: imageAspectRatio },
          adjusted: { width: imageWidth, height: imageHeight }
        });
        
        setAdjustedDimensions({ width: imageWidth, height: imageHeight });
        setHasAdjusted(true);
      } else {
        // Aspect ratio já está correto
        setHasAdjusted(true);
      }
    }
  }, [image, width, height, hasAdjusted]);

  // Reportar dimensões naturais para o chamador
  useEffect(() => {
    if (!image || naturalSizeReportedRef.current) return;
    if (onImageNaturalSize) {
      onImageNaturalSize(imageId, { width: image.width, height: image.height });
    }
    naturalSizeReportedRef.current = true;
  }, [image, onImageNaturalSize, imageId]);

  // Não renderizar se não houver imagem válida ou se houver erro
  // Verificar se status existe e tem propriedade error, ou se image é null/undefined
  if (!image || (status && status.error)) {
    return null;
  }

  // Usar dimensões ajustadas se disponíveis, senão usar as originais
  const finalWidth = adjustedDimensions.width || width;
  const finalHeight = adjustedDimensions.height || height;

  const naturalWidth = naturalSize?.width || image?.width;
  const naturalHeight = naturalSize?.height || image?.height;

  const shouldApplyCrop = crop && naturalWidth && naturalHeight && crop.wNorm && crop.hNorm;
  const cropConfig = shouldApplyCrop ? {
    x: crop.xNorm * naturalWidth,
    y: crop.yNorm * naturalHeight,
    width: crop.wNorm * naturalWidth,
    height: crop.hNorm * naturalHeight
  } : null;

  return (
    <KonvaImage
      image={image}
      x={x}
      y={y}
      width={finalWidth}
      height={finalHeight}
      offsetX={finalWidth / 2}
      offsetY={finalHeight / 2}
      crop={cropConfig || undefined}
      listening={false} // Não responde a eventos (não arrastável)
    />
  );
};


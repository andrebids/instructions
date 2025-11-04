import { useEffect, useRef } from 'react';

/**
 * Hook para ajustar aspect ratio de decorações quando imagem carrega
 * PREVINE LOOP INFINITO usando refs para rastrear estado
 * 
 * @param {Object} params
 * @param {HTMLImageElement | null} params.image - Imagem carregada
 * @param {Object} params.decoration - Objeto de decoração
 * @param {Function} params.onChange - Callback para atualizar decoração
 * @param {React.RefObject} params.shapeRef - Ref do shape Konva
 */
export const useImageAspectRatio = ({ image, decoration, onChange, shapeRef }) => {
  const adjustedAspectRatioRef = useRef(false);
  const lastSrcRef = useRef(decoration.src);
  const isAdjustingRef = useRef(false);

  // Resetar flag quando a imagem mudar
  useEffect(() => {
    if (lastSrcRef.current !== decoration.src) {
      lastSrcRef.current = decoration.src;
      adjustedAspectRatioRef.current = false;
      isAdjustingRef.current = false;
    }
  }, [decoration.src]);

  // Ajustar aspect ratio apenas uma vez por imagem
  useEffect(() => {
    // Verificações de segurança
    if (!image || !shapeRef.current || isAdjustingRef.current) {
      return;
    }
    
    // Se já ajustamos para esta imagem, não ajustar novamente
    if (adjustedAspectRatioRef.current) {
      return;
    }
    
    // Calcular aspect ratio esperado
    const imgW = image?.width || 0;
    const imgH = image?.height || 0;
    
    if (imgW > 0 && imgH > 0 && decoration?.width && decoration?.height) {
      const expectedHeight = decoration.width * (imgH / imgW);
      const heightDiff = Math.abs(expectedHeight - decoration.height);
      
      // Só atualizar se diferença for significativa (> 0.5px)
      if (heightDiff > 0.5) {
        isAdjustingRef.current = true;
        adjustedAspectRatioRef.current = true;
        
        // Usar requestAnimationFrame para evitar atualização durante render
        requestAnimationFrame(() => {
          if (isAdjustingRef.current) {
            onChange({
              ...decoration,
              height: expectedHeight,
              // manter demais propriedades inalteradas
            });
            // Resetar flag após um pequeno delay
            setTimeout(() => {
              isAdjustingRef.current = false;
            }, 100);
          }
        });
      } else {
        adjustedAspectRatioRef.current = true;
      }
    }
  }, [image]); // Apenas image como dependência - não incluir decoration para evitar loops
};


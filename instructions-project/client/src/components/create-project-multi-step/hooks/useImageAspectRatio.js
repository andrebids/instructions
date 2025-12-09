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
  const lastHashRef = useRef('');

  // Resetar flag quando a imagem mudar
  useEffect(() => {
    if (lastSrcRef.current !== decoration.src) {
      lastSrcRef.current = decoration.src;
      adjustedAspectRatioRef.current = false;
      isAdjustingRef.current = false;
      lastHashRef.current = '';
    }
  }, [decoration.src]);

  // Ajustar aspect ratio sempre que necessário (verifica se está correto)
  useEffect(() => {
    // Verificações de segurança
    if (!image || !shapeRef.current || isAdjustingRef.current) {
      return;
    }
    
    // Pequeno delay para garantir que a imagem está totalmente carregada
    // Isso ajuda especialmente quando a imagem já estava em cache
    const checkAndAdjust = () => {
    
    // Calcular dimensões reais da imagem
    const imgW = image?.width || 0;
    const imgH = image?.height || 0;
    
    if (imgW > 0 && imgH > 0 && decoration?.width && decoration?.height) {
      // Criar hash único para esta combinação de imagem + dimensões atuais
      const currentHash = `${imgW}x${imgH}-${decoration.width}x${decoration.height}`;
      
      // Se já verificamos esta combinação exata, não verificar novamente
      if (lastHashRef.current === currentHash && adjustedAspectRatioRef.current) {
        return;
      }
      
      // Calcular aspect ratio da imagem original
      const imageAspectRatio = imgW / imgH;
      
      // Calcular aspect ratio atual da decoração
      const decorationAspectRatio = decoration.width / decoration.height;
      
      // Verificar se o aspect ratio está incorreto (diferença > 1%)
      const aspectRatioDiff = Math.abs(imageAspectRatio - decorationAspectRatio);
      const isAspectRatioIncorrect = aspectRatioDiff > 0.01;
      
      // Se o aspect ratio estiver incorreto, recalcular dimensões
      if (isAspectRatioIncorrect) {
        // Dimensão base padrão (200px)
        const baseSize = 200;
        
        // Determinar orientação e calcular dimensões proporcionais
        let newWidth = decoration.width;
        let newHeight = decoration.height;
        
        if (imgH > imgW) {
          // Imagem VERTICAL: manter largura base, calcular altura proporcionalmente
          newWidth = baseSize;
          newHeight = baseSize / imageAspectRatio; // baseSize / (imgW/imgH) = baseSize * (imgH/imgW)
        } else if (imgW > imgH) {
          // Imagem HORIZONTAL: manter altura base, calcular largura proporcionalmente
          newWidth = baseSize * imageAspectRatio; // baseSize * (imgW/imgH)
          newHeight = baseSize;
        } else {
          // Imagem QUADRADA: manter dimensões quadradas
          newWidth = baseSize;
          newHeight = baseSize;
        }
        
        // Verificar se há diferença significativa (> 0.5px) em qualquer dimensão
        const widthDiff = Math.abs(newWidth - decoration.width);
        const heightDiff = Math.abs(newHeight - decoration.height);
        
        if (widthDiff > 0.5 || heightDiff > 0.5) {
          isAdjustingRef.current = true;
          adjustedAspectRatioRef.current = true;
          
          // Usar requestAnimationFrame para evitar atualização durante render
          requestAnimationFrame(() => {
            if (isAdjustingRef.current) {
              onChange({
                ...decoration,
                width: newWidth,
                height: newHeight,
                // manter demais propriedades inalteradas
              });
              // Atualizar hash após ajuste
              lastHashRef.current = `${imgW}x${imgH}-${newWidth}x${newHeight}`;
              // Resetar flag após um pequeno delay
              setTimeout(() => {
                isAdjustingRef.current = false;
              }, 100);
            }
          });
        } else {
          adjustedAspectRatioRef.current = true;
          lastHashRef.current = currentHash;
        }
      } else {
        // Aspect ratio está correto, marcar como ajustado
        adjustedAspectRatioRef.current = true;
        lastHashRef.current = currentHash;
      }
    }
    };
    
    // Executar imediatamente se a imagem já está carregada, senão aguardar um frame
    if (image.complete && image.naturalWidth > 0) {
      // Imagem já está carregada, executar imediatamente
      checkAndAdjust();
    } else {
      // Aguardar um frame para garantir que a imagem está totalmente carregada
      requestAnimationFrame(() => {
        setTimeout(checkAndAdjust, 50);
      });
    }
  }, [image]); // Manter apenas image como dependência para evitar loops
};


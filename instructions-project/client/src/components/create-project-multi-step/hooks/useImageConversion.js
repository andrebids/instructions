import { useState, useEffect, useRef } from 'react';

/**
 * Hook para gerenciar conversão dia/noite e análise YOLO12
 * Controla sequência de animação GIF e disparo de análises
 * 
 * @param {Object} params
 * @param {Array} params.uploadedImages - Imagens disponíveis após upload
 * @returns {Object} - Estados e funções de conversão e análise
 */
export const useImageConversion = ({ uploadedImages }) => {
  const [activeGifIndex, setActiveGifIndex] = useState(-1); // Controla qual thumbnail mostra GIF
  const [conversionComplete, setConversionComplete] = useState({}); // Mapeia quais imagens completaram conversão
  const [analysisComplete, setAnalysisComplete] = useState({}); // Mapeia quais imagens completaram análise
  const [analyzingImageId, setAnalyzingImageId] = useState(null); // ID da imagem sendo analisada
  const prevActiveGifIndexRef = useRef(-1); // Rastrear índice anterior do GIF ativo

  /**
   * Callback quando upload completo
   * Inicia sequência de conversão automática sequencial
   */
  const handleUploadComplete = () => {
    // Mudar para 'loading' antes de mostrar imagens
    // Após um breve delay, popular uploadedImages e mostrar interface
    setTimeout(() => {
      // Iniciar conversão automática sequencial após upload
      // Começar com primeira imagem após 500ms
      setTimeout(() => {
        setActiveGifIndex(0); // Source 1
      }, 500);
      
      // Sequência de animação do GIF: Source 1 -> Source 2 -> Source 3 -> desaparece
      setTimeout(() => {
        setActiveGifIndex(1); // Source 2
      }, 4500); // 500ms delay inicial + 4000ms conversão da primeira
      
      setTimeout(() => {
        setActiveGifIndex(2); // Source 3
      }, 8500); // 500ms + 4000ms + 4000ms
      
      setTimeout(() => {
        setActiveGifIndex(-1); // Desaparece após todas convertidas (dar tempo extra para a 3ª imagem completar)
      }, 13000); // 500ms + 4000ms * 3 + 500ms extra para garantir que a 3ª imagem completa
    }, 300);
  };

  /**
   * Função recursiva para disparar análise YOLO12 sequencialmente
   * @param {string} imageId - ID da imagem a analisar
   */
  const triggerYOLOAnalysis = function(imageId) {
    if (!imageId) return;
    
    // Verificar se já foi analisada usando o estado atual
    setAnalysisComplete(function(prev) {
      if (prev[imageId]) {
        return prev; // Já analisada, não fazer nada
      }
      
      console.log('🔍 Disparando análise YOLO12 para imagem:', imageId);
      setAnalyzingImageId(imageId);
      
      // Após análise completar
      setTimeout(function() {
        console.log('✅ Análise YOLO12 completa para imagem:', imageId);
        setAnalyzingImageId(null);
        
        // Marcar como completa
        setAnalysisComplete(function(prevState) {
          var updated = {};
          for (var key in prevState) {
            updated[key] = prevState[key];
          }
          updated[imageId] = true;
          
          // Encontrar próximo índice
          var currentIndex = uploadedImages.findIndex(function(img) {
            return img.id === imageId;
          });
          
          // Disparar análise na próxima imagem se houver
          if (currentIndex >= 0 && currentIndex < uploadedImages.length - 1) {
            var nextImageId = uploadedImages[currentIndex + 1].id;
            
            setTimeout(function() {
              triggerYOLOAnalysis(nextImageId);
            }, 300);
          }
          
          return updated;
        });
      }, 2500); // Duração da animação YOLO12
      
      return prev;
    });
  };

  // Rastrear quando conversão para noite completa
  useEffect(function() {
    // Quando activeGifIndex muda, marcar imagem anterior como convertida (se houver)
    var prevIndex = prevActiveGifIndexRef.current;
    
    if (activeGifIndex >= 0 && activeGifIndex < uploadedImages.length) {
      var imageId = uploadedImages[activeGifIndex].id;
      
      // Se mudou para uma nova imagem, marcar a anterior como convertida imediatamente
      if (prevIndex >= 0 && prevIndex < uploadedImages.length && prevIndex !== activeGifIndex) {
        var prevImageId = uploadedImages[prevIndex].id;
        setConversionComplete(function(prev) {
          if (!prev[prevImageId]) {
            var updated = {};
            for (var key in prev) {
              updated[key] = prev[key];
            }
            updated[prevImageId] = true;
            console.log('✅ Conversão completa para imagem anterior:', prevImageId);
            return updated;
          }
          return prev;
        });
      }
      
      // Marcar conversão como completa após 4000ms (duração da animação)
      var timeoutId = setTimeout(function() {
        setConversionComplete(function(prev) {
          if (!prev[imageId]) {
            var updated = {};
            for (var key in prev) {
              updated[key] = prev[key];
            }
            updated[imageId] = true;
            console.log('✅ Conversão completa para imagem:', imageId);
            return updated;
          }
          return prev;
        });
      }, 4000); // Duração da animação do NightThumb
      
      // Atualizar ref do índice anterior
      prevActiveGifIndexRef.current = activeGifIndex;
      
      return function() {
        clearTimeout(timeoutId);
      };
    } else if (activeGifIndex === -1 && uploadedImages.length > 0) {
      // Quando activeGifIndex volta para -1, todas as imagens foram convertidas
      // Marcar a última imagem (índice 2) como convertida imediatamente se ainda não foi marcada
      var lastIndex = uploadedImages.length - 1;
      if (lastIndex >= 0) {
        var lastImageId = uploadedImages[lastIndex].id;
        setConversionComplete(function(prev) {
          if (!prev[lastImageId]) {
            var updated = {};
            for (var key in prev) {
              updated[key] = prev[key];
            }
            updated[lastImageId] = true;
            console.log('✅ Conversão completa para última imagem (índice', lastIndex + '):', lastImageId);
            return updated;
          }
          return prev;
        });
      }
      
      // Também marcar qualquer outra imagem que possa ter sido perdida
      var finalTimeoutId = setTimeout(function() {
        setConversionComplete(function(prev) {
          var updated = {};
          for (var key in prev) {
            updated[key] = prev[key];
          }
          // Marcar todas as imagens que ainda não foram marcadas
          for (var i = 0; i < uploadedImages.length; i++) {
            var imgId = uploadedImages[i].id;
            if (!updated[imgId]) {
              updated[imgId] = true;
              console.log('✅ Conversão completa para imagem final (backup):', imgId);
            }
          }
          return updated;
        });
        prevActiveGifIndexRef.current = -1;
      }, 100); // Pequeno delay para garantir que timeouts anteriores completaram
      
      return function() {
        clearTimeout(finalTimeoutId);
      };
    }
  }, [activeGifIndex, uploadedImages]);

  // Detectar quando conversão para noite completa e disparar análise YOLO12 sequencialmente
  useEffect(function() {
    if (activeGifIndex >= 0 && activeGifIndex < uploadedImages.length) {
      var imageId = uploadedImages[activeGifIndex].id;
      
      // Verificar se análise ainda não foi iniciada para esta imagem
      setAnalysisComplete(function(prev) {
        if (!prev[imageId]) {
          // Disparar após conversão completar (4 segundos)
          var timeoutId = setTimeout(function() {
            triggerYOLOAnalysis(imageId);
          }, 4000); // Aguardar conversão completar (duração do NightThumb)
          
          return prev;
        }
        return prev;
      });
    }
  }, [activeGifIndex, uploadedImages]);

  return {
    activeGifIndex,
    setActiveGifIndex,
    conversionComplete,
    setConversionComplete,
    analysisComplete,
    setAnalysisComplete,
    analyzingImageId,
    setAnalyzingImageId,
    triggerYOLOAnalysis,
    handleUploadComplete
  };
};


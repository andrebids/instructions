import { useState, useEffect, useRef } from 'react';
import { convertToNight } from '../../../services/dayNightAPI';

/**
 * Hook para gerenciar conversão dia/noite e análise YOLO12
 * Controla sequência de animação GIF e disparo de análises
 * Preparado para usar API real quando disponível
 * 
 * @param {Object} params
 * @param {Array} params.uploadedImages - Imagens disponíveis após upload
 * @param {string} params.projectId - ID do projeto (opcional, para API futura)
 * @returns {Object} - Estados e funções de conversão e análise
 */
export const useImageConversion = ({ uploadedImages, projectId = null }) => {
  const [activeGifIndex, setActiveGifIndex] = useState(-1); // Controla qual thumbnail mostra GIF
  const [conversionComplete, setConversionComplete] = useState({}); // Mapeia quais imagens completaram conversão
  const [analysisComplete, setAnalysisComplete] = useState({}); // Mapeia quais imagens completaram análise
  const [analyzingImageId, setAnalyzingImageId] = useState(null); // ID da imagem sendo analisada
  const prevActiveGifIndexRef = useRef(-1); // Rastrear índice anterior do GIF ativo

  /**
   * Callback quando upload completo
   * Inicia sequência de conversão automática sequencial
   * Só inicia animação se a API estiver disponível (há nightVersion ou conversionStatus não é 'failed'/'unavailable')
   * @param {Array} imagesToUse - Array opcional de imagens a usar (se não fornecido, usa uploadedImages do hook)
   */
  const handleUploadComplete = (imagesToUse = null) => {
    // Usar imagens fornecidas ou as do hook
    const images = imagesToUse || uploadedImages;
    
    // Mudar para 'loading' antes de mostrar imagens
    // Após um breve delay, popular uploadedImages e mostrar interface
    setTimeout(() => {
      // Verificar se há pelo menos uma imagem com nightVersion disponível (API funcionou)
      const hasAvailableAPI = images.some(img => {
        const hasNightVersion = !!img.nightVersion;
        const conversionNotFailed = img.conversionStatus !== 'failed' && img.conversionStatus !== 'unavailable';
        // Só considerar API disponível se realmente tem nightVersion E não falhou
        return hasNightVersion && conversionNotFailed;
      });
      
      // Se não há API disponível, não iniciar animação
      if (!hasAvailableAPI) {
        return;
      }
      
      // Iniciar conversão automática sequencial após upload
      // Verificar cada imagem antes de ativar animação
      let currentDelay = 500;
      let currentIndex = 0;
      
      // Função para processar próxima imagem com API disponível
      const processNextImage = () => {
        // Encontrar próxima imagem com API disponível (tem nightVersion e não falhou)
        while (currentIndex < images.length) {
          const image = images[currentIndex];
          const hasNightVersion = !!image.nightVersion;
          const conversionNotFailed = image.conversionStatus !== 'failed' && image.conversionStatus !== 'unavailable';
          
          // Só ativar animação se realmente tem nightVersion disponível
          if (hasNightVersion && conversionNotFailed) {
            // API disponível - ativar animação
            setActiveGifIndex(currentIndex);
            
            // Agendar próxima imagem
            currentIndex++;
            if (currentIndex < images.length) {
              setTimeout(processNextImage, 4000); // 4000ms = duração da animação
            } else {
              // Todas as imagens processadas - desativar animação
              setTimeout(() => {
                setActiveGifIndex(-1);
              }, 4000);
            }
            return;
          } else {
            // API não disponível para esta imagem - pular
            currentIndex++;
          }
        }
        
        // Todas as imagens processadas - desativar animação
        setActiveGifIndex(-1);
      };
      
      // Começar processamento após delay inicial
      setTimeout(processNextImage, currentDelay);
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
      
      setAnalyzingImageId(imageId);
      
      // Após análise completar
      setTimeout(function() {
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
      var image = uploadedImages[activeGifIndex];
      
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
            return updated;
          }
          return prev;
        });
      }
      
      // Tentar conversão via API se imagem ainda não tem nightVersion
      // STATUS: API de conversão dia/noite ainda não está disponível
      // Por enquanto, usar fallback (filtros CSS) até API estar disponível
      // Quando a API estiver pronta, descomentar e usar:
      // const conversionResult = await convertToNight(imageId, image.originalUrl, projectId);
      // if (conversionResult.nightVersion) {
      //   // Atualizar imagem com nightVersion real
      // }
      
      // Verificar se conversão falhou
      if (image.conversionStatus === 'failed' || image.conversionStatus === 'unavailable') {
        // Se já está marcado como falhado, marcar como completa mas sem nightVersion
        // Isso permite que o botão funcione mas mostra mensagem de erro
        setConversionComplete(function(prev) {
          if (!prev[imageId]) {
            var updated = {};
            for (var key in prev) {
              updated[key] = prev[key];
            }
            updated[imageId] = true;
            return updated;
          }
          return prev;
        });
        prevActiveGifIndexRef.current = activeGifIndex;
      } else if (!image.nightVersion && image.originalUrl) {
        // Fallback: marcar como completa após animação (usa filtros CSS)
        // A conversão real será feita quando a API estiver disponível
        // Por enquanto, permite usar modo Day normalmente
        var timeoutId = setTimeout(function() {
          setConversionComplete(function(prev) {
            if (!prev[imageId]) {
              var updated = {};
              for (var key in prev) {
                updated[key] = prev[key];
              }
              updated[imageId] = true;
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
      } else {
        // Se já tem nightVersion, marcar como completa imediatamente
        setConversionComplete(function(prev) {
          if (!prev[imageId]) {
            var updated = {};
            for (var key in prev) {
              updated[key] = prev[key];
            }
            updated[imageId] = true;
            return updated;
          }
          return prev;
        });
        prevActiveGifIndexRef.current = activeGifIndex;
      }
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

  // Análise YOLO12 removida - não é mais necessária após remoção de zonas
  // Quando a API de conversão dia/noite estiver disponível, a conversão será automática
  // e não será necessário disparar análises separadas

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


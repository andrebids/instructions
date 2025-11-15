import { useState, useEffect, useRef } from 'react';
import useSourceImages from './useSourceImages';
import { calculateImageDimensions, getCenterPosition } from '../utils/canvasCalculations';

/**
 * Hook para gerenciar estados principais do canvas
 * Gerencia estados de UI, decorações, imagens, modo dia/noite
 * 
 * @param {Object} params
 * @param {Object} params.formData - Dados do formulário
 * @param {Function} params.onInputChange - Callback para atualizar formData
 * @param {Object} params.conversionComplete - Mapeia quais imagens completaram conversão
 * @param {Object} params.analysisComplete - Mapeia quais imagens completaram análise
 * @returns {Object} - Estados e setters do canvas
 */
export const useCanvasState = ({ formData, onInputChange, conversionComplete, analysisComplete }) => {
  const [decorations, setDecorations] = useState([]);
  const [noBgWarning, setNoBgWarning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadStep, setUploadStep] = useState('uploading'); // 'uploading', 'loading', 'done'
  const [selectedImage, setSelectedImage] = useState(null);
  const [canvasImages, setCanvasImages] = useState([]); // Imagens adicionadas ao canvas
  const [isDayMode, setIsDayMode] = useState(true); // Controla se mostra imagem de dia ou noite
  const [uploadedImages, setUploadedImages] = useState([]); // Imagens disponíveis após upload completo
  
  // Carregar Source Images da API usando hook
  const { sourceImages, loading: sourceImagesLoading, error: sourceImagesError } = useSourceImages();
  
  // Fallback para imagens demo (apenas para desenvolvimento/testes quando não há imagens reais)
  // Em produção, este fallback só será usado se não houver imagens uploadadas
  const loadedImages = sourceImages && sourceImages.length > 0 ? sourceImages : (
    // Apenas usar imagens demo se não houver imagens reais do upload
    // Este fallback será removido quando não for mais necessário para testes
    process.env.NODE_ENV === 'development' ? [
      { 
        id: 'source-img-1', 
        name: 'source 1.jpeg', 
        thumbnail: '/demo-images/sourceday/SOURCE1.jpg',
        nightVersion: '/demo-images/sourcenight/SOURCE1.png',
        originalUrl: '/demo-images/sourceday/SOURCE1.jpg',
        dayVersion: '/demo-images/sourceday/SOURCE1.jpg'
      },
      { 
        id: 'source-img-2', 
        name: 'source 2.jpeg', 
        thumbnail: '/demo-images/sourceday/SOURCE2.jpg',
        nightVersion: '/demo-images/sourcenight/SOURCE2.png',
        originalUrl: '/demo-images/sourceday/SOURCE2.jpg',
        dayVersion: '/demo-images/sourceday/SOURCE2.jpg'
      },
      { 
        id: 'source-img-3', 
        name: 'source 3.jpeg', 
        thumbnail: '/demo-images/sourceday/SOURCE3.png',
        nightVersion: '/demo-images/sourcenight/SOURCE3.png',
        originalUrl: '/demo-images/sourceday/SOURCE3.png',
        dayVersion: '/demo-images/sourceday/SOURCE3.png'
      },
    ] : []
  );

  // Ref para rastrear se já carregamos os dados deste projeto
  const loadedProjectIdRef = useRef(null);
  
  // Carregar dados salvos do formData ao inicializar E quando formData mudar (modo edição)
  useEffect(function() {
    const projectId = formData?.id || formData?.tempProjectId;
    if (!projectId) return; // Só restaurar se houver um projeto (modo edição)
    
    // Se já carregamos os dados deste projeto, não carregar novamente
    if (loadedProjectIdRef.current === projectId) {
      return;
    }
    
    // Marcar que estamos carregando este projeto
    loadedProjectIdRef.current = projectId;
    
    // Restaurar imagens uploadadas
    if (formData?.uploadedImages && Array.isArray(formData.uploadedImages) && formData.uploadedImages.length > 0) {
      setUploadedImages(formData.uploadedImages);
      
      // Restaurar uploadStep baseado no estado salvo ou nas imagens disponíveis
      const savedSimulationState = formData?.simulationState || {};
      const savedUploadStep = savedSimulationState.uploadStep || (formData.uploadedImages.length > 0 ? 'done' : 'uploading');
      setUploadStep(savedUploadStep);
    } else {
      // Se não houver imagens salvas, manter estado de upload
      setUploadStep('uploading');
    }
    
    // Restaurar modo dia/noite
    if (formData?.simulationState?.isDayMode !== undefined) {
      setIsDayMode(formData.simulationState.isDayMode);
    }
    
    // Restaurar decorações
    if (formData?.canvasDecorations && Array.isArray(formData.canvasDecorations) && formData.canvasDecorations.length > 0) {
      setDecorations(formData.canvasDecorations);
    }
    
    // Restaurar imagens do canvas
    if (formData?.canvasImages && Array.isArray(formData.canvasImages) && formData.canvasImages.length > 0) {
      setCanvasImages(formData.canvasImages);
      
      // Restaurar imagem selecionada baseada no simulationState ou na primeira imagem do canvas
      const savedSimulationState = formData?.simulationState || {};
      if (savedSimulationState.selectedImageId && formData.uploadedImages) {
        // Tentar encontrar a imagem salva na lista de uploadedImages
        const savedImage = formData.uploadedImages.find(img => img.id === savedSimulationState.selectedImageId);
        if (savedImage) {
          setSelectedImage(savedImage);
        } else {
          // Se não encontrar, usar a primeira imagem do canvas
          const firstImage = formData.canvasImages.find(img => img.isSourceImage);
          if (firstImage) {
            setSelectedImage(firstImage);
          }
        }
      } else {
        // Se não houver selectedImageId salvo, selecionar a primeira imagem do canvas
        const firstImage = formData.canvasImages.find(img => img.isSourceImage);
        if (firstImage) {
          setSelectedImage(firstImage);
        }
      }
    }
  }, [formData?.id, formData?.tempProjectId]); // Executar quando formData.id ou tempProjectId mudar

  /**
   * Adicionar imagem source ao canvas (substitui a anterior)
   * @param {Object} image - Imagem a adicionar
   * @param {boolean|null} useDayMode - Modo dia/noite (null = auto-determinar)
   * @param {Object} conversionComplete - Mapeia quais imagens completaram conversão
   * @param {Object} analysisComplete - Mapeia quais imagens completaram análise
   * @param {Object|null} cartoucheData - Dados do cartouche para esta imagem (se existir)
   */
  const handleImageAddToCanvas = (image, useDayMode = null, conversionComplete = {}, analysisComplete = {}, cartoucheData = null) => {
    console.log('📸🖼️ ===== SOURCE IMAGE CLICADA =====');
    console.log('📸 Nome:', image.name);
    console.log('📸 ID:', image.id);
    
    // Verificar se conversão foi completada antes de permitir clique
    if (!conversionComplete[image.id]) {
      console.log('⚠️ Conversão ainda não completada para imagem:', image.id);
      return; // Bloquear clique se conversão não estiver completa
    }
    
    // Se useDayMode não foi especificado, determinar o modo baseado em:
    // - Se a análise foi completada e é uma nova seleção (imagem diferente), usar noite primeiro
    // - Caso contrário, usar o modo atual (isDayMode)
    let finalDayMode = useDayMode;
    if (finalDayMode === null) {
      const isNewImageSelection = !selectedImage || selectedImage.id !== image.id;
      const isAnalysisComplete = analysisComplete && analysisComplete[image.id] === true;
      const hasNightVersion = !!image.nightVersion;
      
      // Se é uma nova seleção, análise completa e tem versão noturna, mostrar noite primeiro
      if (isNewImageSelection && isAnalysisComplete && hasNightVersion) {
        finalDayMode = false; // Modo noite
        setIsDayMode(false); // Atualizar estado para refletir no botão toggle
        console.log('🌙 Exibindo versão de noite primeiro (análise completa)');
      } else {
        finalDayMode = isDayMode; // Usar modo atual
      }
    }
    
    console.log('📸 Modo:', finalDayMode ? 'Day' : 'Night');
    
    // Escolher a imagem correta baseada no modo
    // Se nightVersion não existir, usar thumbnail como fallback
    const imageSrc = finalDayMode 
      ? (image.thumbnail || image.dayVersion || image.originalUrl)
      : (image.nightVersion || image.thumbnail || image.dayVersion || image.originalUrl);
    console.log('📸 URL:', imageSrc);
    
    // Usar dimensões virtuais do canvas (sempre 1200x600)
    const canvasWidth = 1200;
    const canvasHeight = 600;
    const { centerX, centerY } = getCenterPosition(canvasWidth, canvasHeight);
    
    // Calcular dimensões da imagem para caber no canvas mantendo aspect ratio
    // Assumindo aspect ratio 4:3 das imagens (pode ser ajustado)
    const imageAspectRatio = 4 / 3;
    const { imageWidth, imageHeight } = calculateImageDimensions(imageAspectRatio, canvasWidth, canvasHeight, 0.96);
    
    console.log('📐 Canvas:', canvasWidth, 'x', canvasHeight);
    console.log('📐 Imagem:', imageWidth, 'x', imageHeight);
    
    const newImageLayer = {
      id: `img-${Date.now()}`, // ID único com prefixo
      type: 'image',
      name: image.name,
      src: imageSrc,
      x: centerX,
      y: centerY,
      width: imageWidth,
      height: imageHeight,
      isSourceImage: true,
      // Incluir metadados do cartouche na imagem (IMPORTANTE: ficam ligados à imagem)
      cartouche: cartoucheData ? {
        projectName: cartoucheData.projectName || null,
        streetOrZone: cartoucheData.streetOrZone || null,
        option: cartoucheData.option || 'base',
        hasCartouche: cartoucheData.hasCartouche || false
      } : null,
      // Incluir também referência à imagem original
      imageId: image.id,
      originalUrl: image.originalUrl || image.thumbnail,
      dayVersion: image.dayVersion || image.thumbnail,
      nightVersion: image.nightVersion || null
    };
    
    console.log('✅ Imagem adicionada ao canvas:', newImageLayer);
    
    // Verificar se é a mesma imagem (apenas mudança de modo dia/noite)
    const isSameImage = selectedImage && selectedImage.id === image.id;
    
    // Se for a mesma imagem, preservar o cartouche; caso contrário, carregar/remover conforme necessário
    if (isSameImage) {
      // Preservar cartouche ao trocar apenas o modo dia/noite
      const existingCartouche = canvasImages.find(img => img.isCartouche);
      if (existingCartouche) {
        // Atualizar cartouche com novas dimensões da imagem de fundo (caso mudem)
        const updatedCartouche = {
          ...existingCartouche,
          x: newImageLayer.x,
          y: newImageLayer.y,
          width: newImageLayer.width,
          height: newImageLayer.height
        };
        // Atualizar apenas a imagem de fundo, mantendo o cartouche atualizado
        setCanvasImages([newImageLayer, updatedCartouche]);
        console.log('🔄 Preservando cartouche ao trocar modo dia/noite');
      } else {
        // Não há cartouche, apenas substituir a imagem
        setCanvasImages([newImageLayer]);
      }
    } else {
      // Nova imagem selecionada - verificar se há cartouche salvo para esta imagem
      console.log('🔍 Verificando cartouche para nova imagem:', image.id, {
        cartoucheData,
        hasCartouche: cartoucheData?.hasCartouche
      });
      
      if (cartoucheData && cartoucheData.hasCartouche === true) {
        // Carregar cartouche salvo para esta imagem
        const cartouchePath = '/cartouches/CARTOUCHEpaysage.png';
        const cartoucheImage = {
          id: `cartouche-${Date.now()}`,
          type: 'image',
          name: 'Cartouche',
          src: cartouchePath,
          x: newImageLayer.x,
          y: newImageLayer.y,
          width: newImageLayer.width,
          height: newImageLayer.height,
          isCartouche: true
        };
        setCanvasImages([newImageLayer, cartoucheImage]);
        console.log('✅ Carregando cartouche salvo para imagem:', image.id, {
          cartoucheImage: {
            x: cartoucheImage.x,
            y: cartoucheImage.y,
            width: cartoucheImage.width,
            height: cartoucheImage.height
          }
        });
      } else {
        // Não há cartouche salvo, apenas substituir a imagem
        setCanvasImages([newImageLayer]);
        console.log('🔄 Nova imagem selecionada - sem cartouche salvo ou hasCartouche !== true', {
          cartoucheData,
          hasCartouche: cartoucheData?.hasCartouche
        });
      }
    }
    
    setSelectedImage(image);
  };

  /**
   * Remover imagem do canvas
   * @param {string} imageId - ID da imagem a remover
   */
  const handleImageRemoveFromCanvas = (imageId) => {
    setCanvasImages(prev => prev.filter(img => img.id !== imageId));
  };

  /**
   * Alternar entre modo dia e noite
   * Atualiza imagens das decorações e do canvas
   */
  const toggleDayNightMode = () => {
    const newMode = !isDayMode;
    setIsDayMode(newMode);
    
    // Se há uma imagem selecionada, atualizar a imagem no canvas
    if (selectedImage && canvasImages.length > 0) {
      console.log('🌓 Alternando modo:', newMode ? 'Day' : 'Night');
      handleImageAddToCanvas(selectedImage, newMode);
    }
  };

  // Trocar as imagens das decorações quando alternar dia/noite
  useEffect(function() {
    // Usar função de atualização para evitar dependência de decorations
    setDecorations(function(prev) {
      // Verificar se realmente precisa atualizar (evitar loops)
      var needsUpdate = false;
      var next = [];
      for (var i = 0; i < prev.length; i++) {
        var d = prev[i];
        if (d.dayUrl || d.nightUrl) {
          var nextSrc = isDayMode ? (d.dayUrl || d.src) : (d.nightUrl || d.dayUrl || d.src);
          if (d.src !== nextSrc) {
            needsUpdate = true;
            next.push(Object.assign({}, d, { src: nextSrc }));
          } else {
            next.push(d);
          }
        } else {
          next.push(d);
        }
      }
      // Só retornar novo array se houver mudanças (evita re-renders desnecessários)
      return needsUpdate ? next : prev;
    });
  }, [isDayMode]); // Removido decorations das dependências para evitar loop infinito

  return {
    decorations,
    setDecorations,
    canvasImages,
    setCanvasImages,
    selectedImage,
    setSelectedImage,
    isDayMode,
    setIsDayMode,
    uploadStep,
    setUploadStep,
    uploadedImages,
    setUploadedImages,
    noBgWarning,
    setNoBgWarning,
    isGenerating,
    setIsGenerating,
    loadedImages,
    sourceImagesLoading,
    sourceImagesError,
    handleImageAddToCanvas,
    handleImageRemoveFromCanvas,
    toggleDayNightMode
  };
};


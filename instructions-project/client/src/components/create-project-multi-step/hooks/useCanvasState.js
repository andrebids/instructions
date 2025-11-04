import { useState, useEffect } from 'react';
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
  const [showSnapZones, setShowSnapZones] = useState(true); // Mostrar/ocultar visualização das snap zones
  
  // Carregar Source Images da API usando hook
  const { sourceImages, loading: sourceImagesLoading, error: sourceImagesError } = useSourceImages();
  
  // Fallback para imagens hardcoded caso API não retorne dados
  const loadedImages = sourceImages && sourceImages.length > 0 ? sourceImages : [
    { 
      id: 'source-img-1', 
      name: 'source 1.jpeg', 
      thumbnail: '/demo-images/sourceday/SOURCE1.jpg',
      nightVersion: '/demo-images/sourcenight/SOURCE1.png'
    },
    { 
      id: 'source-img-2', 
      name: 'source 2.jpeg', 
      thumbnail: '/demo-images/sourceday/SOURCE2.jpg',
      nightVersion: '/demo-images/sourcenight/SOURCE2.png'
    },
    { 
      id: 'source-img-3', 
      name: 'source 3.jpeg', 
      thumbnail: '/demo-images/sourceday/SOURCE3.png',
      nightVersion: '/demo-images/sourcenight/SOURCE3.png'
    },
  ];

  // Carregar dados salvos do formData ao inicializar E quando formData mudar
  useEffect(function() {
    if (formData?.canvasDecorations && Array.isArray(formData.canvasDecorations) && formData.canvasDecorations.length > 0) {
      console.log('📦 Carregando decorações salvas do formData:', formData.canvasDecorations.length, 'decorações');
      setDecorations(formData.canvasDecorations);
    }
  }, [formData?.id]); // Executar quando formData.id mudar

  /**
   * Adicionar imagem source ao canvas (substitui a anterior)
   * @param {Object} image - Imagem a adicionar
   * @param {boolean|null} useDayMode - Modo dia/noite (null = auto-determinar)
   * @param {Object} conversionComplete - Mapeia quais imagens completaram conversão
   * @param {Object} analysisComplete - Mapeia quais imagens completaram análise
   */
  const handleImageAddToCanvas = (image, useDayMode = null, conversionComplete = {}, analysisComplete = {}) => {
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
    const imageSrc = finalDayMode ? image.thumbnail : image.nightVersion;
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
      isSourceImage: true
    };
    
    console.log('✅ Imagem adicionada ao canvas:', newImageLayer);
    
    // SUBSTITUI a imagem anterior (não adiciona)
    setCanvasImages([newImageLayer]);
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
    console.log('[CANVAS] mode', isDayMode ? 'day' : 'night');
    setDecorations(function(prev) {
      var next = [];
      for (var i = 0; i < prev.length; i++) {
        var d = prev[i];
        if (d.dayUrl || d.nightUrl) {
          var nextSrc = isDayMode ? (d.dayUrl || d.src) : (d.nightUrl || d.dayUrl || d.src);
          next.push(Object.assign({}, d, { src: nextSrc }));
        } else {
          next.push(d);
        }
      }
      return next;
    });
  }, [isDayMode]);

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
    showSnapZones,
    setShowSnapZones,
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


import React, { useState, useEffect } from "react";
import { Card, CardFooter, Button, Spinner, Progress, Image, Tooltip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { DecorationLibrary } from "../../decoration-library";
import { NightThumb } from '../../ui/NightThumb';
// YOLO12ThumbnailOverlay removido - análise não é mais necessária após remoção de zonas
import { UploadModal } from '../components/UploadModal';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { KonvaCanvas } from '../components/konva/KonvaCanvas';
import { StreetNameInput } from '../components/StreetNameInput';
import { useCanvasState } from '../hooks/useCanvasState';
import { useImageConversion } from '../hooks/useImageConversion';
import { useDecorationManagement } from '../hooks/useDecorationManagement';
import { useCanvasPersistence } from '../hooks/useCanvasPersistence';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { getDecorationColor } from '../utils/decorationUtils';
import { getCenterPosition } from '../utils/canvasCalculations';

// Função utilitária para mapear caminhos de upload para /api/uploads/
const mapImagePath = (path) => {
  if (!path) return path;
  // Se já é URL completa (http/https), usar diretamente
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseApi = (import.meta?.env?.VITE_API_URL || '').replace(/\/$/, '') || '';
  // Se tem baseApi configurado, usar ele
  if (baseApi && path.indexOf('/uploads/') === 0) return baseApi + path;
  // Sem baseApi: converter /uploads/ para /api/uploads/ para passar pelo proxy
  if (path.indexOf('/uploads/') === 0) return '/api' + path;
  return path;
};

export const StepAIDesigner = ({ formData, onInputChange, selectedImage: externalSelectedImage }) => {
  // Estados locais adicionais (não extraídos para hooks)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false); // Modal de informações de localização
  const [isDecorationDrawerOpen, setIsDecorationDrawerOpen] = useState(false); // Drawer de decorações
  const [showNightUnavailableToast, setShowNightUnavailableToast] = useState(false); // Toast para avisar que night não está disponível
  
  // Hook para detectar responsividade
  const { shouldUseDrawer, isMobile, isTablet, width } = useResponsiveLayout();
  
  // Debug removido - estava causando logs infinitos durante interações

  // Usar hooks customizados - ordem importa para dependências
  const canvasState = useCanvasState({ 
    formData, 
    onInputChange,
    conversionComplete: {}, // Será atualizado depois
    analysisComplete: {} // Será atualizado depois
  });
  
  const imageConversion = useImageConversion({ 
    uploadedImages: canvasState.uploadedImages,
    projectId: formData?.id || formData?.tempProjectId 
  });
  
  const decorationManagement = useDecorationManagement({ 
    selectedImage: canvasState.selectedImage 
  });

  // Handler para upload completo - atualizar uploadedImages e iniciar conversão
  const handleUploadComplete = (uploadedImages = null) => {
    // Mudar para 'loading' antes de mostrar imagens
    canvasState.setUploadStep('loading');
    
    // Se recebeu imagens do upload real, usar essas; senão usar fallback demo
    const imagesToUse = uploadedImages && uploadedImages.length > 0 
      ? uploadedImages.map(img => ({
          id: img.id,
          name: img.name,
          thumbnail: img.thumbnail || img.dayVersion || img.originalUrl,
          nightVersion: img.nightVersion || null,
          originalUrl: img.originalUrl,
          dayVersion: img.dayVersion || img.originalUrl,
          conversionStatus: img.conversionStatus || 'pending',
          cartouche: img.cartouche || null
        }))
      : canvasState.loadedImages; // Fallback para imagens demo
    
    // Após um breve delay, popular uploadedImages e mostrar interface
    setTimeout(() => {
      canvasState.setUploadedImages(imagesToUse);
      canvasState.setUploadStep('done');
      
      // Salvar uploadedImages e simulationState no formData
      onInputChange?.('uploadedImages', imagesToUse);
      const currentSimulationState = formData?.simulationState || {
        uploadStep: 'done',
        selectedImageId: null,
        isDayMode: canvasState.isDayMode,
        conversionComplete: {}
      };
      onInputChange?.('simulationState', { ...currentSimulationState, uploadStep: 'done' });
      
      // Verificar se já há conversões completas salvas (modo restauração)
      const savedConversionComplete = formData?.simulationState?.conversionComplete || {};
      const hasSavedConversions = Object.keys(savedConversionComplete).length > 0;
      
      // Se já há conversões salvas, restaurá-las em vez de iniciar novas
      if (hasSavedConversions) {
        imageConversion.setConversionComplete(savedConversionComplete);
      } else {
        // Iniciar conversão automática sequencial após upload usando imageConversion
        // Passar imagesToUse para garantir que usa as imagens corretas
        imageConversion.handleUploadComplete(imagesToUse);
      }
    }, 300);
  };

  // Wrapper para handleImageAddToCanvas que também salva decorações e cartouche
  const handleImageAddToCanvas = (image, useDayMode = null) => {
    // Obter estado atual do cartoucheByImage (usar formData como base)
    let currentCartoucheByImage = formData?.cartoucheByImage || {};
    
    // Guardar decorações da imagem anterior antes de trocar
    if (canvasState.selectedImage && canvasState.selectedImage.id !== image.id) {
      decorationManagement.saveDecorationsForImage(canvasState.selectedImage.id, canvasState.decorations);
      
      // Guardar estado do cartouche da imagem anterior (sempre salvar, mesmo se não houver)
      const hasCartouche = canvasState.canvasImages.some(img => img.isCartouche);
      const previousCartouche = getCartoucheForImage(canvasState.selectedImage.id);
      currentCartoucheByImage = {
        ...currentCartoucheByImage,
        [canvasState.selectedImage.id]: {
          projectName: getDefaultProjectName(),
          streetOrZone: previousCartouche.streetOrZone,
          option: previousCartouche.option,
          hasCartouche: hasCartouche
        }
      };
      onInputChange?.('cartoucheByImage', currentCartoucheByImage);
    }
    
    // Carregar decorações da nova imagem do mapeamento
    const newImageDecorations = decorationManagement.loadDecorationsForImage(image.id);
    canvasState.setDecorations(newImageDecorations);
    
    // Obter dados do cartouche para a nova imagem
    // Priorizar cartouche da imagem (se veio do upload), depois cartoucheByImage, depois padrão
    let cartoucheDataForImage = image.cartouche || currentCartoucheByImage[image.id];
    
    if (!cartoucheDataForImage) {
      // Criar dados padrão do cartouche para esta imagem
      const imageIndex = canvasState.uploadedImages.findIndex(img => img.id === image.id);
      const defaultStreetName = imageIndex >= 0 ? getDefaultStreetName(imageIndex) : "";
      cartoucheDataForImage = {
        projectName: getDefaultProjectName(),
        streetOrZone: defaultStreetName,
        option: "base",
        hasCartouche: false
      };
      // Salvar no cartoucheByImage
      currentCartoucheByImage = {
        ...currentCartoucheByImage,
        [image.id]: cartoucheDataForImage
      };
      onInputChange?.('cartoucheByImage', currentCartoucheByImage);
    }
    
    console.log('📂 Dados do cartouche para imagem:', image.id, cartoucheDataForImage);
    
    // Adicionar imagem ao canvas (passar conversionComplete e analysisComplete)
    // O cartouche será carregado dentro de handleImageAddToCanvas no useCanvasState
    canvasState.handleImageAddToCanvas(
      image, 
      useDayMode, 
      imageConversion.conversionComplete, 
      imageConversion.analysisComplete,
      cartoucheDataForImage // Passar dados do cartouche para carregar
    );
    
    // Salvar selectedImageId no simulationState
    const currentSimulationState = formData?.simulationState || {
      uploadStep: canvasState.uploadStep,
      selectedImageId: null,
      isDayMode: canvasState.isDayMode,
      conversionComplete: imageConversion.conversionComplete || {}
    };
      onInputChange?.('simulationState', { ...currentSimulationState, selectedImageId: image.id });
  };

  // Handlers de decoração que também atualizam o mapeamento
  const handleDecorationAdd = (decoration) => {
    decorationManagement.handleDecorationAdd(
      decoration,
      canvasState.decorations,
      canvasState.setDecorations
    );
  };

  const handleDecorationRemove = (decorationId) => {
    decorationManagement.handleDecorationRemove(
      decorationId,
      canvasState.decorations,
      canvasState.setDecorations
    );
  };

  const handleDecorationUpdate = (decorationId, newAttrs) => {
    decorationManagement.handleDecorationUpdate(
      decorationId,
      newAttrs,
      canvasState.decorations,
      canvasState.setDecorations
    );
  };

  // Toggle day/night mode com lógica adicional
  const toggleDayNightMode = () => {
    const newMode = !canvasState.isDayMode;
    
    // Se tentando alternar para modo Night, verificar se há versão night disponível
    if (!newMode && canvasState.selectedImage) {
      const hasNightVersion = canvasState.selectedImage.nightVersion;
      const conversionFailed = canvasState.selectedImage.conversionStatus === 'failed' || 
                                canvasState.selectedImage.conversionStatus === 'unavailable';
      
      // Verificar se não há versão night disponível
      if (!hasNightVersion && conversionFailed) {
        // Mostrar aviso que night não está disponível
        setShowNightUnavailableToast(true);
        setTimeout(() => setShowNightUnavailableToast(false), 4000);
        return; // Não alternar o modo
      }
    }
    
    canvasState.setIsDayMode(newMode);
    
    // Salvar isDayMode no simulationState
    const currentSimulationState = formData?.simulationState || {
      uploadStep: canvasState.uploadStep,
      selectedImageId: canvasState.selectedImage?.id || null,
      isDayMode: newMode,
      conversionComplete: imageConversion.conversionComplete || {}
    };
    onInputChange?.('simulationState', { ...currentSimulationState, isDayMode: newMode });
    
    // Se há uma imagem selecionada, atualizar a imagem no canvas
    if (canvasState.selectedImage && canvasState.canvasImages.length > 0) {
      console.log('🌓 Alternando modo:', newMode ? 'Day' : 'Night');
      // Usar handleImageAddToCanvas do canvasState diretamente para evitar loops
      // Passar dados do cartouche para preservar quando alternar modo
      canvasState.handleImageAddToCanvas(
        canvasState.selectedImage, 
        newMode, 
        imageConversion.conversionComplete, 
        imageConversion.analysisComplete,
        formData?.cartoucheByImage?.[canvasState.selectedImage.id] // Passar dados do cartouche
      );
      
            // Análise YOLO12 removida - não é mais necessária após remoção de zonas
            // Quando a API de conversão dia/noite estiver disponível, a conversão será automática
    }
  };

  // Funções auxiliares para cartouche por imagem
  const getDefaultStreetName = (imageIndex) => {
    // Nomes de ruas francesas comuns
    const frenchStreets = [
      "Mairie",           // Primeira imagem
      "Rue de la République",
      "Avenue des Champs-Élysées",
      "Boulevard Saint-Michel",
      "Rue de Rivoli",
      "Place de la Concorde",
      "Rue du Faubourg Saint-Antoine",
      "Avenue Montaigne",
      "Boulevard Haussmann",
      "Rue de Vaugirard",
      "Place Vendôme",
      "Rue de la Paix",
      "Avenue des Ternes",
      "Boulevard Voltaire",
      "Rue de Belleville"
    ];
    
    // Se for a primeira imagem (índice 0), retorna "Mairie"
    if (imageIndex === 0) {
      return "Mairie";
    }
    
    // Para outras imagens, usa nomes da lista, circulando se necessário
    return frenchStreets[imageIndex % frenchStreets.length] || `Rue ${imageIndex}`;
  };

  // Função pura para obter cartouche (sem side effects)
  const getCartoucheForImage = (imageId) => {
    const cartouche = formData?.cartoucheByImage?.[imageId];
    
    // Se não existe entrada, calcular valores padrão baseados no índice da imagem
    if (!cartouche) {
      const imageIndex = canvasState.uploadedImages.findIndex(img => img.id === imageId);
      const defaultStreetName = imageIndex >= 0 ? getDefaultStreetName(imageIndex) : "";
      
      return {
        streetOrZone: defaultStreetName,
        option: "base"
      };
    }
    
    return {
      streetOrZone: cartouche.streetOrZone !== undefined ? cartouche.streetOrZone : "",
      option: cartouche.option !== undefined ? cartouche.option : "base"
    };
  };

  // Inicializar valores padrão para todas as imagens quando são carregadas
  useEffect(() => {
    if (canvasState.uploadedImages.length > 0) {
      const currentCartoucheByImage = formData?.cartoucheByImage || {};
      let needsUpdate = false;
      const updatedCartoucheByImage = { ...currentCartoucheByImage };

      canvasState.uploadedImages.forEach((image, index) => {
        // Se não existe entrada para esta imagem, criar com valores padrão
        if (!updatedCartoucheByImage[image.id]) {
          const defaultStreetName = getDefaultStreetName(index);
          updatedCartoucheByImage[image.id] = {
            streetOrZone: defaultStreetName,
            option: "base"
          };
          needsUpdate = true;
        }
      });

      // Atualizar apenas se houver mudanças
      if (needsUpdate) {
        onInputChange?.('cartoucheByImage', updatedCartoucheByImage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasState.uploadedImages.map(img => img.id).join(',')]); // Executar quando IDs das imagens mudarem

  const updateCartoucheForImage = (imageId, updates) => {
    const currentCartoucheByImage = formData?.cartoucheByImage || {};
    const current = currentCartoucheByImage[imageId] || getCartoucheForImage(imageId);
    
    const updatedCartoucheByImage = {
      ...currentCartoucheByImage,
      [imageId]: { ...current, ...updates }
    };
    
    onInputChange?.('cartoucheByImage', updatedCartoucheByImage);
  };

  const getDefaultProjectName = () => {
    return formData?.projectName || "Mairie du Soleil";
  };

  const handleProjectNameChange = (value) => {
    const currentProjectName = getDefaultProjectName();
    
    // Atualizar o projectName
    onInputChange?.('projectName', value);
    
    // Se está alterando para um valor diferente do default, 
    // o projectName já é global, então não precisa duplicar
    // O projectName é compartilhado entre todas as imagens
  };

  // Função para aplicar o cartouche como overlay no canvas
  const handleApplyCartouche = () => {
    if (canvasState.canvasImages.length === 0 || !canvasState.selectedImage) {
      console.warn('⚠️ Não há imagem de fundo no canvas ou imagem selecionada');
      return;
    }

    const cartouchePath = '/cartouches/CARTOUCHEpaysage.png';
    
    // Encontrar a imagem de fundo no canvas (primeira imagem que não é cartouche)
    const backgroundImage = canvasState.canvasImages.find(img => !img.isCartouche);
    
    if (!backgroundImage) {
      console.warn('⚠️ Não foi possível encontrar a imagem de fundo');
      return;
    }
    
    // Usar as mesmas dimensões e posição da imagem de fundo para o cartouche
    // O cartouche ficará como uma moldura por cima da imagem
    const cartoucheImage = {
      id: `cartouche-${Date.now()}`,
      type: 'image',
      name: 'Cartouche',
      src: cartouchePath,
      x: backgroundImage.x, // Mesma posição X da imagem de fundo
      y: backgroundImage.y, // Mesma posição Y da imagem de fundo
      width: backgroundImage.width, // Mesma largura da imagem de fundo
      height: backgroundImage.height, // Mesma altura da imagem de fundo
      isCartouche: true // Flag para identificar como cartouche
    };

    // Remover cartouches anteriores (se houver) e adicionar o novo
    const filteredImages = canvasState.canvasImages.filter(img => !img.isCartouche);
    canvasState.setCanvasImages([...filteredImages, cartoucheImage]);
    
    // Salvar que o cartouche foi aplicado para esta imagem
    const currentCartoucheByImage = formData?.cartoucheByImage || {};
    const updatedCartoucheByImage = {
      ...currentCartoucheByImage,
      [canvasState.selectedImage.id]: {
        ...getCartoucheForImage(canvasState.selectedImage.id),
        hasCartouche: true // Flag para indicar que o cartouche foi aplicado
      }
    };
    onInputChange?.('cartoucheByImage', updatedCartoucheByImage);
    
    console.log('✅ Cartouche aplicado ao canvas e salvo para imagem:', canvasState.selectedImage.id, {
      width: backgroundImage.width,
      height: backgroundImage.height,
      x: backgroundImage.x,
      y: backgroundImage.y
    });
    
    // Fechar o modal após aplicar
    setIsLocationModalOpen(false);
  };

  // Atualizar simulationState com conversionComplete quando mudar
  useEffect(() => {
    if (imageConversion.conversionComplete && Object.keys(imageConversion.conversionComplete).length > 0) {
      const currentSimulationState = formData?.simulationState || {
        uploadStep: canvasState.uploadStep,
        selectedImageId: canvasState.selectedImage?.id || null,
        isDayMode: canvasState.isDayMode,
        conversionComplete: {}
      };
      // Só atualizar se realmente mudou
      const currentCompleteStr = JSON.stringify(currentSimulationState.conversionComplete || {});
      const newCompleteStr = JSON.stringify(imageConversion.conversionComplete);
      if (currentCompleteStr !== newCompleteStr) {
        onInputChange?.('simulationState', { ...currentSimulationState, conversionComplete: imageConversion.conversionComplete });
      }
    }
  }, [JSON.stringify(imageConversion.conversionComplete)]);

  // Salvamento automático
  useCanvasPersistence({
    decorations: canvasState.decorations,
    canvasImages: canvasState.canvasImages,
    snapZonesByImage: {}, // Zonas removidas - manter vazio para compatibilidade
    decorationsByImage: decorationManagement.decorationsByImage,
    uploadedImages: canvasState.uploadedImages,
    simulationState: formData?.simulationState || {
      uploadStep: canvasState.uploadStep,
      selectedImageId: canvasState.selectedImage?.id || null,
      isDayMode: canvasState.isDayMode,
      conversionComplete: imageConversion.conversionComplete || {}
    },
    formData,
    onInputChange
  });

  // Carregar decorações do formData no decorationManagement
  useEffect(() => {
    if (formData?.decorationsByImage && Object.keys(formData.decorationsByImage).length > 0) {
      decorationManagement.setDecorationsByImage(formData.decorationsByImage);
    }
  }, [formData?.id]);

  // Restaurar conversionComplete do simulationState quando projeto for carregado
  useEffect(() => {
    if (formData?.simulationState?.conversionComplete && Object.keys(formData.simulationState.conversionComplete).length > 0) {
      // Restaurar conversionComplete no imageConversion
      imageConversion.setConversionComplete(formData.simulationState.conversionComplete);
    }
  }, [formData?.id]); // Executar apenas quando projeto mudar

  // Obter projectId do formData (pode ser id ou tempProjectId)
  const projectId = formData?.id || formData?.tempProjectId;

  return (
    <div className="h-full flex flex-col">
      {canvasState.uploadStep === 'uploading' && (
        <UploadModal 
          onUploadComplete={handleUploadComplete} 
          projectId={projectId}
        />
      )}
      {canvasState.uploadStep === 'loading' && <LoadingIndicator />}
      
      {/* Main Content Area - 3 Column Layout */}
      {canvasState.uploadStep === 'done' && (
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Left Sidebar - Image Thumbnails */}
          <aside className={(isMobile ? 'w-24' : 'w-32') + ' sm:w-32 md:w-40 lg:w-48 border-r border-divider bg-content1/30 flex flex-col flex-shrink-0'}>
            <div className="p-3 md:p-4 border-b border-divider text-center">
              <h3 className="text-base md:text-lg font-semibold">Source Images</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3">
              {canvasState.uploadedImages.map((image, index) => {
                const isConverted = imageConversion.conversionComplete[image.id] === true;
                const isCurrentlyConverting = index === imageConversion.activeGifIndex && imageConversion.activeGifIndex >= 0;
                // Mostrar overlay apenas se não foi convertida E não está sendo convertida agora (a animação já mostra o processo)
                const showOverlay = !isConverted && !isCurrentlyConverting;
                const isDisabled = !isConverted;
                
                return (
                  <div key={image.id} className="relative">
                    <Tooltip
                      content={isDisabled ? "Waiting for night conversion..." : ""}
                      isDisabled={!isDisabled}
                      placement="right"
                    >
                      <Card
                        isFooterBlurred
                        isPressable={!isDisabled}
                        isDisabled={isDisabled}
                        className={
                          isDisabled
                            ? 'border-none transition-all duration-200 cursor-not-allowed opacity-60'
                            : canvasState.selectedImage?.id === image.id 
                              ? 'border-none transition-all duration-200 cursor-pointer ring-2 ring-primary shadow-lg'
                              : 'border-none transition-all duration-200 cursor-pointer hover:ring-1 hover:ring-primary/50'
                        }
                        radius="lg"
                        onPress={() => {
                          if (!isDisabled) {
                            console.log('🖱️ CARD CLICADO - Imagem:', image.name);
                            handleImageAddToCanvas(image);
                          }
                        }}
                        aria-label={'Select source image ' + image.name}
                      >
                        {/* NightThumb com animação de dia para noite - só mostra se API disponível */}
                        {image.nightVersion && (
                          <NightThumb
                            dayImage={image.thumbnail}
                            nightImage={image.nightVersion}
                            filename={image.name}
                            isActive={index === imageConversion.activeGifIndex && 
                                     image.conversionStatus !== 'failed' && 
                                     image.conversionStatus !== 'unavailable'}
                            duration={4000}
                          />
                        )}
                        
                        {/* Overlay de loading/bloqueio durante conversão - apenas quando não está sendo convertida agora */}
                        {showOverlay && (
                          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
                            <Spinner size="md" color="primary" />
                            <p className="text-white text-xs mt-2 font-medium">Converting...</p>
                          </div>
                        )}
                        
                        <Image
                          alt={image.name}
                          className="object-cover"
                          height={120}
                          src={mapImagePath(image.thumbnail)}
                          width="100%"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling && e.target.nextSibling.style) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="w-full h-full hidden items-center justify-center bg-default-100">
                          <Icon icon="lucide:image" className="text-4xl text-default-400" />
                        </div>
                        
                        <CardFooter className="absolute bg-black/40 bottom-0 z-10 py-1 pointer-events-none">
                          <div className="flex grow gap-2 items-center">
                            <p className="text-tiny text-white/80 truncate">{image.name}</p>
                          </div>
                          {canvasState.selectedImage?.id === image.id && (
                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <Icon icon="lucide:check" className="text-white text-xs" />
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    </Tooltip>
                  
                          {/* Análise YOLO12 removida - não é mais necessária após remoção de zonas */}
                  </div>
                );
              })}

              {/* Botão para adicionar mais imagens */}
              <Card
                isFooterBlurred
                isPressable={true}
                className="w-full cursor-pointer border-none transition-all duration-200 hover:ring-1 hover:ring-primary/50"
                radius="lg"
                onPress={() => {
                  // Voltar para o estado de upload para permitir adicionar mais imagens
                  canvasState.setUploadStep('uploading');
                }}
                aria-label="Add more images"
              >
                <div className="w-full h-[120px] flex items-center justify-center bg-gradient-to-br from-default-100 to-default-200 rounded-lg relative overflow-hidden">
                  <div className="flex flex-col items-center gap-2 text-default-500 relative z-10">
                    <Icon icon="lucide:plus-circle" className="text-3xl opacity-80" />
                    <span className="text-sm font-medium text-center leading-tight">Add more images</span>
                  </div>
                </div>
                <CardFooter className="absolute bg-black/40 bottom-0 z-10 py-1 pointer-events-none">
                  <div className="flex grow gap-2 items-center">
                    <Icon icon="lucide:upload" className="text-tiny text-primary-400" />
                    <p className="text-tiny text-white/80 truncate">Upload or camera</p>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </aside>

          {/* Center Canvas Area */}
          <div className="flex-1 min-h-0 flex flex-col bg-content1">
            <div className="h-full flex flex-col p-3 md:p-4 lg:p-6">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-semibold text-center flex-1">Decoration Canvas</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    color={canvasState.isDayMode ? "warning" : "primary"}
                    startContent={
                      <Icon 
                        icon={canvasState.isDayMode ? "lucide:sun" : "lucide:moon"} 
                        className={canvasState.isDayMode ? "text-warning" : "text-primary"}
                      />
                    }
                    onPress={toggleDayNightMode}
                    isDisabled={
                      canvasState.canvasImages.length === 0 || 
                      (canvasState.selectedImage && !imageConversion.conversionComplete[canvasState.selectedImage.id] && 
                       canvasState.selectedImage.conversionStatus !== 'failed' && 
                       canvasState.selectedImage.conversionStatus !== 'unavailable')
                    }
                    title={
                      canvasState.selectedImage && !imageConversion.conversionComplete[canvasState.selectedImage.id]
                        ? "Waiting for night conversion..."
                        : canvasState.selectedImage && 
                          !canvasState.selectedImage.nightVersion && 
                          (canvasState.selectedImage.conversionStatus === 'failed' || canvasState.selectedImage.conversionStatus === 'unavailable')
                        ? "Conversão dia/noite não disponível"
                        : undefined
                    }
                    aria-label={canvasState.isDayMode ? "Switch to night mode" : "Switch to day mode"}
                  >
                    {canvasState.isDayMode ? 'Day' : 'Night'}
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="default"
                    startContent={<Icon icon="lucide:map-pin" className="text-default-500" />}
                    onPress={() => setIsLocationModalOpen(true)}
                    isDisabled={!canvasState.selectedImage || canvasState.canvasImages.length === 0}
                    title={!canvasState.selectedImage ? "Select an image first" : undefined}
                    aria-label="Open cartouche information"
                  >
                    Cartouche
                  </Button>
                  <Button
                    size="sm"
                    variant="light"
                    startContent={<Icon icon="lucide:refresh-cw" />}
                    onPress={() => {
                      // Limpar tudo, incluindo o mapeamento de decorações por imagem
                      canvasState.setDecorations([]);
                      decorationManagement.setDecorationsByImage({});
                      canvasState.setCanvasImages([]);
                      canvasState.setSelectedImage(null);
                    }}
                    isDisabled={canvasState.decorations.length === 0 && canvasState.canvasImages.length === 0}
                    aria-label="Clear all decorations and images"
                  >
                    Clear All
                  </Button>
                  {/* Botão para abrir drawer de decorações (apenas em mobile/tablet) */}
                  {shouldUseDrawer && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      startContent={<Icon icon="lucide:package" />}
                      onPress={() => setIsDecorationDrawerOpen(true)}
                      aria-label="Open decorations library"
                    >
                      Decorations
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-h-0">
                {canvasState.noBgWarning && (
                  <div className="mb-2 p-2 rounded-md bg-warning-50 border border-warning-200 text-warning-700 text-sm">
                    ⚠️ Select a background image to add PNGs
                  </div>
                )}
                <KonvaCanvas
                  width="100%"
                  height="100%"
                  onDecorationAdd={handleDecorationAdd}
                  onDecorationRemove={handleDecorationRemove}
                  onDecorationUpdate={handleDecorationUpdate}
                  onImageRemove={canvasState.handleImageRemoveFromCanvas}
                  decorations={canvasState.decorations}
                  canvasImages={canvasState.canvasImages}
                  selectedImage={canvasState.selectedImage}
                  snapZones={[]} // Zonas removidas
                  isDayMode={canvasState.isDayMode}
                  isEditingZones={false} // Zonas removidas
                  analysisComplete={imageConversion.analysisComplete}
                  showSnapZones={false} // Zonas removidas
                  cartoucheInfo={
                    canvasState.selectedImage && canvasState.canvasImages.some(img => img.isCartouche)
                      ? {
                          projectName: getDefaultProjectName(),
                          streetOrZone: getCartoucheForImage(canvasState.selectedImage.id).streetOrZone,
                          option: getCartoucheForImage(canvasState.selectedImage.id).option
                        }
                      : null
                  }
                  onRequireBackground={() => {
                    canvasState.setNoBgWarning(true);
                    setTimeout(() => canvasState.setNoBgWarning(false), 2000);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar - Decoration Library (desktop) ou Drawer (mobile/tablet landscape) */}
          {!shouldUseDrawer ? (
            <DecorationLibrary
              mode="sidebar"
              isDayMode={canvasState.isDayMode}
              disabled={canvasState.canvasImages.length === 0}
              onDecorationSelect={(decoration) => {
                // ⚠️ VERIFICAR SE HÁ IMAGEM DE FUNDO antes de adicionar decoração
                if (canvasState.canvasImages.length === 0) {
                  console.warn('⚠️ Adicione primeiro uma imagem de fundo!');
                  canvasState.setNoBgWarning(true);
                  setTimeout(() => canvasState.setNoBgWarning(false), 2000);
                  return;
                }
                
                // Usar dimensões virtuais do canvas (sempre 1200x600)
                const { centerX, centerY } = getCenterPosition(1200, 600);
                
                // Criar nova decoração para o canvas na posição central
                const newDecoration = {
                  id: 'dec-' + Date.now(), // ID único com prefixo
                  type: decoration.imageUrl ? 'image' : decoration.type, // Se tem imageUrl, tipo = image
                  name: decoration.name,
                  icon: decoration.icon,
                  // Guardar URLs para alternância futura
                  dayUrl: decoration.imageUrlDay || decoration.thumbnailUrl || decoration.imageUrl || undefined,
                  nightUrl: decoration.imageUrlNight || undefined,
                  src: decoration.imageUrl || undefined, // URL já resolvida pelo modo atual
                  x: centerX,
                  y: centerY,
                  width: decoration.imageUrl ? 200 : 120, // 2x maior: 100->200, 60->120
                  height: decoration.imageUrl ? 200 : 120, // 2x maior: 100->200, 60->120
                  rotation: 0, // Rotação inicial
                  color: getDecorationColor(decoration.type)
                };
                handleDecorationAdd(newDecoration);
              }}
              enableSearch={true}
              className="w-64 md:w-72 lg:w-80"
            />
          ) : (
            <>
              {/* Drawer Overlay */}
              {isDecorationDrawerOpen && (
                <div 
                  className="fixed inset-0 bg-black/50 z-40"
                  onClick={() => setIsDecorationDrawerOpen(false)}
                />
              )}
              
              {/* Drawer */}
              <div
                className={
                  'fixed top-0 right-0 h-full w-80 md:w-96 bg-content1 border-l border-divider z-50 transform transition-transform duration-300 ease-in-out ' +
                  (isDecorationDrawerOpen ? 'translate-x-0' : 'translate-x-full')
                }
              >
                <div className="h-full flex flex-col">
                  {/* Drawer Header */}
                  <div className="p-4 border-b border-divider flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Decorations</h3>
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      onPress={() => setIsDecorationDrawerOpen(false)}
                      aria-label="Close drawer"
                    >
                      <Icon icon="lucide:x" />
                    </Button>
                  </div>
                  
                  {/* Drawer Content */}
                  <div className="flex-1 overflow-hidden">
                    <DecorationLibrary
                      mode="drawer"
                      isDayMode={canvasState.isDayMode}
                      disabled={canvasState.canvasImages.length === 0}
                      onDecorationSelect={(decoration) => {
                        // ⚠️ VERIFICAR SE HÁ IMAGEM DE FUNDO antes de adicionar decoração
                        if (canvasState.canvasImages.length === 0) {
                          console.warn('⚠️ Please add a background image first!');
                          canvasState.setNoBgWarning(true);
                          setTimeout(() => canvasState.setNoBgWarning(false), 2000);
                          return;
                        }
                        
                        // Usar dimensões virtuais do canvas (sempre 1200x600)
                        const { centerX, centerY } = getCenterPosition(1200, 600);
                        
                        // Criar nova decoração para o canvas na posição central
                        const newDecoration = {
                          id: 'dec-' + Date.now(), // ID único com prefixo
                          type: decoration.imageUrl ? 'image' : decoration.type, // Se tem imageUrl, tipo = image
                          name: decoration.name,
                          icon: decoration.icon,
                          // Guardar URLs para alternância futura
                          dayUrl: decoration.imageUrlDay || decoration.thumbnailUrl || decoration.imageUrl || undefined,
                          nightUrl: decoration.imageUrlNight || undefined,
                          src: decoration.imageUrl || undefined, // URL já resolvida pelo modo atual
                          x: centerX,
                          y: centerY,
                          width: decoration.imageUrl ? 200 : 120, // 2x maior: 100->200, 60->120
                          height: decoration.imageUrl ? 200 : 120, // 2x maior: 100->200, 60->120
                          rotation: 0, // Rotação inicial
                          color: getDecorationColor(decoration.type)
                        };
                        handleDecorationAdd(newDecoration);
                      }}
                      enableSearch={true}
                      className="h-full"
                    />
                  </div>
                </div>
              </div>
              
            </>
          )}
        </div>
      )}
      
      {/* Location Information Modal */}
      <Modal 
        isOpen={isLocationModalOpen && canvasState.selectedImage !== null} 
        onClose={() => setIsLocationModalOpen(false)}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Cartouche Information</h3>
            <p className="text-sm text-default-500">Enter project name, street or zone, and option</p>
          </ModalHeader>
          <ModalBody>
            {canvasState.selectedImage && (
              <StreetNameInput
                projectName={getDefaultProjectName()}
                streetOrZone={getCartoucheForImage(canvasState.selectedImage.id).streetOrZone}
                option={getCartoucheForImage(canvasState.selectedImage.id).option}
                onProjectNameChange={handleProjectNameChange}
                onStreetOrZoneChange={(value) => {
                  updateCartoucheForImage(canvasState.selectedImage.id, { streetOrZone: value });
                }}
                onOptionChange={(value) => {
                  updateCartoucheForImage(canvasState.selectedImage.id, { option: value });
                }}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="light"
              onPress={() => setIsLocationModalOpen(false)}
            >
              Close
            </Button>
            <Button 
              color="primary" 
              onPress={handleApplyCartouche}
              isDisabled={canvasState.canvasImages.length === 0}
              startContent={<Icon icon="lucide:check" />}
            >
              Apply
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Toast para avisar que night não está disponível */}
      <AnimatePresence>
        {showNightUnavailableToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 right-4 z-50 max-w-sm"
          >
            <div className="p-4 rounded-lg shadow-lg border bg-warning-50 border-warning-200 text-warning-800">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:alert-circle" className="text-lg flex-shrink-0" />
                <span className="text-sm font-medium">Night version is not available</span>
                <button
                  onClick={() => setShowNightUnavailableToast(false)}
                  className="ml-auto text-current opacity-60 hover:opacity-100 flex-shrink-0"
                  aria-label="Close notification"
                >
                  <Icon icon="lucide:x" className="text-sm" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

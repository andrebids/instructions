import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { DecorationLibrary } from "../../decoration-library";
import { UploadModal } from '../components/UploadModal';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { KonvaCanvas } from '../components/konva/KonvaCanvas';
import { CartoucheModal } from '../components/CartoucheModal';
import { ImageThumbnailList } from '../components/ImageThumbnailList';
import { DecorationDrawer } from '../components/DecorationDrawer';
import { CanvasControls } from '../components/CanvasControls';
import { useCanvasState } from '../hooks/useCanvasState';
import { useImageConversion } from '../hooks/useImageConversion';
import { useDecorationManagement } from '../hooks/useDecorationManagement';
import { useCanvasPersistence } from '../hooks/useCanvasPersistence';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useCartoucheManagement } from '../hooks/useCartoucheManagement';
import { useDecorationOrders } from '../hooks/useDecorationOrders';
import { getDefaultStreetName } from '../utils/cartoucheUtils';
import { getDecorationColor } from '../utils/decorationUtils';
import { getCenterPosition } from '../utils/canvasCalculations';
import {
  preloadImageSize,
  computeInitialSizeFromImageDims,
  offsetIfColliding,
  BASE_DECORATION_SIZE
} from '../utils/decorationPlacement';

export const StepAIDesigner = ({ formData, onInputChange, selectedImage: externalSelectedImage }) => {
  // Ref para o canvas (para exportar imagem)
  const canvasRef = useRef(null);
  // Rastrear última conversão restaurada para evitar loops de setState
  const lastRestoredConversionStrRef = useRef(null);
  
  // Estados locais
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isDecorationDrawerOpen, setIsDecorationDrawerOpen] = useState(false);
  const [showNightUnavailableToast, setShowNightUnavailableToast] = useState(false);
  
  // Hook para detectar responsividade
  const { shouldUseDrawer, isMobile } = useResponsiveLayout();
  
  // Hooks customizados
  const canvasState = useCanvasState({ 
    formData, 
    onInputChange,
    conversionComplete: {},
    analysisComplete: {}
  });
  
  const imageConversion = useImageConversion({ 
    uploadedImages: canvasState.uploadedImages,
    projectId: formData?.id || formData?.tempProjectId 
  });
  
  const decorationManagement = useDecorationManagement({ 
    selectedImage: canvasState.selectedImage 
  });

  const cartoucheManagement = useCartoucheManagement({
    formData,
    onInputChange,
    uploadedImages: canvasState.uploadedImages
  });

  // Hook para sincronizar decorações com orders do projeto
  const decorationOrders = useDecorationOrders({
    decorations: canvasState.decorations,
    decorationsByImage: decorationManagement.decorationsByImage,
    projectId: formData?.id || null, // Só sincroniza se projeto já existir
    selectedImage: canvasState.selectedImage,
    enabled: !!formData?.id, // Habilitar apenas se projeto já foi salvo
  });

  // Handler para upload completo
  const handleUploadComplete = (uploadedImages = null) => {
    canvasState.setUploadStep('loading');
    
    const mappedIncoming = uploadedImages && uploadedImages.length > 0 
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
      : canvasState.loadedImages;

    // Mesclar novas imagens com as já existentes, preservando e deduplicando por id
    const mergedImages = (() => {
      const mergedMap = new Map();
      (canvasState.uploadedImages || []).forEach((img) => mergedMap.set(img.id, img));
      (mappedIncoming || []).forEach((img) => mergedMap.set(img.id, img));
      return Array.from(mergedMap.values());
    })();
    
    setTimeout(() => {
      canvasState.setUploadedImages(mergedImages);
      canvasState.setUploadStep('done');
      
      onInputChange?.('uploadedImages', mergedImages);
      const currentSimulationState = formData?.simulationState || {
        uploadStep: 'done',
        selectedImageId: null,
        isDayMode: canvasState.isDayMode,
        conversionComplete: {}
      };
      onInputChange?.('simulationState', { ...currentSimulationState, uploadStep: 'done' });
      
      const savedConversionComplete = formData?.simulationState?.conversionComplete || {};
      const hasSavedConversions = Object.keys(savedConversionComplete).length > 0;
      
      if (hasSavedConversions) {
        imageConversion.setConversionComplete(savedConversionComplete);
      } else {
        imageConversion.handleUploadComplete(mergedImages);
      }
    }, 300);
  };

  // Wrapper para handleImageAddToCanvas que também salva decorações e cartouche
  const handleImageAddToCanvas = (image, useDayMode = null) => {
    let currentCartoucheByImage = formData?.cartoucheByImage || {};
    
    // Guardar decorações da imagem anterior antes de trocar
    if (canvasState.selectedImage && canvasState.selectedImage.id !== image.id) {
      decorationManagement.saveDecorationsForImage(canvasState.selectedImage.id, canvasState.decorations);
      
      const hasCartouche = canvasState.canvasImages.some(img => img.isCartouche);
      const previousCartouche = cartoucheManagement.getCartoucheForImage(canvasState.selectedImage.id);
      currentCartoucheByImage = {
        ...currentCartoucheByImage,
        [canvasState.selectedImage.id]: {
          projectName: cartoucheManagement.getDefaultProjectName(),
          streetOrZone: previousCartouche.streetOrZone,
          option: previousCartouche.option,
          hasCartouche: hasCartouche
        }
      };
      onInputChange?.('cartoucheByImage', currentCartoucheByImage);
    }
    
    // Carregar decorações da nova imagem
    const newImageDecorations = decorationManagement.loadDecorationsForImage(image.id);
    canvasState.setDecorations(newImageDecorations);
    
    // Obter dados do cartouche para a nova imagem
    let cartoucheDataForImage = image.cartouche || currentCartoucheByImage[image.id];
    
    if (!cartoucheDataForImage) {
      const imageIndex = canvasState.uploadedImages.findIndex(img => img.id === image.id);
      const defaultStreetName = imageIndex >= 0 
        ? getDefaultStreetName(imageIndex) 
        : "";
      cartoucheDataForImage = {
        projectName: cartoucheManagement.getDefaultProjectName(),
        streetOrZone: defaultStreetName,
        option: "base",
        hasCartouche: false
      };
      currentCartoucheByImage = {
        ...currentCartoucheByImage,
        [image.id]: cartoucheDataForImage
      };
      onInputChange?.('cartoucheByImage', currentCartoucheByImage);
    }
    
    canvasState.handleImageAddToCanvas(
      image, 
      useDayMode, 
      imageConversion.conversionComplete, 
      imageConversion.analysisComplete,
      cartoucheDataForImage
    );
    
    const currentSimulationState = formData?.simulationState || {
      uploadStep: canvasState.uploadStep,
      selectedImageId: null,
      isDayMode: canvasState.isDayMode,
      conversionComplete: imageConversion.conversionComplete || {}
    };
    onInputChange?.('simulationState', { ...currentSimulationState, selectedImageId: image.id });
  };

  // Handlers de decoração
  const handleDecorationAdd = (decoration) => {
    console.log('[StepAIDesigner] handleDecorationAdd', { id: decoration.id, type: decoration.type, src: decoration.src });
    decorationManagement.handleDecorationAdd(
      decoration,
      canvasState.decorations,
      canvasState.setDecorations
    );
  };

  const handleDecorationRemove = (decorationId) => {
    console.log('[StepAIDesigner] handleDecorationRemove', { id: decorationId });
    decorationManagement.handleDecorationRemove(
      decorationId,
      canvasState.decorations,
      canvasState.setDecorations
    );
  };

  const handleDecorationUpdate = (decorationId, newAttrs) => {
    console.log('[StepAIDesigner] handleDecorationUpdate', { id: decorationId, newAttrs });
    decorationManagement.handleDecorationUpdate(
      decorationId,
      newAttrs,
      canvasState.decorations,
      canvasState.setDecorations
    );
  };

  // Toggle day/night mode
  const toggleDayNightMode = () => {
    const newMode = !canvasState.isDayMode;
    
    if (!newMode && canvasState.selectedImage) {
      const hasNightVersion = canvasState.selectedImage.nightVersion;
      const conversionFailed = canvasState.selectedImage.conversionStatus === 'failed' || 
                                canvasState.selectedImage.conversionStatus === 'unavailable';
      
      if (!hasNightVersion && conversionFailed) {
        setShowNightUnavailableToast(true);
        setTimeout(() => setShowNightUnavailableToast(false), 4000);
        return;
      }
    }
    
    canvasState.setIsDayMode(newMode);
    
    const currentSimulationState = formData?.simulationState || {
      uploadStep: canvasState.uploadStep,
      selectedImageId: canvasState.selectedImage?.id || null,
      isDayMode: newMode,
      conversionComplete: imageConversion.conversionComplete || {}
    };
    onInputChange?.('simulationState', { ...currentSimulationState, isDayMode: newMode });
    
    if (canvasState.selectedImage && canvasState.canvasImages.length > 0) {
      canvasState.handleImageAddToCanvas(
        canvasState.selectedImage, 
        newMode, 
        imageConversion.conversionComplete, 
        imageConversion.analysisComplete,
        canvasState.selectedImage?.id ? formData?.cartoucheByImage?.[canvasState.selectedImage.id] : null
      );
    }
  };

  // Handler para aplicar cartouche
  const handleApplyCartouche = () => {
    cartoucheManagement.applyCartouche(
      canvasState.canvasImages,
      canvasState.selectedImage,
      canvasState.setCanvasImages,
      setIsLocationModalOpen
    );
  };

  // Atualizar simulationState com conversionComplete quando mudar
  // Usar useMemo para serializar conversionComplete de forma estável
  const conversionCompleteStr = React.useMemo(() => {
    return JSON.stringify(imageConversion.conversionComplete || {});
  }, [imageConversion.conversionComplete]);

  useEffect(() => {
    if (imageConversion.conversionComplete && Object.keys(imageConversion.conversionComplete).length > 0) {
      const currentSimulationState = formData?.simulationState || {
        uploadStep: canvasState.uploadStep,
        selectedImageId: canvasState.selectedImage?.id || null,
        isDayMode: canvasState.isDayMode,
        conversionComplete: {}
      };
      const currentCompleteStr = JSON.stringify(currentSimulationState.conversionComplete || {});
      if (currentCompleteStr !== conversionCompleteStr) {
        onInputChange?.('simulationState', { ...currentSimulationState, conversionComplete: imageConversion.conversionComplete });
      }
    }
  }, [conversionCompleteStr, canvasState.uploadStep, canvasState.selectedImage?.id, canvasState.isDayMode, formData?.simulationState, imageConversion.conversionComplete, onInputChange]);

  // Salvamento automático
  // Função para exportar imagem do canvas
  const getExportImage = useCallback(() => {
    if (canvasRef.current && canvasRef.current.exportImage) {
      return canvasRef.current.exportImage({ pixelRatio: 1.5 });
    }
    return null;
  }, []);

  useCanvasPersistence({
    decorations: canvasState.decorations,
    canvasImages: canvasState.canvasImages,
    snapZonesByImage: {},
    decorationsByImage: decorationManagement.decorationsByImage,
    uploadedImages: canvasState.uploadedImages,
    simulationState: formData?.simulationState || {
      uploadStep: canvasState.uploadStep,
      selectedImageId: canvasState.selectedImage?.id || null,
      isDayMode: canvasState.isDayMode,
      conversionComplete: imageConversion.conversionComplete || {}
    },
    formData,
    onInputChange,
    getExportImage
  });

  // Carregar decorações do formData
  useEffect(() => {
    if (formData?.decorationsByImage && Object.keys(formData.decorationsByImage).length > 0) {
      decorationManagement.setDecorationsByImage(formData.decorationsByImage);
    }
  }, [formData?.id, formData?.decorationsByImage, decorationManagement]);

  // Restaurar conversionComplete do simulationState
  useEffect(() => {
    const savedConversionComplete = formData?.simulationState?.conversionComplete;
    if (!savedConversionComplete || Object.keys(savedConversionComplete).length === 0) {
      return;
    }

    const savedStr = JSON.stringify(savedConversionComplete);
    if (lastRestoredConversionStrRef.current === savedStr) {
      return; // Já aplicado, evitar setState em loop
    }

    lastRestoredConversionStrRef.current = savedStr;
    imageConversion.setConversionComplete(savedConversionComplete);
  }, [formData?.id, formData?.simulationState?.conversionComplete, imageConversion.setConversionComplete]);

  const projectId = formData?.id || formData?.tempProjectId;

  const cartoucheData = canvasState.selectedImage 
    ? cartoucheManagement.getCartoucheForImage(canvasState.selectedImage.id)
    : null;

  return (
    <div className="h-full flex flex-col">
      {canvasState.uploadStep === 'uploading' && (
        <UploadModal 
          onUploadComplete={handleUploadComplete} 
          projectId={projectId}
          onRequestClose={() => canvasState.setUploadStep('done')}
        />
      )}
      {canvasState.uploadStep === 'loading' && <LoadingIndicator />}
      
      {/* Main Content Area */}
      {canvasState.uploadStep === 'done' && (
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Left Sidebar - Image Thumbnails */}
          <ImageThumbnailList
            uploadedImages={canvasState.uploadedImages}
            selectedImage={canvasState.selectedImage}
            onImageSelect={handleImageAddToCanvas}
            onImageRemove={canvasState.handleImageRemove}
            conversionComplete={imageConversion.conversionComplete}
            activeGifIndex={imageConversion.activeGifIndex}
            onAddMore={() => canvasState.setUploadStep('uploading')}
            isMobile={isMobile}
          />

          {/* Center Canvas Area */}
          <div className="flex-1 min-h-0 flex flex-col bg-content1">
            <div className="h-full flex flex-col p-3 md:p-4 lg:p-6">
              <CanvasControls
                isDayMode={canvasState.isDayMode}
                onToggleDayNight={toggleDayNightMode}
                canToggleDayNight={
                  canvasState.canvasImages.length > 0 && 
                  (canvasState.selectedImage 
                    ? imageConversion.conversionComplete[canvasState.selectedImage.id] || 
                      canvasState.selectedImage.conversionStatus === 'failed' || 
                      canvasState.selectedImage.conversionStatus === 'unavailable'
                    : true)
                }
                onOpenCartouche={() => setIsLocationModalOpen(true)}
                canOpenCartouche={!!canvasState.selectedImage && canvasState.canvasImages.length > 0}
                onClearAll={() => {
                  canvasState.setDecorations([]);
                  decorationManagement.setDecorationsByImage({});
                  canvasState.setCanvasImages([]);
                  canvasState.setSelectedImage(null);
                }}
                canClearAll={canvasState.decorations.length > 0 || canvasState.canvasImages.length > 0}
                onOpenDecorations={() => setIsDecorationDrawerOpen(true)}
                shouldUseDrawer={shouldUseDrawer}
              />
              
              <div className="flex-1 min-h-0">
                {canvasState.noBgWarning && (
                  <div className="mb-2 p-2 rounded-md bg-warning-50 border border-warning-200 text-warning-700 text-sm">
                    ⚠️ Select a background image to add PNGs
                  </div>
                )}
                <KonvaCanvas
                  ref={canvasRef}
                  width="100%"
                  height="100%"
                onEmptyCanvasClick={() => {
                  if ((canvasState.uploadedImages || []).length === 0) {
                    canvasState.setUploadStep('uploading');
                  }
                }}
                  onDecorationAdd={handleDecorationAdd}
                  onDecorationRemove={handleDecorationRemove}
                  onDecorationUpdate={handleDecorationUpdate}
                  onImageRemove={canvasState.handleImageRemoveFromCanvas}
                  decorations={canvasState.decorations}
                  canvasImages={canvasState.canvasImages}
                  selectedImage={canvasState.selectedImage}
                  snapZones={[]}
                  isDayMode={canvasState.isDayMode}
                  isEditingZones={false}
                  analysisComplete={imageConversion.analysisComplete}
                  showSnapZones={false}
                  cartoucheInfo={
                    canvasState.selectedImage && canvasState.canvasImages.some(img => img.isCartouche)
                      ? {
                          projectName: cartoucheManagement.getDefaultProjectName(),
                          streetOrZone: cartoucheData?.streetOrZone || "",
                          option: cartoucheData?.option || "base"
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

          {/* Right Sidebar - Decoration Library (desktop) ou Drawer (mobile/tablet) */}
          {!shouldUseDrawer ? (
            <DecorationLibrary
              mode="sidebar"
              isDayMode={canvasState.isDayMode}
              disabled={canvasState.canvasImages.length === 0}
              onDecorationSelect={async (decoration) => {
                if (canvasState.canvasImages.length === 0) {
                  canvasState.setNoBgWarning(true);
                  setTimeout(() => canvasState.setNoBgWarning(false), 2000);
                  return;
                }
                
                const { centerX, centerY } = getCenterPosition(1200, 600);

                const preferredSrc =
                  decoration.imageUrl ||
                  decoration.imageUrlDay ||
                  decoration.imageUrlNight ||
                  decoration.thumbnailUrl ||
                  null;

                const addStart = performance.now?.() || Date.now();
                console.log('[StepAIDesigner] onDecorationSelect start', {
                  id: decoration.id,
                  preferredSrc,
                  hasDay: !!decoration.imageUrlDay,
                  hasNight: !!decoration.imageUrlNight,
                  hasThumb: !!decoration.thumbnailUrl
                });

                // Dimensão inicial baseada na imagem real (quando disponível)
                let initialSize = {
                  width: preferredSrc ? BASE_DECORATION_SIZE : 120,
                  height: preferredSrc ? BASE_DECORATION_SIZE : 120
                };

                if (preferredSrc) {
                  const preloadStart = performance.now?.() || Date.now();
                  const dims = await preloadImageSize(preferredSrc);
                  console.log('[StepAIDesigner] preloadImageSize', {
                    src: preferredSrc,
                    dims,
                    durationMs: (performance.now?.() || Date.now()) - preloadStart
                  });
                  initialSize = computeInitialSizeFromImageDims(dims, BASE_DECORATION_SIZE);
                }

                const adjustedPos = offsetIfColliding(
                  canvasState.decorations,
                  centerX,
                  centerY,
                  10,
                  8
                );

                const newDecoration = {
                  id: 'dec-' + Date.now(),
                  decorationId: decoration.id, // ID da decoração na BD (para orders)
                  type: preferredSrc ? 'image' : decoration.type,
                  name: decoration.name,
                  icon: decoration.icon,
                  price: decoration.price || 0, // Preço para orders
                  dayUrl: decoration.imageUrlDay || decoration.thumbnailUrl || decoration.imageUrl || undefined,
                  nightUrl: decoration.imageUrlNight || undefined,
                  src: preferredSrc || undefined,
                  x: adjustedPos.x,
                  y: adjustedPos.y,
                  width: initialSize.width,
                  height: initialSize.height,
                  rotation: 0,
                  color: getDecorationColor(decoration.type)
                };
                handleDecorationAdd(newDecoration);
                console.log('[StepAIDesigner] onDecorationSelect done in ms', (performance.now?.() || Date.now()) - addStart);
              }}
              enableSearch={true}
              className="w-64 md:w-72 lg:w-80"
            />
          ) : (
            <DecorationDrawer
              isOpen={isDecorationDrawerOpen}
              onClose={() => setIsDecorationDrawerOpen(false)}
              isDayMode={canvasState.isDayMode}
              disabled={canvasState.canvasImages.length === 0}
              onDecorationSelect={handleDecorationAdd}
              onRequireBackground={() => {
                canvasState.setNoBgWarning(true);
                setTimeout(() => canvasState.setNoBgWarning(false), 2000);
              }}
            />
          )}
        </div>
      )}
      
      {/* Cartouche Modal */}
      <CartoucheModal
        isOpen={isLocationModalOpen && canvasState.selectedImage !== null}
        onClose={() => setIsLocationModalOpen(false)}
        cartoucheData={{
          projectName: cartoucheManagement.getDefaultProjectName(),
          streetOrZone: cartoucheData?.streetOrZone || "",
          option: cartoucheData?.option || "base"
        }}
        onProjectNameChange={cartoucheManagement.handleProjectNameChange}
        onStreetOrZoneChange={(value) => {
          if (canvasState.selectedImage?.id) {
            cartoucheManagement.updateCartoucheForImage(canvasState.selectedImage.id, { streetOrZone: value });
          }
        }}
        onOptionChange={(value) => {
          if (canvasState.selectedImage?.id) {
            cartoucheManagement.updateCartoucheForImage(canvasState.selectedImage.id, { option: value });
          }
        }}
        onApply={handleApplyCartouche}
        canApply={canvasState.canvasImages.length > 0}
      />

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

import React, { useState, useEffect } from "react";
import { Card, CardFooter, Button, Spinner, Progress, Image, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { DecorationLibrary } from "../../decoration-library";
import { NightThumb } from '../../NightThumb';
import { YOLO12ThumbnailOverlay } from './YOLO12ThumbnailOverlay';
import { UnifiedSnapZonesPanel } from './UnifiedSnapZonesPanel';
import { UploadModal } from '../components/UploadModal';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { KonvaCanvas } from '../components/konva/KonvaCanvas';
import { useCanvasState } from '../hooks/useCanvasState';
import { useSnapZones } from '../hooks/useSnapZones';
import { useImageConversion } from '../hooks/useImageConversion';
import { useDecorationManagement } from '../hooks/useDecorationManagement';
import { useCanvasPersistence } from '../hooks/useCanvasPersistence';
import { getDecorationColor } from '../utils/decorationUtils';
import { getCenterPosition } from '../utils/canvasCalculations';

export const StepAIDesigner = ({ formData, onInputChange, selectedImage: externalSelectedImage }) => {
  // Estados locais adicionais (não extraídos para hooks)
  const [showUnifiedPanel, setShowUnifiedPanel] = useState(false); // Painel unificado oculto por padrão
  const [zonesWarning, setZonesWarning] = useState(false); // Estado para mostrar aviso sobre zonas

  // Usar hooks customizados - ordem importa para dependências
  const canvasState = useCanvasState({ 
    formData, 
    onInputChange,
    conversionComplete: {}, // Será atualizado depois
    analysisComplete: {} // Será atualizado depois
  });
  
  const imageConversion = useImageConversion({ uploadedImages: canvasState.uploadedImages });
  
  const snapZones = useSnapZones({ 
    selectedImage: canvasState.selectedImage, 
    isDayMode: canvasState.isDayMode, 
    formData, 
    onInputChange,
    analysisComplete: imageConversion.analysisComplete
  });
  
  const decorationManagement = useDecorationManagement({ 
    selectedImage: canvasState.selectedImage 
  });

  // Handler para upload completo - atualizar uploadedImages e iniciar conversão
  const handleUploadComplete = () => {
    // Mudar para 'loading' antes de mostrar imagens
    canvasState.setUploadStep('loading');
    
    // Após um breve delay, popular uploadedImages e mostrar interface
    setTimeout(() => {
      canvasState.setUploadedImages(canvasState.loadedImages);
      canvasState.setUploadStep('done');
      
      // Iniciar conversão automática sequencial após upload usando imageConversion
      imageConversion.handleUploadComplete();
    }, 300);
  };

  // Wrapper para handleImageAddToCanvas que também salva decorações
  const handleImageAddToCanvas = (image, useDayMode = null) => {
    // Guardar decorações da imagem anterior antes de trocar
    if (canvasState.selectedImage && canvasState.selectedImage.id !== image.id) {
      console.log('💾 Guardando decorações da imagem anterior:', canvasState.selectedImage.id, canvasState.decorations.length, 'decorações');
      decorationManagement.saveDecorationsForImage(canvasState.selectedImage.id, canvasState.decorations);
    }
    
    // Carregar decorações da nova imagem do mapeamento
    const newImageDecorations = decorationManagement.loadDecorationsForImage(image.id);
    console.log('📂 Carregando decorações da imagem:', image.id, newImageDecorations.length, 'decorações');
    canvasState.setDecorations(newImageDecorations);
    
    // Adicionar imagem ao canvas (passar conversionComplete e analysisComplete)
    canvasState.handleImageAddToCanvas(image, useDayMode, imageConversion.conversionComplete, imageConversion.analysisComplete);
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
    canvasState.setIsDayMode(newMode);
    
    // Cancelar modo de edição ao alternar modo para evitar confusão
    if (snapZones.isEditingZones) {
      snapZones.setIsEditingZones(false);
      snapZones.setTempZones([]);
    }
    
    // Se há uma imagem selecionada, atualizar a imagem no canvas
    if (canvasState.selectedImage && canvasState.canvasImages.length > 0) {
      console.log('🌓 Alternando modo:', newMode ? 'Day' : 'Night');
      // Usar handleImageAddToCanvas do canvasState diretamente para evitar loops
      canvasState.handleImageAddToCanvas(canvasState.selectedImage, newMode, imageConversion.conversionComplete, imageConversion.analysisComplete);
      
      // Se alternando para modo noite e análise ainda não foi feita, disparar análise YOLO12
      if (newMode === false && canvasState.selectedImage && !imageConversion.analysisComplete[canvasState.selectedImage.id]) {
        setTimeout(function() {
          imageConversion.setAnalyzingImageId(canvasState.selectedImage.id);
          setTimeout(function() {
            imageConversion.setAnalyzingImageId(null);
            // Marcar como completa (simulado)
            // Na prática, isso deveria vir da análise real
            imageConversion.setAnalysisComplete(function(prev) {
              var updated = {};
              for (var key in prev) {
                updated[key] = prev[key];
              }
              updated[canvasState.selectedImage.id] = true;
              return updated;
            });
          }, 2500);
        }, 500);
      }
    }
  };

  // Salvamento automático
  useCanvasPersistence({
    decorations: canvasState.decorations,
    canvasImages: canvasState.canvasImages,
    snapZonesByImage: snapZones.snapZonesByImage,
    decorationsByImage: decorationManagement.decorationsByImage,
    formData,
    onInputChange
  });

  // Carregar decorações do formData no decorationManagement
  useEffect(() => {
    if (formData?.decorationsByImage && Object.keys(formData.decorationsByImage).length > 0) {
      console.log('📦 Carregando decorações por imagem do formData');
      decorationManagement.setDecorationsByImage(formData.decorationsByImage);
    }
  }, [formData?.id]);

  return (
    <div className="h-full flex flex-col">
      {canvasState.uploadStep === 'uploading' && <UploadModal onUploadComplete={handleUploadComplete} />}
      {canvasState.uploadStep === 'loading' && <LoadingIndicator />}
      
      {/* Painel unificado de snap zones */}
      {canvasState.uploadStep === 'done' && (
        <>
          <UnifiedSnapZonesPanel
            selectedImage={canvasState.selectedImage}
            zones={snapZones.currentSnapZones}
            tempZones={snapZones.tempZones}
            isEditingZones={snapZones.isEditingZones}
            isDayMode={canvasState.isDayMode}
            isAnalyzed={canvasState.selectedImage ? (imageConversion.analysisComplete[canvasState.selectedImage.id] || false) : false}
            onToggleEditMode={() => {
              if (snapZones.isEditingZones) {
                snapZones.handleCancelEditZones();
              } else {
                snapZones.setIsEditingZones(true);
                snapZones.setTempZones([]);
                console.log('✏️ Modo edição de zonas ativado');
              }
            }}
            onSaveZones={snapZones.handleSaveZones}
            onCancelEdit={snapZones.handleCancelEditZones}
            onAddZone={snapZones.handleAddSnapZone}
            onRemoveZone={snapZones.handleRemoveSnapZone}
            isVisible={showUnifiedPanel}
            onToggle={() => {
              const next = !showUnifiedPanel;
              setShowUnifiedPanel(next);
              canvasState.setShowSnapZones(next); // sincronizar visualização de zonas com o botão
            }}
          />
          {/* Botão para mostrar/ocultar painel */}
          <Button
            size="sm"
            variant="solid"
            color="primary"
            radius="full"
            className="fixed bottom-4 left-4 z-[100] shadow-md hover:shadow-lg transition-all opacity-60 hover:opacity-100 px-3"
            onPress={() => {
              console.log('🔧 Toggle Unified Panel:', !showUnifiedPanel);
              const next = !showUnifiedPanel;
              setShowUnifiedPanel(next);
              canvasState.setShowSnapZones(next); // sincronizar visualização de zonas com o botão
            }}
            title="Set Zones"
            aria-label="Set Zones"
            startContent={<Icon icon="lucide:crosshair" className="text-lg" />}
          >
            Set Zones
          </Button>
        </>
      )}
      
      {/* Main Content Area - 3 Column Layout */}
      {canvasState.uploadStep === 'done' && (
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Sidebar - Image Thumbnails */}
          <aside className="w-32 md:w-40 lg:w-48 border-r border-divider bg-content1/30 flex flex-col flex-shrink-0">
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
                      content={isDisabled ? "Aguardando conversão para noite..." : ""}
                      isDisabled={!isDisabled}
                      placement="right"
                    >
                      <Card
                        isFooterBlurred
                        isPressable={!isDisabled}
                        isDisabled={isDisabled}
                        className={`border-none transition-all duration-200 ${
                          isDisabled
                            ? 'cursor-not-allowed opacity-60'
                            : canvasState.selectedImage?.id === image.id 
                              ? 'cursor-pointer ring-2 ring-primary shadow-lg' 
                              : 'cursor-pointer hover:ring-1 hover:ring-primary/50'
                        }`}
                        radius="lg"
                        onPress={() => {
                          if (!isDisabled) {
                            console.log('🖱️ CARD CLICADO - Imagem:', image.name);
                            handleImageAddToCanvas(image);
                          }
                        }}
                        aria-label={`Select source image ${image.name}`}
                      >
                        {/* NightThumb com animação de dia para noite */}
                        <NightThumb
                          dayImage={image.thumbnail}
                          nightImage={image.nightVersion}
                          filename={image.name}
                          isActive={index === imageConversion.activeGifIndex}
                          duration={4000}
                        />
                        
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
                          src={image.thumbnail}
                          width="100%"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
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
                  
                    {/* Overlay de análise YOLO12 no thumbnail específico - FORA do Card para garantir z-index */}
                    {imageConversion.analyzingImageId === image.id && (
                      <YOLO12ThumbnailOverlay duration={2500} />
                    )}
                  </div>
                );
              })}

              {/* Fake add image card (placed after sources) */}
              <Card
                isFooterBlurred
                isPressable={false}
                className="w-full cursor-not-allowed border-none transition-all duration-200 opacity-80 hover:opacity-70"
                radius="lg"
                onPress={() => {
                  console.log('➕ [Source Images] Fake add image clicked');
                }}
                aria-label="Add image or take picture (coming soon)"
              >
                <div className="w-full h-[120px] flex items-center justify-center bg-gradient-to-br from-default-100 to-default-200 rounded-lg relative overflow-hidden">
                  {/* Overlay pattern sutil para indicar disabled */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/2"></div>
                  
                  <div className="flex flex-col items-center gap-2 text-default-500 relative z-10">
                    <Icon icon="lucide:upload-cloud" className="text-3xl opacity-80" />
                    <span className="text-sm font-medium text-center leading-tight">Add image or take picture</span>
                  </div>
                </div>
                <CardFooter className="absolute bg-black/40 bottom-0 z-10 py-1 pointer-events-none">
                  <div className="flex grow gap-2 items-center">
                    <Icon icon="lucide:clock" className="text-tiny text-warning-400" />
                    <p className="text-tiny text-white/80 truncate">Upload (coming soon)</p>
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
                      (canvasState.selectedImage && !imageConversion.conversionComplete[canvasState.selectedImage.id])
                    }
                    title={
                      canvasState.selectedImage && !imageConversion.conversionComplete[canvasState.selectedImage.id]
                        ? "Aguardando conversão para noite..."
                        : undefined
                    }
                    aria-label={canvasState.isDayMode ? "Switch to night mode" : "Switch to day mode"}
                  >
                    {canvasState.isDayMode ? 'Day' : 'Night'}
                  </Button>
                  <Button
                    size="sm"
                    variant="light"
                    title="Show/Hide Zones"
                    aria-label="Show or hide snap zones"
                    startContent={<Icon icon={"lucide:eye"} />}
                    onPress={() => {
                      // Verificar se análise foi completada antes de alternar zonas
                      if (canvasState.selectedImage && !imageConversion.analysisComplete[canvasState.selectedImage.id]) {
                        setZonesWarning(true);
                        setTimeout(() => setZonesWarning(false), 3000); // Esconder após 3 segundos
                        return;
                      }
                      canvasState.setShowSnapZones(!canvasState.showSnapZones);
                    }}
                    isDisabled={canvasState.canvasImages.length === 0}
                  >
                    Zones
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
                </div>
              </div>
              
              <div className="flex-1 min-h-0">
                {canvasState.noBgWarning && (
                  <div className="mb-2 p-2 rounded-md bg-warning-50 border border-warning-200 text-warning-700 text-sm">
                    ⚠️ Select a background image to add PNGs
                  </div>
                )}
                {zonesWarning && (
                  <div className="mb-2 p-3 rounded-md bg-warning-50 border border-warning-200 text-warning-700 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Icon icon="lucide:alert-circle" className="text-warning-600 flex-shrink-0" />
                    <span>Zones are not available yet. Please wait for the analysis to complete.</span>
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
                  snapZones={
                    canvasState.showSnapZones && 
                    canvasState.selectedImage && 
                    imageConversion.analysisComplete[canvasState.selectedImage.id] 
                      ? snapZones.allZonesForDisplay 
                      : []
                  }
                  isDayMode={canvasState.isDayMode}
                  isEditingZones={snapZones.isEditingZones}
                  analysisComplete={imageConversion.analysisComplete}
                  showSnapZones={canvasState.showSnapZones}
                  onZoneCreate={(zone) => {
                    console.log('🎨 [DEBUG] Zona criada no canvas, adicionando a tempZones:', zone);
                    snapZones.setTempZones(function(prev) {
                      var updated = [...prev, zone];
                      console.log('🎨 [DEBUG] tempZones atualizado:', updated.length, 'zonas temporárias');
                      return updated;
                    });
                  }}
                  onRequireBackground={() => {
                    canvasState.setNoBgWarning(true);
                    setTimeout(() => canvasState.setNoBgWarning(false), 2000);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar - Decoration Library */}
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
                id: `dec-${Date.now()}`, // ID único com prefixo
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
        </div>
      )}
    </div>
  );
};

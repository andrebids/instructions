import { useEffect, useRef } from 'react';
import { projectsAPI, ordersAPI } from '../../../services/api';
import { saveEditorState } from '../../../services/indexedDB';
import { registerSyncTag, isBackgroundSyncAvailable } from '../../../services/backgroundSync';

/**
 * Hook para gerenciar salvamento automático do canvas
 * Salva em formData, localStorage e API (se projeto existe)
 * 
 * @param {Object} params
 * @param {Array} params.decorations - Decorações do canvas
 * @param {Array} params.canvasImages - Imagens do canvas
 * @param {Object} params.snapZonesByImage - Zonas de snap por imagem
 * @param {Object} params.decorationsByImage - Decorações por imagem
 * @param {Array} params.uploadedImages - Imagens uploadadas para o projeto
 * @param {Object} params.simulationState - Estado da simulação (uploadStep, selectedImageId, isDayMode, conversionComplete)
 * @param {Object} params.cropByImage - Crop por imagem { imageId: { xNorm, yNorm, wNorm, hNorm, orientation } }
 * @param {Object} params.formData - Dados do formulário
 * @param {Function} params.onInputChange - Callback para atualizar formData
 * @param {Function} params.getExportImage - Função para exportar imagem do canvas
 */
export const useCanvasPersistence = ({
  decorations,
  canvasImages,
  snapZonesByImage,
  decorationsByImage,
  uploadedImages = [],
  simulationState = null,
  cropByImage = {},
  formData,
  onInputChange,
  getExportImage = null
}) => {
  // Ref para rastrear valores anteriores e evitar atualizações desnecessárias
  const prevValuesRef = useRef({
    decorations: null,
    canvasImages: null,
    snapZonesByImage: null,
    decorationsByImage: null,
    uploadedImages: null,
    simulationState: null,
    cropByImage: null
  });
  
  useEffect(() => {
    // Verificar se realmente há mudanças antes de atualizar (evitar loops infinitos)
    const decorationsStr = JSON.stringify(decorations);
    const canvasImagesStr = JSON.stringify(canvasImages);
    const snapZonesStr = JSON.stringify(snapZonesByImage);
    const decorationsByImageStr = JSON.stringify(decorationsByImage);
    const uploadedImagesStr = JSON.stringify(uploadedImages);
    const simulationStateStr = JSON.stringify(simulationState);
    const cropByImageStr = JSON.stringify(cropByImage);

    // Comparar também com o que já está em formData para evitar setState redundante
    const formDataDecorationsStr = JSON.stringify(formData?.canvasDecorations || []);
    const formDataImagesStr = JSON.stringify(formData?.canvasImages || []);
    const formDataSnapStr = JSON.stringify(formData?.snapZonesByImage || {});
    const formDataDecorationsByImageStr = JSON.stringify(formData?.decorationsByImage || {});
    const formDataUploadedStr = JSON.stringify(formData?.uploadedImages || []);
    const formDataSimulationStr = JSON.stringify(formData?.simulationState || null);
    const formDataCropStr = JSON.stringify(formData?.cropByImage || {});

    const alreadySynced =
      decorationsStr === formDataDecorationsStr &&
      canvasImagesStr === formDataImagesStr &&
      snapZonesStr === formDataSnapStr &&
      decorationsByImageStr === formDataDecorationsByImageStr &&
      uploadedImagesStr === formDataUploadedStr &&
      simulationStateStr === formDataSimulationStr &&
      cropByImageStr === formDataCropStr;

    const hasChanges = 
      (!alreadySynced) && (
        prevValuesRef.current.decorations !== decorationsStr ||
        prevValuesRef.current.canvasImages !== canvasImagesStr ||
        prevValuesRef.current.snapZonesByImage !== snapZonesStr ||
        prevValuesRef.current.decorationsByImage !== decorationsByImageStr ||
        prevValuesRef.current.uploadedImages !== uploadedImagesStr ||
        prevValuesRef.current.simulationState !== simulationStateStr ||
        prevValuesRef.current.cropByImage !== cropByImageStr
      );
    
    if (!hasChanges) {
      return; // Não há mudanças, não atualizar
    }
    
    // Atualizar valores anteriores
    prevValuesRef.current = {
      decorations: decorationsStr,
      canvasImages: canvasImagesStr,
      snapZonesByImage: snapZonesStr,
      decorationsByImage: decorationsByImageStr,
      uploadedImages: uploadedImagesStr,
      simulationState: simulationStateStr,
      cropByImage: cropByImageStr
    };
    
    // Salvar no formData (sem logs excessivos)
    onInputChange("canvasDecorations", decorations);
    onInputChange("canvasImages", canvasImages);
    onInputChange("snapZonesByImage", snapZonesByImage);
    onInputChange("decorationsByImage", decorationsByImage);
    
    // Extrair e salvar metadados do cartouche das imagens do canvas
    // Garantir que cartoucheByImage esteja sincronizado com os metadados das imagens
    const cartoucheByImage = {};
    canvasImages.forEach(img => {
      if (img.isSourceImage && img.imageId && img.cartouche) {
        cartoucheByImage[img.imageId] = {
          projectName: img.cartouche.projectName,
          streetOrZone: img.cartouche.streetOrZone,
          option: img.cartouche.option,
          hasCartouche: img.cartouche.hasCartouche
        };
      }
    });
    
    // Atualizar cartoucheByImage apenas se houver mudanças
    if (Object.keys(cartoucheByImage).length > 0) {
      onInputChange("cartoucheByImage", cartoucheByImage);
    }
    
    // Salvar uploadedImages, simulationState e cropByImage se fornecidos
    if (uploadedImages !== undefined) {
      onInputChange("uploadedImages", uploadedImages);
    }
    if (simulationState !== undefined && simulationState !== null) {
      onInputChange("simulationState", simulationState);
    }
    if (cropByImage !== undefined) {
      onInputChange("cropByImage", cropByImage);
    }
    
    // Salvar também no localStorage como backup
    try {
      var projectId = formData?.id || 'temp';
      localStorage.setItem('snapZonesByImage_' + projectId, JSON.stringify(snapZonesByImage));
    } catch (e) {
      console.error('⚠️ Erro ao salvar no localStorage:', e);
    }
    
    // Se projeto já existe (tem ID), salvar automaticamente na base de dados
    var temProjectId = !!formData?.id;
    var temZonas = Object.keys(snapZonesByImage).length > 0;
    
    if (temProjectId) {
      var timeoutId = setTimeout(async function() {
        // Exportar imagem do canvas se houver decorações e imagens
        let canvasPreviewImage = null;
        if (getExportImage && canvasImages.length > 0 && decorations.length > 0) {
          try {
            canvasPreviewImage = getExportImage();
            if (canvasPreviewImage) {
              console.log('📸 Canvas preview exportado');
            }
          } catch (exportErr) {
            console.warn('⚠️ Erro ao exportar canvas preview:', exportErr.message);
          }
        }
        
        var dadosParaSalvar = {
          snapZonesByImage: snapZonesByImage,
          canvasDecorations: decorations,
          canvasImages: canvasImages,
          decorationsByImage: decorationsByImage,
          cartoucheByImage: cartoucheByImage, // Incluir cartoucheByImage no salvamento
          cropByImage: cropByImage || {}, // Incluir cropByImage no salvamento
          lastEditedStep: 'ai-designer', // Canvas só é usado no step ai-designer
          uploadedImages: uploadedImages || [],
          simulationState: simulationState || formData?.simulationState || {
            uploadStep: uploadedImages && uploadedImages.length > 0 ? 'done' : 'uploading',
            selectedImageId: null,
            isDayMode: true,
            conversionComplete: {}
          },
          // Incluir preview do canvas exportado (imagem com decorações)
          canvasPreviewImage: canvasPreviewImage
        };
        
        // Salvar no IndexedDB também (robusto para mobile)
        try {
          await saveEditorState(formData.id, {
            lastEditedStep: 'ai-designer',
            canvasDecorations: decorations,
            canvasImages: canvasImages,
            snapZonesByImage: snapZonesByImage,
            decorationsByImage: decorationsByImage,
            cartoucheByImage: cartoucheByImage,
            cropByImage: cropByImage || {},
            canvasPreviewImage: canvasPreviewImage,
            pendingSync: !navigator.onLine
          });
        } catch (idxError) {
          console.warn('⚠️ Erro ao salvar no IndexedDB:', idxError);
        }
        
        // Salvar no localStorage também
        try {
          localStorage.setItem(`project_${formData.id}_lastStep`, 'ai-designer');
          localStorage.setItem(`project_${formData.id}_lastStepTime`, new Date().toISOString());
        } catch (lsError) {
          console.warn('⚠️ Erro ao salvar no localStorage:', lsError);
        }
        
        projectsAPI.updateCanvas(formData.id, dadosParaSalvar)
          .then(function() {
            // Sincronizar decorações com as orders do projeto
            if (decorations && decorations.length > 0) {
              const decorationsToSync = decorations.map(dec => ({
                decorationId: dec.decorationId || dec.id,
                name: dec.name || 'Decoração',
                imageUrl: dec.dayUrl || dec.nightUrl || dec.src || dec.imageUrl,
                price: dec.price || 0,
              }));
              
              ordersAPI.syncDecorations(formData.id, decorationsToSync)
                .then(function(result) {
                  console.log('✅ Decorações sincronizadas com orders:', result);
                })
                .catch(function(syncErr) {
                  console.warn('⚠️ Erro ao sincronizar decorações com orders:', syncErr.message);
                });
            }
          })
          .catch(function(err) {
            console.error('❌ Erro ao salvar canvas na API:', err.message);
            
            // Se offline, registar para sync quando voltar online
            if (!navigator.onLine && isBackgroundSyncAvailable()) {
              registerSyncTag(formData.id);
            }
          });
      }, 500); // Debounce de 500ms para evitar muitas chamadas
      
      return function() {
        clearTimeout(timeoutId);
      };
    }
  }, [decorations, canvasImages, snapZonesByImage, decorationsByImage, uploadedImages, simulationState, cropByImage, formData?.id]); // Removido onInputChange das dependências para evitar loop infinito
};


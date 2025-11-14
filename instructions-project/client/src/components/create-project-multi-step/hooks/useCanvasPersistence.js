import { useEffect, useRef } from 'react';
import { projectsAPI } from '../../../services/api';
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
 * @param {Object} params.formData - Dados do formulário
 * @param {Function} params.onInputChange - Callback para atualizar formData
 */
export const useCanvasPersistence = ({
  decorations,
  canvasImages,
  snapZonesByImage,
  decorationsByImage,
  formData,
  onInputChange
}) => {
  // Ref para rastrear valores anteriores e evitar atualizações desnecessárias
  const prevValuesRef = useRef({
    decorations: null,
    canvasImages: null,
    snapZonesByImage: null,
    decorationsByImage: null
  });
  
  useEffect(() => {
    // Verificar se realmente há mudanças antes de atualizar (evitar loops infinitos)
    const decorationsStr = JSON.stringify(decorations);
    const canvasImagesStr = JSON.stringify(canvasImages);
    const snapZonesStr = JSON.stringify(snapZonesByImage);
    const decorationsByImageStr = JSON.stringify(decorationsByImage);
    
    const hasChanges = 
      prevValuesRef.current.decorations !== decorationsStr ||
      prevValuesRef.current.canvasImages !== canvasImagesStr ||
      prevValuesRef.current.snapZonesByImage !== snapZonesStr ||
      prevValuesRef.current.decorationsByImage !== decorationsByImageStr;
    
    if (!hasChanges) {
      return; // Não há mudanças, não atualizar
    }
    
    // Atualizar valores anteriores
    prevValuesRef.current = {
      decorations: decorationsStr,
      canvasImages: canvasImagesStr,
      snapZonesByImage: snapZonesStr,
      decorationsByImage: decorationsByImageStr
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
        var dadosParaSalvar = {
          snapZonesByImage: snapZonesByImage,
          canvasDecorations: decorations,
          canvasImages: canvasImages,
          decorationsByImage: decorationsByImage,
          cartoucheByImage: cartoucheByImage, // Incluir cartoucheByImage no salvamento
          lastEditedStep: 'ai-designer' // Canvas só é usado no step ai-designer
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
  }, [decorations, canvasImages, snapZonesByImage, decorationsByImage, formData?.id]); // Removido onInputChange das dependências para evitar loop infinito
};


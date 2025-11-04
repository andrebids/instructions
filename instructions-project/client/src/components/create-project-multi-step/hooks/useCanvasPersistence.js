import { useEffect } from 'react';
import { projectsAPI } from '../../../services/api';

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
  useEffect(() => {
    var zonasPorImagem = Object.keys(snapZonesByImage).map(key => ({
      imagem: key,
      zonasDay: snapZonesByImage[key]?.day?.length || 0,
      zonasNight: snapZonesByImage[key]?.night?.length || 0,
      total: (snapZonesByImage[key]?.day?.length || 0) + (snapZonesByImage[key]?.night?.length || 0)
    }));
    
    console.log('💾 [DEBUG] ===== INÍCIO SALVAMENTO ZONAS =====');
    console.log('💾 [DEBUG] snapZonesByImage completo:', JSON.stringify(snapZonesByImage, null, 2));
    console.log('💾 [DEBUG] Resumo zonas:', {
      totalImagens: Object.keys(snapZonesByImage).length,
      zonasPorImagem: zonasPorImagem,
      projectId: formData?.id,
      temProjectId: !!formData?.id
    });
    
    // Salvar no formData
    console.log('💾 [DEBUG] Salvando no formData...');
    onInputChange("canvasDecorations", decorations);
    onInputChange("canvasImages", canvasImages);
    onInputChange("snapZonesByImage", snapZonesByImage);
    onInputChange("decorationsByImage", decorationsByImage);
    console.log('💾 [DEBUG] FormData atualizado');
    
    // Salvar também no localStorage como backup
    try {
      var projectId = formData?.id || 'temp';
      localStorage.setItem('snapZonesByImage_' + projectId, JSON.stringify(snapZonesByImage));
      console.log('💾 [DEBUG] Zonas salvas no localStorage (chave: snapZonesByImage_' + projectId + ')');
    } catch (e) {
      console.error('⚠️ [DEBUG] Erro ao salvar no localStorage:', e);
    }
    
    // Se projeto já existe (tem ID), salvar automaticamente na base de dados
    var temProjectId = !!formData?.id;
    var temZonas = Object.keys(snapZonesByImage).length > 0;
    
    console.log('💾 [DEBUG] Verificando condições para salvar na BD:', {
      temProjectId: temProjectId,
      temZonas: temZonas,
      projectId: formData?.id,
      vaiSalvar: temProjectId && temZonas
    });
    
    if (temProjectId && temZonas) {
      console.log('💾 [DEBUG] Preparando para salvar na base de dados (debounce 500ms)...');
      var timeoutId = setTimeout(function() {
        var dadosParaSalvar = {
          snapZonesByImage: snapZonesByImage,
          canvasDecorations: decorations,
          canvasImages: canvasImages,
          decorationsByImage: decorationsByImage
        };
        
        console.log('💾 [DEBUG] ===== ENVIANDO PARA BASE DE DADOS =====');
        console.log('💾 [DEBUG] Projeto ID:', formData.id);
        console.log('💾 [DEBUG] Dados a enviar:', {
          snapZonesByImage: JSON.stringify(snapZonesByImage, null, 2),
          totalCanvasDecorations: decorations.length,
          totalCanvasImages: canvasImages.length,
          totalDecorationsByImage: Object.keys(decorationsByImage).length
        });
        
        projectsAPI.updateCanvas(formData.id, dadosParaSalvar)
          .then(function(response) {
            console.log('✅ [DEBUG] ===== SUCESSO AO SALVAR NA BASE DE DADOS =====');
            console.log('✅ [DEBUG] Projeto ID:', formData.id);
            console.log('✅ [DEBUG] Resposta do servidor:', response);
            console.log('✅ [DEBUG] Zonas confirmadas na BD:', response.snapZonesByImage ? JSON.stringify(response.snapZonesByImage, null, 2) : 'N/A');
          })
          .catch(function(err) {
            console.error('❌ [DEBUG] ===== ERRO AO SALVAR NA BASE DE DADOS =====');
            console.error('❌ [DEBUG] Projeto ID:', formData.id);
            console.error('❌ [DEBUG] Erro completo:', err);
            console.error('❌ [DEBUG] Mensagem de erro:', err.message);
            console.error('❌ [DEBUG] Resposta do servidor:', err.response?.data);
            console.error('❌ [DEBUG] Status HTTP:', err.response?.status);
          });
      }, 500); // Debounce de 500ms para evitar muitas chamadas
      
      return function() {
        console.log('💾 [DEBUG] Limpando timeout de salvamento');
        clearTimeout(timeoutId);
      };
    } else {
      if (!temProjectId) {
        console.log('⚠️ [DEBUG] Projeto ainda não tem ID - zonas ficam apenas no formData/localStorage');
      }
      if (!temZonas) {
        console.log('⚠️ [DEBUG] Nenhuma zona definida - não há nada para salvar');
      }
    }
    
    console.log('💾 [DEBUG] ===== FIM SALVAMENTO ZONAS =====');
  }, [decorations, canvasImages, snapZonesByImage, decorationsByImage, formData?.id]); // Removido onInputChange das dependências para evitar loop infinito
};


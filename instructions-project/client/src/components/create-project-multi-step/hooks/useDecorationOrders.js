import { useEffect, useRef, useCallback } from 'react';
import { ordersAPI } from '../../../services/api';

/**
 * Hook para sincronizar decorações do canvas com a order do projeto
 * Quando decorações mudam, atualiza automaticamente os items da order
 * 
 * @param {Object} params
 * @param {Array} params.decorations - Decorações no canvas atual
 * @param {Object} params.decorationsByImage - Decorações por imagem (todas as imagens)
 * @param {string|null} params.projectId - ID do projeto (null se projeto novo)
 * @param {Object|null} params.selectedImage - Imagem selecionada no canvas
 * @param {boolean} params.enabled - Se a sincronização está habilitada
 */
export const useDecorationOrders = ({
  decorations = [],
  decorationsByImage = {},
  projectId,
  selectedImage = null,
  enabled = true,
}) => {
  // Ref para debounce e rastrear última sincronização
  const syncTimeoutRef = useRef(null);
  const lastSyncRef = useRef(null);
  const isSyncingRef = useRef(false);

  /**
   * Sincronizar decorações com a order do projeto
   */
  const syncDecorationsToOrder = useCallback(async () => {
    // Não sincronizar se não houver projectId ou se estiver desabilitado
    if (!projectId || !enabled) {
      return;
    }

    // Evitar sincronizações simultâneas
    if (isSyncingRef.current) {
      return;
    }

    // Agregar todas as decorações de todas as imagens
    const allDecorations = [];
    
    // Adicionar decorações de decorationsByImage
    for (const [imageId, imageDecorations] of Object.entries(decorationsByImage)) {
      if (Array.isArray(imageDecorations)) {
        for (const dec of imageDecorations) {
          allDecorations.push({
            ...dec,
            sourceImageId: imageId,
          });
        }
      }
    }

    // Se não houver decorações no mapeamento, usar as decorações atuais
    if (allDecorations.length === 0 && decorations.length > 0) {
      for (const dec of decorations) {
        allDecorations.push({
          ...dec,
          sourceImageId: selectedImage?.id || null,
        });
      }
    }

    // Verificar se houve mudança desde a última sincronização
    const syncKey = JSON.stringify(allDecorations.map(d => ({
      id: d.decorationId || d.id,
      name: d.name,
      sourceImageId: d.sourceImageId,
    })));

    if (lastSyncRef.current === syncKey) {
      return; // Nada mudou
    }

    try {
      isSyncingRef.current = true;

      // Preparar dados para envio
      const decorationsToSync = allDecorations.map(dec => ({
        decorationId: dec.decorationId || dec.id,
        name: dec.name,
        imageUrl: dec.dayUrl || dec.src || dec.imageUrl,
        price: dec.price || 0,
      }));

      console.log('🔄 [useDecorationOrders] Sincronizando', decorationsToSync.length, 'decorações para projeto', projectId);

      // Chamar API para sincronizar
      const result = await ordersAPI.syncDecorations(projectId, decorationsToSync, null);

      lastSyncRef.current = syncKey;
      console.log('✅ [useDecorationOrders] Sincronização concluída:', result);
    } catch (error) {
      console.error('❌ [useDecorationOrders] Erro ao sincronizar:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [projectId, decorations, decorationsByImage, selectedImage, enabled]);

  /**
   * Sincronizar com debounce (evitar muitas chamadas)
   */
  const debouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncDecorationsToOrder();
    }, 2000); // 2 segundos de debounce
  }, [syncDecorationsToOrder]);

  // Sincronizar quando decorações mudarem
  useEffect(() => {
    if (!projectId || !enabled) {
      return;
    }

    // Calcular total de decorações
    let totalDecorations = 0;
    for (const imageDecorations of Object.values(decorationsByImage)) {
      if (Array.isArray(imageDecorations)) {
        totalDecorations += imageDecorations.length;
      }
    }
    
    // Se não há decorações no mapeamento, usar as atuais
    if (totalDecorations === 0) {
      totalDecorations = decorations.length;
    }

    // Só sincronizar se houver decorações
    if (totalDecorations > 0) {
      debouncedSync();
    }

    // Cleanup
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [decorations, decorationsByImage, projectId, enabled, debouncedSync]);

  // Retornar função para sincronização manual
  return {
    syncNow: syncDecorationsToOrder,
    isSyncing: isSyncingRef.current,
  };
};

export default useDecorationOrders;


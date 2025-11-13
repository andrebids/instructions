/**
 * Serviço para Background Sync API - sincronização offline
 * Permite que mudanças sejam sincronizadas automaticamente quando voltar online
 */

/**
 * Verificar se Background Sync está disponível
 */
export function isBackgroundSyncAvailable() {
  return 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype;
}

/**
 * Registar sync tag para um projeto
 */
export async function registerSyncTag(projectId) {
  if (!isBackgroundSyncAvailable()) {
    console.warn('⚠️ [BackgroundSync] Background Sync não disponível');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(`sync-project-${projectId}`);
    console.log(`✅ [BackgroundSync] Sync tag registada para projeto ${projectId}`);
    return true;
  } catch (error) {
    console.error(`❌ [BackgroundSync] Erro ao registar sync tag:`, error);
    return false;
  }
}

/**
 * Verificar status de sincronização
 */
export async function getSyncStatus(projectId) {
  if (!isBackgroundSyncAvailable()) {
    return { available: false, pending: false };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const tags = await registration.sync.getTags();
    const syncTag = `sync-project-${projectId}`;
    return {
      available: true,
      pending: tags.includes(syncTag),
    };
  } catch (error) {
    console.error('❌ [BackgroundSync] Erro ao verificar status:', error);
    return { available: false, pending: false };
  }
}

/**
 * Sincronizar projeto específico (chamado pelo service worker)
 */
export async function syncProject(projectId) {
  try {
    // Importar dinamicamente para evitar dependência circular
    const { getEditorState, markAsSynced } = await import('./indexedDB.js');
    const { projectsAPI } = await import('./api.js');

    const editorState = await getEditorState(projectId);
    
    if (!editorState || !editorState.pendingSync) {
      console.log(`ℹ️ [BackgroundSync] Nenhuma sincronização pendente para projeto ${projectId}`);
      return;
    }

    console.log(`🔄 [BackgroundSync] Sincronizando projeto ${projectId}...`);

    // Preparar dados para enviar
    const updateData = {
      lastEditedStep: editorState.lastEditedStep,
      canvasDecorations: editorState.canvasDecorations,
      canvasImages: editorState.canvasImages,
      snapZonesByImage: editorState.snapZonesByImage,
      decorationsByImage: editorState.decorationsByImage,
    };

    // Tentar sincronizar com backend
    await projectsAPI.update(projectId, updateData);

    // Marcar como sincronizado
    await markAsSynced(projectId);
    console.log(`✅ [BackgroundSync] Projeto ${projectId} sincronizado com sucesso`);
  } catch (error) {
    console.error(`❌ [BackgroundSync] Erro ao sincronizar projeto ${projectId}:`, error);
    // Não marcar como sincronizado se falhou - tentará novamente na próxima vez
    throw error;
  }
}


/**
 * Serviço para Background Sync API - sincronização offline
 * Permite que mudanças sejam sincronizadas automaticamente quando voltar online
 */

/**
 * Verificar se Background Sync está disponível
 */
export function isBackgroundSyncAvailable() {
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasSync = 'sync' in ServiceWorkerRegistration.prototype;
  const available = hasServiceWorker && hasSync;
  
  // Only log warning if not available (one-time check)
  if (!hasSync && hasServiceWorker) {
    console.warn(`⚠️ [BackgroundSync] Background Sync API not available (Chrome/Edge only)`);
  }
  
  return available;
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
    const syncTag = `sync-project-${projectId}`;
    await registration.sync.register(syncTag);
    
    console.log(`✅ [BackgroundSync] Sync tag registada para projeto ${projectId}`);
    
    return true;
  } catch (error) {
    console.error(`❌ [BackgroundSync] Erro ao registar sync tag para projeto ${projectId}:`, error);
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
    const pending = tags.includes(syncTag);
    
    return {
      available: true,
      pending,
    };
  } catch (error) {
    console.error(`❌ [BackgroundSync] Erro ao verificar status do projeto ${projectId}:`, error);
    return { available: false, pending: false };
  }
}

/**
 * Notify service worker about sync completion
 */
async function notifySyncComplete(projectId, success) {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({
          type: 'SYNC_COMPLETE',
          projectId,
          success
        });
      }
    } catch (error) {
      console.error(`❌ [BackgroundSync] Error notifying service worker:`, error);
    }
  }
}

/**
 * Sync specific project (called by service worker)
 */
export async function syncProject(projectId) {
  try {
    // Import dynamically to avoid circular dependency
    const { getEditorState, markAsSynced } = await import('./indexedDB.js');
    const { projectsAPI } = await import('./api.js');

    const editorState = await getEditorState(projectId);
    
    if (!editorState || !editorState.pendingSync) {
      await notifySyncComplete(projectId, true);
      return;
    }

    console.log(`🔄 [BackgroundSync] Syncing project ${projectId}...`);

    // Prepare data to send
    const updateData = {
      lastEditedStep: editorState.lastEditedStep,
      canvasDecorations: editorState.canvasDecorations,
      canvasImages: editorState.canvasImages,
      snapZonesByImage: editorState.snapZonesByImage,
      decorationsByImage: editorState.decorationsByImage,
    };

    // Try to sync with backend
    await projectsAPI.update(projectId, updateData);

    // Mark as synced
    await markAsSynced(projectId);
    console.log(`✅ [BackgroundSync] Project ${projectId} synced successfully`);
    
    // Notify service worker about success
    await notifySyncComplete(projectId, true);
  } catch (error) {
    console.error(`❌ [BackgroundSync] Error syncing project ${projectId}:`, error);
    
    // Notify service worker about failure
    await notifySyncComplete(projectId, false);
    
    // Don't mark as synced if failed - will retry next time
    throw error;
  }
}


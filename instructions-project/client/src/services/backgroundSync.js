/**
 * Serviço para Background Sync API - sincronização offline
 * Permite que mudanças sejam sincronizadas automaticamente quando voltar online
 * 
 * Nota: Background Sync API nativa só está disponível no Chrome/Edge.
 * Para Firefox e outros navegadores, usa fallback com eventos online/offline.
 */

// Flag de debug (pode ser ativada via localStorage: 'background-sync-debug' = 'true')
const DEBUG = typeof window !== 'undefined' && 
  (import.meta.env.DEV || localStorage.getItem('background-sync-debug') === 'true')

// Cache para evitar logs repetitivos
let availabilityChecked = false;
let isAvailable = null;
let fallbackInitialized = false;

/**
 * Verificar se Background Sync API nativa está disponível
 * Nota: Background Sync API só está disponível no Chrome/Edge.
 * Firefox e Safari não suportam esta API, mas temos fallback.
 */
export function isBackgroundSyncAvailable() {
  // Retornar resultado em cache se já foi verificado
  if (availabilityChecked) {
    return isAvailable;
  }

  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasSync = 'sync' in ServiceWorkerRegistration.prototype;
  const available = hasServiceWorker && hasSync;
  
  // Cache do resultado
  availabilityChecked = true;
  isAvailable = available;
  
  // Inicializar fallback para navegadores sem suporte nativo
  if (!available && !fallbackInitialized) {
    initializeFallbackSync();
    fallbackInitialized = true;
  }
  
  // Log apenas uma vez quando não disponível (e apenas em debug)
  if (!available && DEBUG) {
    const browser = navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                   navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome') ? 'Safari' : 
                   'este navegador';
    console.info(`ℹ️ [BackgroundSync] Background Sync API nativa não disponível em ${browser}. Usando sincronização automática quando voltar online.`);
  }
  
  return available;
}

/**
 * Inicializar sincronização fallback usando eventos online/offline
 * Funciona em todos os navegadores, incluindo Firefox
 */
function initializeFallbackSync() {
  if (typeof window === 'undefined') return;
  
  // Listener para quando volta online - sincronizar projetos pendentes
  const handleOnline = async () => {
    if (DEBUG) {
      console.log('🌐 [BackgroundSync] Conexão restaurada - verificando sincronizações pendentes...');
    }
    
    try {
      // Importar dinamicamente para evitar dependência circular
      const { getPendingSyncProjects } = await import('./indexedDB.js');
      const pendingProjects = await getPendingSyncProjects();
      
      if (pendingProjects.length > 0) {
        if (DEBUG) {
          console.log(`🔄 [BackgroundSync] Encontrados ${pendingProjects.length} projeto(s) para sincronizar`);
        }
        
        // Sincronizar cada projeto pendente usando a função syncProject definida abaixo
        // (será resolvida em tempo de execução)
        if (!performSync) {
          // Se ainda não foi definida, importar dinamicamente
          const module = await import('./backgroundSync.js');
          performSync = module.syncProject;
        }
        
        for (const projectId of pendingProjects) {
          try {
            await performSync(projectId);
          } catch (error) {
            if (DEBUG) {
              console.error(`❌ [BackgroundSync] Erro ao sincronizar projeto ${projectId}:`, error);
            }
          }
        }
      }
    } catch (error) {
      if (DEBUG) {
        console.error('❌ [BackgroundSync] Erro ao verificar projetos pendentes:', error);
      }
    }
  };
  
  // Só adicionar listener se ainda não estiver online
  if (navigator.onLine) {
    // Já está online, verificar imediatamente após um pequeno delay
    setTimeout(handleOnline, 1000);
  } else {
    // Está offline, aguardar evento online
    window.addEventListener('online', handleOnline, { once: true });
  }
  
  // Verificar periodicamente quando online (fallback adicional)
  if (navigator.onLine) {
    const checkInterval = setInterval(async () => {
      if (!navigator.onLine) {
        clearInterval(checkInterval);
        return;
      }
      
      try {
        const { getPendingSyncProjects } = await import('./indexedDB.js');
        const pendingProjects = await getPendingSyncProjects();
        
        if (pendingProjects.length > 0) {
          if (!performSync) {
            const module = await import('./backgroundSync.js');
            performSync = module.syncProject;
          }
          
          for (const projectId of pendingProjects) {
            try {
              await performSync(projectId);
            } catch (error) {
              // Silenciosamente ignorar erros em verificações periódicas
            }
          }
        }
      } catch (error) {
        // Silenciosamente ignorar erros
      }
    }, 30000); // Verificar a cada 30 segundos quando online
    
    // Limpar intervalo quando sair da página
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => clearInterval(checkInterval));
    }
  }
}

/**
 * Registar sync tag para um projeto
 * Se Background Sync API não estiver disponível, marca como pendente no IndexedDB
 * O fallback sincronizará automaticamente quando voltar online
 */
export async function registerSyncTag(projectId) {
  // Se Background Sync API nativa está disponível, usar ela
  if (isBackgroundSyncAvailable()) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const syncTag = `sync-project-${projectId}`;
      await registration.sync.register(syncTag);
      
      if (DEBUG) {
        console.log(`✅ [BackgroundSync] Sync tag registada para projeto ${projectId}`);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ [BackgroundSync] Erro ao registar sync tag para projeto ${projectId}:`, error);
      return false;
    }
  }
  
  // Fallback: garantir que o projeto está marcado como pendente no IndexedDB
  // O sistema de fallback sincronizará quando voltar online
  try {
    const { getEditorState, saveEditorState } = await import('./indexedDB.js');
    const state = await getEditorState(projectId);
    
    if (state) {
      // Marcar como pendente sincronização
      await saveEditorState(projectId, {
        ...state,
        pendingSync: true
      });
      
      if (DEBUG) {
        console.log(`📝 [BackgroundSync] Projeto ${projectId} marcado para sincronização quando voltar online`);
      }
    }
    
    return true;
  } catch (error) {
    if (DEBUG) {
      console.error(`❌ [BackgroundSync] Erro ao marcar projeto ${projectId} como pendente:`, error);
    }
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
 * Função auxiliar para sincronização (usada pelo fallback)
 * Esta função será definida após syncProject ser declarada
 */
let performSync = null;

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

// Definir função auxiliar após syncProject ser declarada
performSync = syncProject;


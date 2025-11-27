// Custom Service Worker for Background Sync
// This file is used with injectManifest from VitePWA

// Import Workbox modules (must be at top level - hoisted)
// Se estes imports falharem, o Service Worker não será registrado
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Log inicial - se chegou aqui, os imports foram processados
console.log('🔧 [SW] Service Worker script starting to load...');
console.log('✅ [SW] Workbox modules imported successfully');
console.log('📋 [SW] Module checks:', {
  cleanupOutdatedCaches: typeof cleanupOutdatedCaches,
  precacheAndRoute: typeof precacheAndRoute,
  clientsClaim: typeof clientsClaim,
  registerRoute: typeof registerRoute,
  NetworkFirst: typeof NetworkFirst,
  CacheFirst: typeof CacheFirst,
  NetworkOnly: typeof NetworkOnly,
  ExpirationPlugin: typeof ExpirationPlugin,
  CacheableResponsePlugin: typeof CacheableResponsePlugin
});

// Service Worker installation
self.addEventListener('install', (event) => {
  console.log('📦 [SW] Installing service worker...');
  console.log('📋 [SW] Install event details:', {
    type: event.type,
    timeStamp: event.timeStamp
  });
  // Don't skip waiting automatically - wait for user confirmation
  // self.skipWaiting(); // Removed for manual update control
});

// Cleanup outdated caches - deve ser chamado antes de precacheAndRoute
// Conforme documentação VitePWA: https://vite-pwa-org.netlify.app/guide/inject-manifest.html
try {
  console.log('🧹 [SW] Cleaning up outdated caches...');
  cleanupOutdatedCaches();
  console.log('✅ [SW] Outdated caches cleanup completed');
} catch (error) {
  console.error('❌ [SW] Error during cleanupOutdatedCaches:', error);
  throw error;
}

// Precaching assets - manifest is injected by VitePWA during build
// O VitePWA substitui 'self.__WB_MANIFEST' pelo manifest real durante o build
// IMPORTANTE: Deve haver apenas UMA referência a self.__WB_MANIFEST para o Workbox substituir
try {
  console.log('📋 [SW] Checking manifest...');

  // Esta é a única referência a self.__WB_MANIFEST que o Workbox substituirá
  // O Workbox procura por exatamente uma ocorrência e substitui pelo array de manifest
  const manifest = self.__WB_MANIFEST;

  console.log('📋 [SW] Manifest entries count:', manifest ? manifest.length : 0);

  if (!manifest || manifest.length === 0) {
    console.error('❌ [SW] CRITICAL: Manifest is empty or undefined!');
    console.error('❌ [SW] The Service Worker was not processed by VitePWA during build');
    console.error('❌ [SW] This means the build did not inject the manifest');
    console.error('❌ [SW] The sw.js file should be in dist/ and processed, not served from public/');
    throw new Error('Service Worker manifest not injected - build may have failed or sw.js is being served from wrong location');
  }

  console.log('📋 [SW] First 3 manifest entries:', manifest.slice(0, 3));
  console.log('📦 [SW] Starting precache and route...');
  precacheAndRoute(manifest);
  console.log('✅ [SW] Precaching completed successfully');
} catch (error) {
  console.error('❌ [SW] Error during precacheAndRoute:', error);
  console.error('❌ [SW] Error stack:', error.stack);
  throw error;
}

// Função para verificar e logar uso de quota de storage
async function logQuotaUsage() {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usageMB = (estimate.usage / (1024 * 1024)).toFixed(2);
      const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
      const usagePercent = ((estimate.usage / estimate.quota) * 100).toFixed(2);

      console.log('📊 [SW] Uso de Storage:', {
        usado: `${usageMB} MB`,
        quota: `${quotaMB} MB`,
        percentual: `${usagePercent}%`,
        disponivel: `${((estimate.quota - estimate.usage) / (1024 * 1024)).toFixed(2)} MB`
      });

      // Avisar se uso está acima de 80%
      if (estimate.usage / estimate.quota > 0.8) {
        console.warn('⚠️  [SW] Uso de storage acima de 80% - limpeza automática será acionada se necessário');
      }

      return estimate;
    }
  } catch (error) {
    console.warn('⚠️  [SW] Não foi possível verificar quota de storage:', error.message);
  }
  return null;
}

// Função para limpar cache antigo e não utilizado
async function cleanupOldCaches() {
  try {
    console.log('🧹 [SW] Iniciando limpeza de cache antigo...');
    
    const cacheNames = await caches.keys();
    const cacheStats = {
      before: {
        totalCaches: cacheNames.length,
        cacheNames: cacheNames
      }
    };

    // Limpar caches antigos que não são mais necessários
    // Manter apenas caches ativos do Workbox
    const activeCacheNames = [
      'auth-session-cache',
      'api-cache',
      'uploads-images-cache',
      'images-cache'
    ];

    // Adicionar cache de precache do Workbox (formato: workbox-precache-v2-...)
    const precacheCacheNames = cacheNames.filter(name => 
      name.startsWith('workbox-precache') || 
      name.startsWith('workbox-runtime-cache')
    );
    activeCacheNames.push(...precacheCacheNames);

    let deletedCount = 0;
    let totalSizeBefore = 0;
    let totalSizeAfter = 0;

    // PASSO 1: Calcular tamanho total ANTES de qualquer limpeza
    for (const cacheName of cacheNames) {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSizeBefore += blob.size;
          }
        }
      } catch (error) {
        // Ignorar erros ao calcular tamanho
      }
    }

    // PASSO 2: Deletar caches obsoletos
    for (const cacheName of cacheNames) {
      // Verificar se o cache não está na lista de caches ativos
      if (!activeCacheNames.includes(cacheName)) {
        try {
          const deleted = await caches.delete(cacheName);
          if (deleted) {
            deletedCount++;
            console.log(`🗑️  [SW] Cache deletado: ${cacheName}`);
          }
        } catch (error) {
          console.warn(`⚠️  [SW] Erro ao deletar cache ${cacheName}:`, error.message);
        }
      }
    }

    // PASSO 3: Limpar entradas antigas dos caches ativos (mais de 7 dias sem uso)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    let cleanedEntries = 0;

    for (const cacheName of activeCacheNames) {
      try {
        const cache = await caches.open(cacheName);
        if (!cache) continue;
        
        const keys = await cache.keys();
        
        for (const request of keys) {
          try {
            const response = await cache.match(request);
            if (response) {
              // Verificar data da última modificação
              const lastModified = response.headers.get('date') || 
                                   response.headers.get('last-modified');
              
              if (lastModified) {
                const modifiedDate = new Date(lastModified).getTime();
                if (modifiedDate < sevenDaysAgo) {
                  await cache.delete(request);
                  cleanedEntries++;
                }
              }
            }
          } catch (error) {
            // Ignorar erros individuais
          }
        }
      } catch (error) {
        console.warn(`⚠️  [SW] Erro ao limpar entradas do cache ${cacheName}:`, error.message);
      }
    }

    // PASSO 4: Calcular tamanho total DEPOIS de toda a limpeza
    const remainingCaches = await caches.keys();
    for (const cacheName of remainingCaches) {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSizeAfter += blob.size;
          }
        }
      } catch (error) {
        // Ignorar erros
      }
    }

    const sizeSaved = totalSizeBefore - totalSizeAfter;
    const sizeSavedMB = (sizeSaved / (1024 * 1024)).toFixed(2);

    cacheStats.after = {
      totalCaches: remainingCaches.length,
      cacheNames: remainingCaches
    };

    console.log('✅ [SW] Limpeza de cache concluída:', {
      cachesDeletados: deletedCount,
      entradasLimpas: cleanedEntries,
      tamanhoAntes: `${(totalSizeBefore / (1024 * 1024)).toFixed(2)} MB`,
      tamanhoDepois: `${(totalSizeAfter / (1024 * 1024)).toFixed(2)} MB`,
      espacoLiberado: `${sizeSavedMB} MB`,
      cachesAtivos: remainingCaches.length
    });

    return cacheStats;
  } catch (error) {
    console.error('❌ [SW] Erro durante limpeza de cache:', error);
    throw error;
  }
}

// Service Worker activation
self.addEventListener('activate', (event) => {
  console.log('✅ [SW] Service Worker activating...');
  console.log('📋 [SW] Activate event details:', {
    type: event.type,
    timeStamp: event.timeStamp
  });
  
  event.waitUntil(
    Promise.all([
      // Limpar cache antigo na ativação
      cleanupOldCaches(),
      // Verificar quota de storage
      logQuotaUsage(),
      // Manter comportamento original
      self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
        // Only claim clients after user confirms update
        // clientsClaim() will be called after user clicks "Update Now"
        console.log('✅ [SW] Service Worker ready');
        console.log('📋 [SW] Active clients count:', clients.length);
      })
    ]).catch(error => {
      console.error('❌ [SW] Error during activation:', error);
    })
  );
});

// Don't claim clients immediately - wait for user confirmation
// clientsClaim(); // Removed for manual update control

// AuthJS Session cache - Critical for offline access
registerRoute(
  ({ url }) => url.pathname.includes('/auth/session'),
  new NetworkFirst({
    cacheName: 'auth-session-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 1,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
        purgeOnQuotaError: true // Limpar automaticamente quando quota excedida
      })
    ]
  })
);

// API cache with NetworkFirst strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && !url.pathname.includes('/auth/session'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 5, // 5 minutes
        purgeOnQuotaError: true // Limpar automaticamente quando quota excedida
      })
    ]
  })
);

// Google Fonts - não interceptar, deixar passar direto pela rede
// Isso evita problemas de CORS e erros de fetch
// O navegador já faz cache automático de fontes

// Estratégia para imagens temporárias (temp_*) - NÃO CACHEAR
// Sempre buscar da rede para garantir freshness e evitar acúmulo de cache
registerRoute(
  ({ request, url }) => {
    const isImage = request.destination === 'image';
    const isSameOrigin = url.origin === self.location.origin;
    const isExternalImage = url.origin.includes('unsplash.com') ||
      url.origin.includes('images.unsplash.com') ||
      url.origin.includes('fonts.googleapis.com') ||
      url.origin.includes('fonts.gstatic.com');

    // Verificar se é uma imagem temporária
    const isTempImage = url.pathname.includes('temp_') ||
                       url.pathname.includes('temp_nightImage_') ||
                       url.pathname.includes('temp_dayImage_');

    return isImage && isSameOrigin && !isExternalImage && isTempImage;
  },
  // NetworkOnly - não cachear imagens temporárias, sempre buscar da rede
  new NetworkOnly()
);

// Estratégia para uploads permanentes (não temporários)
// NetworkFirst com timeout curto e expiração agressiva para garantir freshness
registerRoute(
  ({ request, url }) => {
    const isImage = request.destination === 'image';
    const isSameOrigin = url.origin === self.location.origin;
    const isExternalImage = url.origin.includes('unsplash.com') ||
      url.origin.includes('images.unsplash.com') ||
      url.origin.includes('fonts.googleapis.com') ||
      url.origin.includes('fonts.gstatic.com');

    // Verificar se é uma imagem de upload permanente (não temporária)
    const isUploadImage = url.pathname.includes('/uploads/');
    const isTempImage = url.pathname.includes('temp_') ||
                       url.pathname.includes('temp_nightImage_') ||
                       url.pathname.includes('temp_dayImage_');

    return isImage && isSameOrigin && !isExternalImage && isUploadImage && !isTempImage;
  },
  // NetworkFirst para uploads permanentes - sempre tentar rede primeiro
  new NetworkFirst({
    cacheName: 'uploads-images-cache',
    networkTimeoutSeconds: 5, // Timeout curto de 5 segundos
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100, // Reduzido de 200 para evitar acúmulo
        maxAgeSeconds: 60 * 60 * 2, // 2 horas (reduzido de 7 dias)
        purgeOnQuotaError: true // Limpar automaticamente quando quota excedida
      })
    ]
  })
);

// CacheFirst para outras imagens estáticas (assets, ícones, logos, etc.)
registerRoute(
  ({ request, url }) => {
    const isImage = request.destination === 'image';
    const isSameOrigin = url.origin === self.location.origin;
    const isExternalImage = url.origin.includes('unsplash.com') ||
      url.origin.includes('images.unsplash.com') ||
      url.origin.includes('fonts.googleapis.com') ||
      url.origin.includes('fonts.gstatic.com');
    
    // Excluir uploads e imagens temporárias (já tratados acima)
    const isUploadImage = url.pathname.includes('/uploads/');
    const isTempImage = url.pathname.includes('temp_') ||
                       url.pathname.includes('temp_nightImage_') ||
                       url.pathname.includes('temp_dayImage_');

    return isImage && isSameOrigin && !isExternalImage && !isUploadImage && !isTempImage;
  },
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        purgeOnQuotaError: true // Limpar automaticamente quando quota excedida
      })
    ]
  })
);

// Background Sync handler
self.addEventListener('sync', (event) => {
  if (event.tag.startsWith('sync-project-')) {
    const projectId = event.tag.replace('sync-project-', '');
    console.log(`🔄 [SW] Background Sync started for project ${projectId}`);

    event.waitUntil(
      syncProjectData(projectId)
    );
  }
});

// Function to sync project data
async function syncProjectData(projectId) {
  try {
    // Get all clients (open tabs/windows)
    const clients = await self.clients.matchAll({ includeUncontrolled: true });

    if (clients.length > 0) {
      // Send message to the first client to trigger sync
      clients[0].postMessage({
        type: 'SYNC_PROJECT',
        projectId: projectId
      });

      // Notify all clients about sync status
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_STATUS',
          projectId: projectId,
          status: 'syncing'
        });
      });
    }
  } catch (error) {
    console.error(`❌ [SW] Error processing sync for project ${projectId}:`, error);

    // Notify clients about sync failure
    try {
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_STATUS',
          projectId: projectId,
          status: 'error',
          error: error.message
        });
      });
    } catch (notifyError) {
      console.error(`❌ [SW] Failed to notify clients about error:`, notifyError);
    }

    throw error; // Re-throw so browser will retry
  }
}

// Message listener from the page
self.addEventListener('message', (event) => {
  // Handle update confirmation from client
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🔄 [SW] User confirmed update, activating new service worker...');
    self.skipWaiting().then(() => {
      // After skipping waiting, claim all clients
      return clientsClaim();
    }).then(() => {
      // Notify all clients that update is complete
      return self.clients.matchAll({ includeUncontrolled: true });
    }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'UPDATE_ACTIVATED'
        });
      });
    });
  }

  // Handle update check request
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Check if there's a waiting service worker
    self.registration.update().then(() => {
      return self.registration.getUpdate();
    }).then(() => {
      // Notify client if update is available
      return self.clients.matchAll({ includeUncontrolled: true });
    }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'UPDATE_AVAILABLE'
        });
      });
    }).catch(error => {
      console.error('❌ [SW] Error checking for updates:', error);
    });
  }

  // Handle sync completion notification
  if (event.data && event.data.type === 'SYNC_COMPLETE') {
    const { projectId, success } = event.data;
    console.log(`✅ [SW] Sync ${success ? 'completed' : 'failed'} for project ${projectId}`);

    // Notify all clients about sync completion
    self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_STATUS',
          projectId: projectId,
          status: success ? 'completed' : 'failed'
        });
      });
    }).catch(error => {
      console.error(`❌ [SW] Error notifying clients about completion:`, error);
    });
  }
});

// Listen for service worker updates
self.addEventListener('updatefound', () => {
  console.log('🔄 [SW] New service worker found, notifying clients...');
  self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE'
      });
    });
  }).catch(error => {
    console.error('❌ [SW] Error notifying clients about update:', error);
  });
});

// Global error handler for unhandled errors
self.addEventListener('error', (event) => {
  console.error('❌ [SW] Global error event:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });

  // Try to notify clients about the error
  self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_ERROR',
        error: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
  }).catch(err => {
    console.error('❌ [SW] Failed to notify clients about error:', err);
  });
});

// Unhandled promise rejection handler
self.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.toString() || '';
  const reasonStr = String(reason);

  // Detectar erros de quota
  const isQuotaError = reasonStr.includes('QuotaExceededError') ||
                      reasonStr.includes('quota') ||
                      reasonStr.includes('QUOTA_EXCEEDED');

  if (isQuotaError) {
    console.error('⚠️  [SW] Erro de quota detectado - limpeza automática será acionada');
    console.error('❌ [SW] Quota error details:', {
      reason: reasonStr,
      error: event.reason
    });
    
    // Tentar limpar cache automaticamente
    cleanupOldCaches().catch(err => {
      console.error('❌ [SW] Erro ao limpar cache após erro de quota:', err);
    });

    // Log quota usage para diagnóstico
    logQuotaUsage().catch(err => {
      console.error('❌ [SW] Erro ao verificar quota de storage:', err);
    });

    event.preventDefault(); // Prevenir erro não tratado
    return;
  }

  // Filtrar erros conhecidos de recursos externos que não devem ser reportados
  const isExternalResourceError =
    reasonStr.includes('unsplash.com') ||
    reasonStr.includes('fonts.googleapis.com') ||
    reasonStr.includes('fonts.gstatic.com') ||
    (reasonStr.includes('NetworkError') && reasonStr.includes('FetchEvent.respondWith'));

  if (isExternalResourceError) {
    // Silenciosamente ignorar erros de recursos externos
    // Esses recursos não são interceptados pelo Service Worker
    event.preventDefault(); // Previne que o erro seja logado no console
    return;
  }

  console.error('❌ [SW] Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise
  });

  // Try to notify clients about the rejection (apenas para erros reais)
  self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_ERROR',
        error: {
          message: 'Unhandled promise rejection',
          reason: reasonStr
        }
      });
    });
  }).catch(err => {
    console.error('❌ [SW] Failed to notify clients about rejection:', err);
  });
});

console.log('✅ [SW] Service Worker script loaded successfully');


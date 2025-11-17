// Custom Service Worker for Background Sync
// This file is used with injectManifest from VitePWA

// Wrapper para capturar erros durante o carregamento
(function() {
  'use strict';
  
  try {
    console.log('🔧 [SW] Service Worker script starting to load...');
    
    // Import Workbox modules (must be at top level - hoisted)
    // Nota: imports são processados antes deste código executar
    // Se houver erro nos imports, este try-catch não vai capturar
    // Mas vamos adicionar verificações depois
    
  } catch (error) {
    console.error('❌ [SW] Error during initial script load:', error);
    throw error;
  }
})();

// Import Workbox modules (must be at top level - hoisted)
// Se estes imports falharem, o Service Worker não será registrado
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

// Verificar se os módulos foram importados corretamente
console.log('✅ [SW] Workbox modules imported successfully');
console.log('📋 [SW] Module checks:', {
  cleanupOutdatedCaches: typeof cleanupOutdatedCaches,
  precacheAndRoute: typeof precacheAndRoute,
  clientsClaim: typeof clientsClaim,
  registerRoute: typeof registerRoute,
  NetworkFirst: typeof NetworkFirst,
  CacheFirst: typeof CacheFirst
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
try {
  console.log('📋 [SW] Checking manifest...');
  const manifest = self.__WB_MANIFEST || [];
  console.log('📋 [SW] Manifest entries count:', manifest.length);
  if (manifest.length > 0) {
    console.log('📋 [SW] First 3 manifest entries:', manifest.slice(0, 3));
  }
  console.log('📦 [SW] Starting precache and route...');
  precacheAndRoute(manifest);
  console.log('✅ [SW] Precaching completed successfully');
} catch (error) {
  console.error('❌ [SW] Error during precacheAndRoute:', error);
  console.error('❌ [SW] Error stack:', error.stack);
  throw error;
}

// Service Worker activation
self.addEventListener('activate', (event) => {
  console.log('✅ [SW] Service Worker activating...');
  console.log('📋 [SW] Activate event details:', {
    type: event.type,
    timeStamp: event.timeStamp
  });
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
      // Only claim clients after user confirms update
      // clientsClaim() will be called after user clicks "Update Now"
      console.log('✅ [SW] Service Worker ready');
      console.log('📋 [SW] Active clients count:', clients.length);
    }).catch(error => {
      console.error('❌ [SW] Error during activation:', error);
    })
  );
});

// Don't claim clients immediately - wait for user confirmation
// clientsClaim(); // Removed for manual update control

// API cache with NetworkFirst strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      {
        cacheableResponse: {
          statuses: [0, 200]
        },
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5 // 5 minutes
        }
      }
    ]
  })
);

// Google Fonts cache with CacheFirst strategy
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      {
        cacheableResponse: {
          statuses: [0, 200]
        },
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        }
      }
    ]
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      {
        cacheableResponse: {
          statuses: [0, 200]
        },
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        }
      }
    ]
  })
);

// Images cache with CacheFirst strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      {
        cacheableResponse: {
          statuses: [0, 200]
        },
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        }
      }
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
  console.error('❌ [SW] Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise
  });
  
  // Try to notify clients about the rejection
  self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_ERROR',
        error: {
          message: 'Unhandled promise rejection',
          reason: event.reason?.toString() || 'Unknown'
        }
      });
    });
  }).catch(err => {
    console.error('❌ [SW] Failed to notify clients about rejection:', err);
  });
});

console.log('✅ [SW] Service Worker script loaded successfully');


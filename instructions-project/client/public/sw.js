// Custom Service Worker for Background Sync
// This file is used with injectManifest from VitePWA

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

// Service Worker installation
self.addEventListener('install', (event) => {
  console.log('📦 [SW] Installing service worker...');
  self.skipWaiting();
});

// Service Worker activation
self.addEventListener('activate', (event) => {
  console.log('✅ [SW] Service Worker activating...');
  cleanupOutdatedCaches();
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('✅ [SW] Service Worker ready');
    })
  );
});

// Precaching assets - manifest is injected by VitePWA during build
precacheAndRoute(self.__WB_MANIFEST || []);

// Auto-update behavior: claim clients immediately and skip waiting
clientsClaim();

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
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
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


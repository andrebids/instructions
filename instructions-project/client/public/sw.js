// Service Worker customizado para Background Sync
// Este arquivo será usado com injectManifest do VitePWA

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

// Precaching de assets
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache de API com NetworkFirst
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
  })
);

// Cache de imagens com CacheFirst
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
  })
);

// Handler para Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag.startsWith('sync-project-')) {
    const projectId = event.tag.replace('sync-project-', '');
    console.log(`🔄 [SW] Background Sync iniciado para projeto ${projectId}`);
    
    event.waitUntil(
      syncProjectData(projectId)
    );
  }
});

// Função para sincronizar dados do projeto
async function syncProjectData(projectId) {
  try {
    // Ler dados do IndexedDB (via mensagem para a página)
    const clients = await self.clients.matchAll();
    
    if (clients.length > 0) {
      // Enviar mensagem para a página para sincronizar
      clients[0].postMessage({
        type: 'SYNC_PROJECT',
        projectId: projectId
      });
    }
    
    console.log(`✅ [SW] Sync tag processada para projeto ${projectId}`);
  } catch (error) {
    console.error(`❌ [SW] Erro ao processar sync para projeto ${projectId}:`, error);
    throw error; // Re-throw para que o browser tente novamente
  }
}

// Listener para mensagens da página
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


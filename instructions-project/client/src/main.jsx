import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HeroUIProvider } from '@heroui/react'
import { ThemeProvider } from './components/features/ThemeProvider'
import { ShopProvider } from './context/ShopContext'
import { UserProvider } from './context/UserContext'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { setupNotificationClickListener } from './services/pushNotifications'
import { isBackgroundSyncAvailable } from './services/backgroundSync'
import './i18n' // Inicializar i18next

// Configurar Iconify para usar proxy do servidor (resolve problemas CORS)
// IMPORTANTE: Configuração executada imediatamente para garantir que esteja pronta antes dos componentes
if (typeof window !== 'undefined') {
  // Interceptar requisições fetch do Iconify para redirecionar ao proxy
  // Isso garante que TODAS as requisições do Iconify passem pelo nosso proxy
  const originalFetch = window.fetch;
  const iconifyAPIs = [
    'https://api.iconify.design',
    'https://api.simplesvg.com',
    'https://api.unisvg.com'
  ];
  
  // Construir URL do proxy
  const isDev = import.meta.env.DEV;
  const proxyBaseUrl = isDev 
    ? 'http://localhost:5000/api/icons'
    : (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/api$/, '') + '/api/icons';
  
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : input?.url || '');
    
    // NÃO interceptar requisições internas (Vite, localhost, etc)
    // Apenas interceptar requisições HTTPS para as APIs externas do Iconify
    if (!url || typeof url !== 'string') {
      return originalFetch.call(this, input, init);
    }
    
    // Ignorar requisições locais, relativas, ou do Vite
    if (url.startsWith('/') || 
        url.startsWith('http://localhost') || 
        url.startsWith('http://127.0.0.1') ||
        url.startsWith('ws://') ||
        url.startsWith('wss://') ||
        url.includes('@vite') ||
        url.includes('@react-refresh') ||
        url.includes('node_modules') ||
        !url.startsWith('https://')) {
      return originalFetch.call(this, input, init);
    }
    
    // Verificar se é uma requisição para as APIs do Iconify
    const isIconifyRequest = iconifyAPIs.some(api => url.startsWith(api));
    
    if (isIconifyRequest) {
      // Extrair o path após o domínio da API
      const apiMatch = iconifyAPIs.find(api => url.startsWith(api));
      if (apiMatch) {
        const path = url.substring(apiMatch.length);
        const proxyUrl = proxyBaseUrl + path;
        
        console.log('🔄 [Icon Proxy] Interceptando requisição:', url);
        console.log('🔄 [Icon Proxy] Redirecionando para:', proxyUrl);
        
        // Fazer requisição para o proxy em vez da API externa
        return originalFetch.call(this, proxyUrl, init);
      }
    }
    
    // Para outras requisições, usar fetch original
    return originalFetch.call(this, input, init);
  };
  
  console.log('✅ [Main] Interceptação de fetch configurada para Iconify');
  console.log('✅ [Main] Proxy URL:', proxyBaseUrl);
  
  // Também configurar addAPIProvider como fallback
  (async () => {
    try {
      const iconifyModule = await import('@iconify/react');
      const { addAPIProvider } = iconifyModule;
      
      // Configurar providers com URL do proxy
      const providers = ['iconify', 'simplesvg', 'unisvg'];
      providers.forEach(provider => {
        try {
          addAPIProvider(provider, {
            resources: [proxyBaseUrl],
          });
          console.log(`✅ [Main] Provider '${provider}' configurado com proxy:`, proxyBaseUrl);
        } catch (providerError) {
          console.warn(`⚠️ [Main] Erro ao configurar provider '${provider}':`, providerError.message);
        }
      });
    } catch (error) {
      console.warn('⚠️ [Main] Erro ao configurar addAPIProvider (interceptação de fetch ativa):', error.message);
    }
  })();
}

const useAuthJs = import.meta.env.VITE_USE_AUTH_JS === 'true'

// Register service worker with prompt mode (no auto-update)
// Service Worker está habilitado APENAS em produção
// Em desenvolvimento, desabilitamos para evitar erros com dev-sw.js
// O HMR do Vite funciona independentemente do Service Worker
// Seguindo a documentação do vite-plugin-pwa: https://vite-pwa-org.netlify.app/frameworks/react.html
let updateSW = null;

const isDev = import.meta.env.DEV;

// Só registrar Service Worker em produção
if ('serviceWorker' in navigator && !isDev) {
  console.log(`🔧 [Main] Registering Service Worker in production mode...`);
  console.log(`📋 [Main] Environment: ${import.meta.env.MODE}`);
  console.log(`📋 [Main] Service Worker URL: ${window.location.origin}/sw.js`);
  console.log(`📋 [Main] Navigator serviceWorker available:`, 'serviceWorker' in navigator);
  
  // Diagnostic: Tentar buscar o Service Worker para verificar se está acessível
  fetch(`${window.location.origin}/sw.js`)
    .then(response => {
      if (response.ok) {
        return response.text();
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    })
    .then(text => {
      console.log('✅ [Main] Service Worker file is accessible');
      console.log('📋 [Main] SW file size:', text.length, 'bytes');
      console.log('📋 [Main] SW file starts with:', text.substring(0, 300));
      
      // Verificar se contém imports do Workbox
      if (text.includes('workbox-precaching') || text.includes('cleanupOutdatedCaches')) {
        console.log('✅ [Main] SW file contains Workbox imports');
      } else {
        console.warn('⚠️ [Main] SW file does NOT contain Workbox imports - this may be the problem!');
      }
      
      // Verificar se contém o manifest (importante: se contém __WB_MANIFEST, não foi processado)
      if (text.includes('__WB_MANIFEST') && !text.includes('self.__WB_MANIFEST = [')) {
        console.warn('⚠️ [Main] SW file contains __WB_MANIFEST PLACEHOLDER - manifest was NOT injected by VitePWA!');
        console.warn('⚠️ [Main] This means the build did not process the Service Worker correctly');
        console.warn('⚠️ [Main] The SW file should contain: self.__WB_MANIFEST = [array of entries]');
      } else if (text.includes('self.__WB_MANIFEST = [')) {
        console.log('✅ [Main] SW file contains injected manifest (self.__WB_MANIFEST = [...])');
        // Tentar extrair uma amostra do manifest
        const manifestMatch = text.match(/self\.__WB_MANIFEST\s*=\s*\[(.*?)\]/s);
        if (manifestMatch) {
          console.log('📋 [Main] Manifest found in SW file');
        }
      } else if (text.includes('self.__WB_MANIFEST')) {
        console.log('✅ [Main] SW file contains self.__WB_MANIFEST reference');
      } else {
        console.warn('⚠️ [Main] SW file does NOT contain manifest - may not be processed by VitePWA');
      }
      
      // Verificar se há erros de sintaxe óbvios
      if (text.includes('import(') && !text.includes('import ')) {
        console.warn('⚠️ [Main] SW file may have dynamic imports which might cause issues');
      }
      
      // Verificar se há IIFE ou outros wrappers que possam causar problemas
      if (text.trim().startsWith('(function')) {
        console.warn('⚠️ [Main] SW file starts with IIFE - this might cause issues with ES modules');
      }
    })
    .catch(error => {
      console.error('❌ [Main] Failed to fetch Service Worker file:', error);
      console.error('❌ [Main] This may indicate the SW file is not being served correctly');
    });
  
  // Store updateSW function globally so UpdateNotification can use it
  try {
    updateSW = registerSW({
    immediate: false, // Don't update immediately - wait for user confirmation
    onOfflineReady() {
      console.log('✅ [Main] App ready to work offline');
      // Dispatch custom event to notify OfflineReadyNotification component
      // The component will show a prompt with "OK" button
      window.dispatchEvent(new CustomEvent('sw-offline-ready'));
    },
    onNeedRefresh() {
      // This is called when a new service worker is available
      // The UpdateNotification component will detect this and show the prompt
      // with "Refresh" and "Cancel" buttons
      console.log('🔄 [Main] New content available - UpdateNotification will show prompt');
      // Dispatch custom event to notify UpdateNotification component
      window.dispatchEvent(new CustomEvent('sw-update-available'));
    },
    onRegistered(registration) {
      console.log('✅ [Main] Service Worker registered successfully');
      console.log('📋 [Main] Registration object:', {
        scope: registration.scope,
        active: registration.active?.scriptURL || 'none',
        installing: registration.installing?.scriptURL || 'none',
        waiting: registration.waiting?.scriptURL || 'none',
        updateViaCache: registration.updateViaCache
      });
      
      // Monitor service worker state changes
      if (registration.installing) {
        console.log('📦 [Main] Service Worker installing...');
        registration.installing.addEventListener('statechange', (event) => {
          console.log(`📦 [Main] SW state changed to: ${event.target.state}`);
          if (event.target.state === 'installed') {
            console.log('✅ [Main] Service Worker installed successfully');
          }
        });
      }
      
      if (registration.waiting) {
        console.log('⏳ [Main] Service Worker waiting for activation');
      }
      
      if (registration.active) {
        console.log('✅ [Main] Service Worker is active');
      }
      
      // Check Background Sync availability
      try {
        isBackgroundSyncAvailable();
        console.log('✅ [Main] Background Sync availability checked');
      } catch (error) {
        console.error('❌ [Main] Error checking Background Sync:', error);
      }
      
      // Setup push notification click listener when SW is ready
      try {
        setupNotificationClickListener();
        console.log('✅ [Main] Push notification click listener setup');
      } catch (error) {
        console.error('❌ [Main] Error setting up push notification listener:', error);
      }
      
      // Listener for messages from service worker (Background Sync and Updates)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', async (event) => {
          console.log('📨 [Main] Message received from Service Worker:', event.data);
          
          // Handle Service Worker errors
          if (event.data && event.data.type === 'SW_ERROR') {
            console.error('❌ [Main] Service Worker reported an error:', event.data.error);
            return;
          }
          
          // Handle Background Sync
          if (event.data && event.data.type === 'SYNC_PROJECT') {
            const { projectId } = event.data;
            try {
              const { syncProject } = await import('./services/backgroundSync.js');
              await syncProject(projectId);
            } catch (error) {
              console.error(`❌ [Main] Error syncing project ${projectId}:`, error);
            }
          }
        });
        console.log('✅ [Main] Message listener from Service Worker registered');
      }
    },
    onRegisterError(error) {
      console.error('❌ [Main] Service Worker registration error:', error);
      console.error('❌ [Main] Error type:', error?.constructor?.name);
      console.error('❌ [Main] Error message:', error?.message);
      console.error('❌ [Main] Error stack:', error?.stack);
      console.error('❌ [Main] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      // Tentar obter mais informações sobre o erro
      if (error?.message?.includes('threw an exception')) {
        console.error('❌ [Main] Service Worker script evaluation failed');
        console.error('❌ [Main] This usually means there is a syntax error or import issue in sw.js');
        console.error('❌ [Main] Check the Service Worker script at:', window.location.origin + '/sw.js');
      }
    }
    });
    
    console.log('✅ [Main] registerSW called successfully');
    console.log('📋 [Main] updateSW function:', typeof updateSW);
    
    // Make updateSW available globally for UpdateNotification component
    window.updateSW = updateSW;
    console.log('✅ [Main] updateSW made available globally');
  } catch (error) {
    console.error('❌ [Main] Error calling registerSW:', error);
    console.error('❌ [Main] Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
  }
} else if (isDev) {
  console.log('ℹ️ [Main] Service Worker desabilitado em desenvolvimento (HMR funciona sem ele)');
} else {
  console.warn('⚠️ [Main] Service Worker API not available in this browser');
}

const rootElement = document.getElementById('root')

// Componente raiz usando Auth.js
function RootApp() {
  if (!useAuthJs) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Erro de Configuração</h1>
        <p>Auth.js não está ativo. Configure VITE_USE_AUTH_JS=true</p>
      </div>
    );
  }

  console.log('✅ Auth.js está ativo');
  return (
    <AuthProvider>
      <HeroUIProvider>
        <ThemeProvider>
          <ShopProvider>
            <UserProvider>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <App />
              </BrowserRouter>
            </UserProvider>
          </ShopProvider>
        </ThemeProvider>
      </HeroUIProvider>
    </AuthProvider>
  )
}

createRoot(rootElement).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
)

import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HeroUIProvider } from '@heroui/react'
import { ThemeProvider } from './components/features/ThemeProvider'
import { ShopProvider } from './context/ShopContext'
import { UserProvider } from './context/UserContext'
import App from './App'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { registerSW } from 'virtual:pwa-register'
import { setupNotificationClickListener } from './services/pushNotifications'
import { isBackgroundSyncAvailable } from './services/backgroundSync'
import './i18n' // Inicializar i18next

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

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
      console.log('📋 [Main] SW file starts with:', text.substring(0, 200));
      // Verificar se contém imports do Workbox
      if (text.includes('workbox-precaching') || text.includes('cleanupOutdatedCaches')) {
        console.log('✅ [Main] SW file contains Workbox imports');
      } else {
        console.warn('⚠️ [Main] SW file does NOT contain Workbox imports - this may be the problem!');
      }
      // Verificar se contém o manifest
      if (text.includes('__WB_MANIFEST')) {
        console.log('✅ [Main] SW file contains __WB_MANIFEST placeholder');
      } else if (text.includes('self.__WB_MANIFEST')) {
        console.log('✅ [Main] SW file contains self.__WB_MANIFEST');
      } else {
        console.warn('⚠️ [Main] SW file does NOT contain manifest - may not be processed by VitePWA');
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
createRoot(rootElement).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
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
    </ClerkProvider>
  </React.StrictMode>
)

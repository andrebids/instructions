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
  
  // Store updateSW function globally so UpdateNotification can use it
  updateSW = registerSW({
    immediate: false, // Don't update immediately - wait for user confirmation
    onOfflineReady() {
      console.log('✅ [Main] App ready to work offline');
      // You can show a notification here if needed
    },
    onNeedRefresh() {
      // This is called when a new service worker is available
      // The UpdateNotification component will detect this and show the prompt
      console.log('🔄 [Main] New content available - UpdateNotification will show prompt');
      // Dispatch custom event to notify UpdateNotification component
      window.dispatchEvent(new CustomEvent('sw-update-available'));
    },
    onRegistered(registration) {
      console.log('✅ [Main] Service Worker registered successfully:', registration);
      console.log('📋 [Main] Service Worker scope:', registration.scope);
      console.log('📋 [Main] Service Worker active:', registration.active?.scriptURL);
      
      // Check Background Sync availability
      isBackgroundSyncAvailable();
      
      // Setup push notification click listener when SW is ready
      setupNotificationClickListener()
      
      // Listener for messages from service worker (Background Sync and Updates)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', async (event) => {
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
      }
    },
    onRegisterError(error) {
      console.error('❌ [Main] Service Worker registration error:', error);
    }
  });
  
  // Make updateSW available globally for UpdateNotification component
  window.updateSW = updateSW;
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

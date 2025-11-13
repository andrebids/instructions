import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HeroUIProvider } from '@heroui/react'
import { ThemeProvider } from './components/ThemeProvider'
import { ShopProvider } from './context/ShopContext'
import { UserProvider } from './context/UserContext'
import App from './App'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { registerSW } from 'virtual:pwa-register'
import { setupNotificationClickListener } from './services/pushNotifications'
import { isBackgroundSyncAvailable } from './services/backgroundSync'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

// Registar service worker com auto-update
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onOfflineReady() {
      console.log('✅ [Main] App ready to work offline');
    },
    onNeedRefresh() {
      // Com autoUpdate, o reload acontece automaticamente
      console.log('🔄 [Main] New content available, reloading...');
    },
    onRegistered(registration) {
      console.log('✅ [Main] Service Worker registered');
      
      // Verificar Background Sync (a função já faz o log apropriado se necessário)
      isBackgroundSyncAvailable();
      
      // Configurar listener para notificações push quando SW estiver pronto
      setupNotificationClickListener()
      
      // Listener para mensagens do service worker (Background Sync)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', async (event) => {
          if (event.data && event.data.type === 'SYNC_PROJECT') {
            const { projectId } = event.data;
            try {
              const { syncProject } = await import('./services/backgroundSync.js');
              await syncProject(projectId);
            } catch (error) {
              console.error(`❌ [Main] Erro ao sincronizar projeto ${projectId}:`, error);
            }
          }
        });
      }
    },
    onRegisterError(error) {
      console.error('❌ [Main] Service Worker registration error:', error);
    }
  });
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



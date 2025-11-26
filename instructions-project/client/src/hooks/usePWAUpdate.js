import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage PWA update notifications
 * Integrates with registerSW from vite-plugin-pwa
 * Shows notification banner when update is available
 * Follows vite-plugin-pwa documentation: https://vite-pwa-org.netlify.app/frameworks/react.html
 */
export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Function to check for updates (movida para antes do useEffect que a usa)
  const checkForUpdatesRef = useRef(null);
  
  const checkForUpdates = useCallback(async (reg) => {
    try {
      // Force update check (bypasses browser cache)
      await reg.update();
      
      // Check if there's a waiting service worker
      if (reg.waiting) {
        setUpdateAvailable(true);
      }
      
      // In dev mode, check more frequently for changes
      if (import.meta.env.DEV) {
        // Check every 30 seconds in dev mode
        setTimeout(() => {
          if (checkForUpdatesRef.current) {
            checkForUpdatesRef.current(reg);
          }
        }, 30000);
      }
    } catch (error) {
      console.error('❌ [PWA Update] Error checking for updates:', error);
    }
  }, []);
  
  // Atualizar ref quando checkForUpdates mudar
  useEffect(() => {
    checkForUpdatesRef.current = checkForUpdates;
  }, [checkForUpdates]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Listen for custom event from main.jsx when onNeedRefresh is called
    const handleUpdateAvailable = () => {
      console.log('🔄 [PWA Update] Update available event received');
      setUpdateAvailable(true);
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    // Get existing service worker registration
    navigator.serviceWorker.ready.then((reg) => {
      console.log('✅ [PWA Update] Service Worker ready');
      setRegistration(reg);
      
      // Check for updates when app is opened
      if (checkForUpdatesRef.current) {
        checkForUpdatesRef.current(reg);
      }
      
      // Listen for updatefound event
      reg.addEventListener('updatefound', () => {
        console.log('🔄 [PWA Update] Update found');
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is installed and waiting
              console.log('🔄 [PWA Update] New service worker installed, waiting for activation');
              setUpdateAvailable(true);
            }
          });
        }
      });

      // Check if there's already a waiting service worker
      if (reg.waiting) {
        console.log('🔄 [PWA Update] Service worker waiting for activation');
        setUpdateAvailable(true);
      }
    }).catch((error) => {
      console.error('❌ [PWA Update] Error getting service worker registration:', error);
    });

    // Listen for messages from service worker (Background Sync)
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'SYNC_PROJECT') {
        // This is handled in main.jsx
        return;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [checkForUpdates]);

  // Function to update now
  // Following vite-plugin-pwa documentation: call updateSW() when user clicks refresh
  // When the user clicks the "refresh" button when onNeedRefresh called, then call updateSW() function;
  // the page will reload and the up-to-date content will be served.
  const updateNow = useCallback(() => {
    setIsUpdating(true);
    
    // Use updateSW from registerSW if available (recommended way)
    // This is the function returned by registerSW() and should be called when user confirms update
    if (window.updateSW && typeof window.updateSW === 'function') {
      console.log('🔄 [PWA Update] Calling updateSW() from registerSW');
      // Call updateSW() - this will reload the page and serve the up-to-date content
      window.updateSW();
      // Note: updateSW() will handle the page reload, so we don't need to do it manually
      return;
    }
    
    // Fallback: manual update if updateSW is not available
    if (!registration || !registration.waiting) {
      console.warn('⚠️ [PWA Update] No waiting service worker found');
      setIsUpdating(false);
      return;
    }

    // Tell service worker to skip waiting
    if (registration.waiting) {
      registration.waiting.postMessage({
        type: 'SKIP_WAITING'
      });
    }
    
    // Reload after a short delay to allow SW to activate
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, [registration]);

  // Function to dismiss notification
  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return {
    updateAvailable,
    isUpdating,
    updateNow,
    dismissUpdate
  };
}


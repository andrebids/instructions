import { useState, useEffect, useCallback } from 'react';

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

  // Function to check for updates
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
        setTimeout(() => checkForUpdates(reg), 30000);
      }
    } catch (error) {
      console.error('❌ [PWA Update] Error checking for updates:', error);
    }
  }, []);

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
      checkForUpdates(reg);
      
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
  const updateNow = useCallback(() => {
    setIsUpdating(true);
    
    // Use updateSW from registerSW if available (recommended way)
    if (window.updateSW && typeof window.updateSW === 'function') {
      console.log('🔄 [PWA Update] Calling updateSW() from registerSW');
      window.updateSW(true); // true = reload immediately
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


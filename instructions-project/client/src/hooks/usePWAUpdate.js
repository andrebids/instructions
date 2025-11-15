import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage PWA update notifications
 * Checks for updates only when app is opened
 * Shows notification banner when update is available
 * Note: Service worker registration is handled in main.jsx
 */
export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Function to check for updates
  const checkForUpdates = useCallback(async (reg) => {
    try {
      await reg.update();
      
      // Check if there's a waiting service worker
      if (reg.waiting) {
        setUpdateAvailable(true);
      }
    } catch (error) {
      console.error('❌ [PWA Update] Error checking for updates:', error);
    }
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

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

    // Listen for messages from service worker
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        console.log('🔄 [PWA Update] Update available message received');
        setUpdateAvailable(true);
      }
      if (event.data && event.data.type === 'UPDATE_ACTIVATED') {
        console.log('✅ [PWA Update] Update activated, reloading...');
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [checkForUpdates]);

  // Function to update now
  const updateNow = useCallback(() => {
    if (!registration || !registration.waiting) {
      console.warn('⚠️ [PWA Update] No waiting service worker found');
      return;
    }

    setIsUpdating(true);
    
    // Tell service worker to skip waiting
    if (registration.waiting) {
      registration.waiting.postMessage({
        type: 'SKIP_WAITING'
      });
    }
    
    // Also try sending to controller if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
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


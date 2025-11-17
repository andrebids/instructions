import React, { useState, useEffect } from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

/**
 * Offline Ready Notification Component
 * Shows a banner when the PWA is ready to work offline
 * User can click "OK" to dismiss the notification
 * Following vite-plugin-pwa documentation: https://vite-pwa-org.netlify.app/frameworks/react.html
 */
export default function OfflineReadyNotification() {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Listen for custom event from main.jsx when onOfflineReady is called
    const handleOfflineReady = () => {
      console.log('✅ [OfflineReady] App ready to work offline event received');
      setShowNotification(true);
    };

    window.addEventListener('sw-offline-ready', handleOfflineReady);

    return () => {
      window.removeEventListener('sw-offline-ready', handleOfflineReady);
    };
  }, []);

  // Function to dismiss notification
  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none">
      <div className="bg-background border border-default-200 rounded-lg shadow-lg p-4 max-w-md w-full pointer-events-auto flex items-center gap-3 animate-in slide-in-from-top-5">
        <div className="flex-shrink-0">
          <Icon 
            icon="mdi:wifi-off" 
            className="text-2xl text-success" 
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            App Ready to Work Offline
          </p>
          <p className="text-xs text-default-500 mt-0.5">
            This app is now ready to work offline. You can continue using it even without an internet connection.
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button
            size="sm"
            color="primary"
            onPress={handleDismiss}
            className="text-xs"
            aria-label="Dismiss offline ready notification"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}


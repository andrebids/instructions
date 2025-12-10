import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { usePWAUpdate } from '../../hooks/usePWAUpdate';

/**
 * Update Notification Component
 * Shows a banner when a PWA update is available
 * User can choose to update now or later
 */
export default function UpdateNotification() {
  const { updateAvailable, isUpdating, updateNow, dismissUpdate } = usePWAUpdate();

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none">
      <div className="bg-background border border-default-200 rounded-lg shadow-lg p-4 max-w-md w-full pointer-events-auto flex items-center gap-3 animate-in slide-in-from-top-5">
        <div className="flex-shrink-0">
          <Icon 
            icon="mdi:update" 
            className="text-2xl text-primary" 
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Update Available
          </p>
          <p className="text-xs text-default-500 mt-0.5">
            A new version is available. Update now to get the latest features.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="flat"
            onPress={dismissUpdate}
            className="text-xs"
            aria-label="Dismiss update notification"
          >
            Later
          </Button>
          <Button
            size="sm"
            onPress={updateNow}
            isLoading={isUpdating}
            className="text-xs font-medium shadow-lg shadow-blue-500/20 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-500 dark:hover:bg-blue-400 hover:scale-[1.02] transition-all duration-300"
            aria-label="Update now"
          >
            {isUpdating ? 'Updating...' : 'Update Now'}
          </Button>
        </div>
      </div>
    </div>
  );
}


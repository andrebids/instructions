import React, { useState, useEffect } from 'react';
import { Chip, Spinner, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSyncStatus, isBackgroundSyncAvailable } from '../services/backgroundSync';

/**
 * SyncStatus Component
 * Displays offline/online status and sync progress with animations
 */
export function SyncStatus({ projectId, className = '' }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({ available: false, pending: false });
  const [syncState, setSyncState] = useState('idle'); // idle, syncing, completed, error
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [projectId]);

  // Monitor sync status
  useEffect(() => {
    if (!projectId) return;
    
    const checkSyncStatus = async () => {
      const status = await getSyncStatus(projectId);
      setSyncStatus(status);
      
      if (status.pending && syncState !== 'syncing') {
        setSyncState('syncing');
      }
    };

    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [projectId, syncState]);

  // Listen for sync status messages from service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'SYNC_STATUS') {
        const { projectId: msgProjectId, status, error } = event.data;
        
        if (msgProjectId === projectId) {
          setSyncState(status);
          
          if (status === 'syncing') {
            setNotificationMessage('Syncing changes...');
            setShowNotification(true);
          } else if (status === 'completed') {
            setNotificationMessage('Changes synced successfully');
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
            setTimeout(() => setSyncState('idle'), 3500);
          } else if (status === 'error' || status === 'failed') {
            setNotificationMessage(error || 'Sync failed. Will retry automatically.');
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 5000);
          }
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [projectId, syncState]);

  // Show notification when going online with pending sync
  useEffect(() => {
    if (isOnline && syncStatus.pending && syncState === 'idle') {
      setSyncState('syncing');
      setNotificationMessage('Reconnected. Syncing pending changes...');
      setShowNotification(true);
    }
  }, [isOnline, syncStatus.pending, syncState]);

  if (!isBackgroundSyncAvailable()) {
    return null;
  }

  const getStatusIcon = () => {
    if (!isOnline) {
      return 'lucide:wifi-off';
    }
    
    switch (syncState) {
      case 'syncing':
        return 'lucide:refresh-cw';
      case 'completed':
        return 'lucide:check-circle';
      case 'error':
      case 'failed':
        return 'lucide:alert-circle';
      default:
        return 'lucide:wifi';
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'danger';
    
    switch (syncState) {
      case 'syncing':
        return 'warning';
      case 'completed':
        return 'success';
      case 'error':
      case 'failed':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    
    switch (syncState) {
      case 'syncing':
        return 'Syncing...';
      case 'completed':
        return 'Synced';
      case 'error':
      case 'failed':
        return 'Sync Error';
      default:
        return syncStatus.pending ? 'Pending' : 'Online';
    }
  };

  return (
    <>
      <Tooltip content={getStatusText()} placement="bottom">
        <Chip
          color={getStatusColor()}
          variant="flat"
          size="sm"
          className={`flex items-center gap-1.5 ${className}`}
          startContent={
            syncState === 'syncing' ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Icon icon={getStatusIcon()} className="text-sm" />
              </motion.div>
            ) : (
              <Icon icon={getStatusIcon()} className="text-sm" />
            )
          }
        >
          {getStatusText()}
        </Chip>
      </Tooltip>

      {/* Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 right-4 z-50 max-w-sm"
          >
            <div
              className={`p-4 rounded-lg shadow-lg border ${
                syncState === 'completed'
                  ? 'bg-success-50 border-success-200 text-success-800'
                  : syncState === 'error' || syncState === 'failed'
                  ? 'bg-danger-50 border-danger-200 text-danger-800'
                  : 'bg-warning-50 border-warning-200 text-warning-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {syncState === 'syncing' && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Spinner size="sm" color="warning" />
                  </motion.div>
                )}
                {syncState === 'completed' && (
                  <Icon icon="lucide:check-circle" className="text-lg" />
                )}
                {(syncState === 'error' || syncState === 'failed') && (
                  <Icon icon="lucide:alert-circle" className="text-lg" />
                )}
                <span className="text-sm font-medium">{notificationMessage}</span>
                <button
                  onClick={() => setShowNotification(false)}
                  className="ml-auto text-current opacity-60 hover:opacity-100"
                  aria-label="Close notification"
                >
                  <Icon icon="lucide:x" className="text-sm" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * GlobalSyncStatus Component
 * Shows global sync status in the header
 */
export function GlobalSyncStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasPendingSync, setHasPendingSync] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending syncs
    const checkPendingSyncs = async () => {
      if (!isBackgroundSyncAvailable()) return;
      
      try {
        const registration = await navigator.serviceWorker.ready;
        const tags = await registration.sync.getTags();
        setHasPendingSync(tags.length > 0);
      } catch (error) {
        console.error('❌ [GlobalSyncStatus] Error checking pending syncs:', error);
      }
    };

    checkPendingSyncs();
    const interval = setInterval(checkPendingSyncs, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (!isBackgroundSyncAvailable()) {
    return null;
  }

  return (
    <Tooltip
      content={
        !isOnline
          ? 'You are offline. Changes will sync when you reconnect.'
          : hasPendingSync
          ? 'You have pending changes waiting to sync.'
          : 'All changes are synced.'
      }
      placement="bottom"
    >
      <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-default-100/50 transition-colors cursor-pointer">
        {!isOnline ? (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Icon icon="lucide:wifi-off" className="text-lg text-danger" />
          </motion.div>
        ) : hasPendingSync ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Icon icon="lucide:refresh-cw" className="text-lg text-warning" />
          </motion.div>
        ) : (
          <Icon icon="lucide:wifi" className="text-lg text-success" />
        )}
      </div>
    </Tooltip>
  );
}


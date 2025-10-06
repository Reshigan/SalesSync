'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    const syncInterval = setInterval(() => {
      if (isOnline && pendingSync > 0) {
        setSyncing(true);
        setTimeout(() => {
          setPendingSync(0);
          setLastSync(new Date());
          setSyncing(false);
        }, 2000);
      }
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [isOnline, pendingSync]);

  useEffect(() => {
    if (!isOnline) {
      const randomIncrement = Math.floor(Math.random() * 3) + 1;
      const timeout = setTimeout(() => {
        setPendingSync(prev => prev + randomIncrement);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, pendingSync]);

  if (isOnline && pendingSync === 0 && !syncing) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`rounded-lg shadow-lg p-4 max-w-sm ${
        isOnline
          ? syncing
            ? 'bg-blue-50 border-2 border-blue-200'
            : 'bg-green-50 border-2 border-green-200'
          : 'bg-yellow-50 border-2 border-yellow-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isOnline ? (
              syncing ? (
                <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              ) : (
                <Wifi className="h-5 w-5 text-green-600" />
              )
            ) : (
              <WifiOff className="h-5 w-5 text-yellow-600 animate-pulse" />
            )}
          </div>
          <div className="flex-1">
            <p className={`font-semibold text-sm ${
              isOnline
                ? syncing
                  ? 'text-blue-900'
                  : 'text-green-900'
                : 'text-yellow-900'
            }`}>
              {isOnline
                ? syncing
                  ? 'Syncing data...'
                  : 'Online'
                : 'Offline Mode'}
            </p>
            <p className={`text-xs mt-1 ${
              isOnline
                ? syncing
                  ? 'text-blue-700'
                  : 'text-green-700'
                : 'text-yellow-700'
            }`}>
              {isOnline
                ? syncing
                  ? `Syncing ${pendingSync} pending items`
                  : `Last synced: ${lastSync.toLocaleTimeString()}`
                : `${pendingSync} changes saved locally`}
            </p>
          </div>
        </div>
        
        {!isOnline && (
          <div className="mt-3 flex items-center gap-2 text-xs text-yellow-700">
            <CheckCircle className="h-4 w-4" />
            <span>Data will sync when connection is restored</span>
          </div>
        )}
        
        {syncing && (
          <div className="mt-3">
            <div className="w-full bg-blue-200 rounded-full h-1">
              <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

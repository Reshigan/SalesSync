import { useState, useEffect } from 'react';

/**
 * Custom hook to detect online/offline status
 * Returns true if online, false if offline
 */
export const useOnlineStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 Network: Online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('🔴 Network: Offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

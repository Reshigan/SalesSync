import React from 'react';
import { Bell, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useWebSocket, useRealTimeNotifications } from '@/lib/websocket';

export const ConnectionStatus: React.FC = () => {
  const { isConnected, connectionStatus } = useWebSocket();
  
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      {getStatusIcon()}
      <span className="text-sm text-gray-600 capitalize">{connectionStatus}</span>
    </div>
  );
};

export const NotificationBell: React.FC = () => {
  const { notifications, clearNotifications } = useRealTimeNotifications();
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.timestamp} className="p-4 border-b hover:bg-gray-50">
                  <div className="font-medium">{notification.data.title}</div>
                  <div className="text-sm text-gray-600">{notification.data.message}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
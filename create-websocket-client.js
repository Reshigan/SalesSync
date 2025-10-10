#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔌 Creating WebSocket client for real-time features...\n');

// WebSocket client implementation
const websocketClientContent = `'use client'

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface WebSocketConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (config: WebSocketConfig = {}) => {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:12001/ws',
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = config;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const { token } = useAuthStore();

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    
    setConnectionStatus('connecting');
    
    try {
      const wsUrl = token ? \`\${url}?token=\${token}\` : url;
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
      };
      
      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          reconnectTimeout.current = setTimeout(() => {
            console.log(\`Reconnecting... Attempt \${reconnectAttempts.current}\`);
            connect();
          }, reconnectInterval);
        }
      };
      
      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }
  };

  const disconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [token]);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
    connect,
    disconnect
  };
};

// Real-time notifications hook
export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'notification') {
      setNotifications(prev => [lastMessage, ...prev.slice(0, 49)]); // Keep last 50
    }
  }, [lastMessage]);

  const clearNotifications = () => setNotifications([]);
  const removeNotification = (timestamp: number) => {
    setNotifications(prev => prev.filter(n => n.timestamp !== timestamp));
  };

  return {
    notifications,
    clearNotifications,
    removeNotification
  };
};

// Real-time data sync hook
export const useRealTimeSync = (dataType: string) => {
  const [data, setData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'data_update' && lastMessage.data.type === dataType) {
      setData(lastMessage.data.payload);
      setLastUpdate(lastMessage.timestamp);
    }
  }, [lastMessage, dataType]);

  return {
    data,
    lastUpdate,
    isStale: Date.now() - lastUpdate > 30000 // 30 seconds
  };
};`;

// Real-time components
const realTimeComponentsContent = `import React from 'react';
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
};`;

// Create directories
const libDir = path.join(__dirname, 'frontend/src/lib');
const componentsDir = path.join(__dirname, 'frontend/src/components/ui');

if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

// Write files
fs.writeFileSync(path.join(libDir, 'websocket.ts'), websocketClientContent);
fs.writeFileSync(path.join(componentsDir, 'real-time.tsx'), realTimeComponentsContent);

console.log('✅ Created WebSocket client');
console.log('✅ Created real-time components');
console.log('✅ Created notification system');
console.log('\n🎉 Real-time features implemented!');
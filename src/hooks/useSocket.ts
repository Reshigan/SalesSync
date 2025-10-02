'use client';

import { useEffect, useState, useCallback } from 'react';
import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';

interface SocketHookReturn {
  isConnected: boolean;
  notifications: any[];
  systemAlerts: any[];
  orderUpdates: any[];
  inventoryAlerts: any[];
  salesUpdates: any[];
  locationUpdates: any[];
  chatMessages: any[];
  clearNotifications: () => void;
  clearSystemAlerts: () => void;
  updateLocation: (location: { lat: number; lng: number; address?: string }) => void;
  updateOrderStatus: (orderId: string, status: string) => void;
  sendInventoryAlert: (productId: string, currentStock: number, threshold: number, location: string) => void;
  updateSales: (amount: number, customerId: string) => void;
  sendChatMessage: (message: string, channel: string) => void;
}

export const useSocket = (): SocketHookReturn => {
  const { token, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const [orderUpdates, setOrderUpdates] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [salesUpdates, setSalesUpdates] = useState<any[]>([]);
  const [locationUpdates, setLocationUpdates] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // Connect to socket when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      const socket = socketService.connect(token);
      
      const checkConnection = () => {
        setIsConnected(socketService.isConnected());
      };

      // Check connection status periodically
      const interval = setInterval(checkConnection, 1000);
      checkConnection();

      return () => {
        clearInterval(interval);
      };
    } else {
      socketService.disconnect();
      setIsConnected(false);
    }
  }, [isAuthenticated, token]);

  // Set up event listeners
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      setNotifications(prev => [event.detail, ...prev].slice(0, 50)); // Keep last 50
    };

    const handleSystemAlert = (event: CustomEvent) => {
      setSystemAlerts(prev => [event.detail, ...prev].slice(0, 20)); // Keep last 20
    };

    const handleOrderUpdate = (event: CustomEvent) => {
      setOrderUpdates(prev => [event.detail, ...prev].slice(0, 100)); // Keep last 100
    };

    const handleInventoryAlert = (event: CustomEvent) => {
      setInventoryAlerts(prev => [event.detail, ...prev].slice(0, 50)); // Keep last 50
    };

    const handleSalesUpdate = (event: CustomEvent) => {
      setSalesUpdates(prev => [event.detail, ...prev].slice(0, 100)); // Keep last 100
    };

    const handleLocationUpdate = (event: CustomEvent) => {
      setLocationUpdates(prev => [event.detail, ...prev].slice(0, 50)); // Keep last 50
    };

    const handleChatMessage = (event: CustomEvent) => {
      setChatMessages(prev => [event.detail, ...prev].slice(0, 200)); // Keep last 200
    };

    // Add event listeners
    window.addEventListener('socket:notification', handleNotification as EventListener);
    window.addEventListener('socket:system-alert', handleSystemAlert as EventListener);
    window.addEventListener('socket:order-update', handleOrderUpdate as EventListener);
    window.addEventListener('socket:inventory-alert', handleInventoryAlert as EventListener);
    window.addEventListener('socket:sales-update', handleSalesUpdate as EventListener);
    window.addEventListener('socket:location-update', handleLocationUpdate as EventListener);
    window.addEventListener('socket:chat-message', handleChatMessage as EventListener);

    return () => {
      // Remove event listeners
      window.removeEventListener('socket:notification', handleNotification as EventListener);
      window.removeEventListener('socket:system-alert', handleSystemAlert as EventListener);
      window.removeEventListener('socket:order-update', handleOrderUpdate as EventListener);
      window.removeEventListener('socket:inventory-alert', handleInventoryAlert as EventListener);
      window.removeEventListener('socket:sales-update', handleSalesUpdate as EventListener);
      window.removeEventListener('socket:location-update', handleLocationUpdate as EventListener);
      window.removeEventListener('socket:chat-message', handleChatMessage as EventListener);
    };
  }, []);

  // Request notification permission on first use
  useEffect(() => {
    if (isConnected) {
      socketService.requestNotificationPermission();
    }
  }, [isConnected]);

  // Clear functions
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearSystemAlerts = useCallback(() => {
    setSystemAlerts([]);
  }, []);

  // Socket action functions
  const updateLocation = useCallback((location: { lat: number; lng: number; address?: string }) => {
    socketService.updateLocation(location);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: string) => {
    socketService.updateOrderStatus(orderId, status);
  }, []);

  const sendInventoryAlert = useCallback((productId: string, currentStock: number, threshold: number, location: string) => {
    socketService.sendInventoryAlert(productId, currentStock, threshold, location);
  }, []);

  const updateSales = useCallback((amount: number, customerId: string) => {
    socketService.updateSales(amount, customerId);
  }, []);

  const sendChatMessage = useCallback((message: string, channel: string) => {
    socketService.sendChatMessage(message, channel);
  }, []);

  return {
    isConnected,
    notifications,
    systemAlerts,
    orderUpdates,
    inventoryAlerts,
    salesUpdates,
    locationUpdates,
    chatMessages,
    clearNotifications,
    clearSystemAlerts,
    updateLocation,
    updateOrderStatus,
    sendInventoryAlert,
    updateSales,
    sendChatMessage
  };
};
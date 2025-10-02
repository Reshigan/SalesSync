'use client';

import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    console.log('🔌 Attempting to connect to Socket.IO server:', socketUrl);
    this.socket = io(socketUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventHandlers();
    return this.socket;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.IO server:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      this.handleReconnect();
    });

    // Real-time event handlers
    this.socket.on('notification', (data) => {
      this.handleNotification(data);
    });

    this.socket.on('system:alert', (data) => {
      this.handleSystemAlert(data);
    });

    this.socket.on('order:status:updated', (data) => {
      this.handleOrderUpdate(data);
    });

    this.socket.on('inventory:alert', (data) => {
      this.handleInventoryAlert(data);
    });

    this.socket.on('sales:updated', (data) => {
      this.handleSalesUpdate(data);
    });

    this.socket.on('location:updated', (data) => {
      this.handleLocationUpdate(data);
    });

    this.socket.on('chat:message', (data) => {
      this.handleChatMessage(data);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.socket?.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  private handleNotification(data: any) {
    console.log('🔔 Notification received:', data);
    
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(data.title, {
        body: data.message,
        icon: '/favicon.ico',
        tag: data.id
      });
    }

    // Dispatch custom event for components to listen
    window.dispatchEvent(new CustomEvent('socket:notification', { detail: data }));
  }

  private handleSystemAlert(data: any) {
    console.log('🚨 System alert received:', data);
    window.dispatchEvent(new CustomEvent('socket:system-alert', { detail: data }));
  }

  private handleOrderUpdate(data: any) {
    console.log('📦 Order update received:', data);
    window.dispatchEvent(new CustomEvent('socket:order-update', { detail: data }));
  }

  private handleInventoryAlert(data: any) {
    console.log('📊 Inventory alert received:', data);
    window.dispatchEvent(new CustomEvent('socket:inventory-alert', { detail: data }));
  }

  private handleSalesUpdate(data: any) {
    console.log('💰 Sales update received:', data);
    window.dispatchEvent(new CustomEvent('socket:sales-update', { detail: data }));
  }

  private handleLocationUpdate(data: any) {
    console.log('📍 Location update received:', data);
    window.dispatchEvent(new CustomEvent('socket:location-update', { detail: data }));
  }

  private handleChatMessage(data: any) {
    console.log('💬 Chat message received:', data);
    window.dispatchEvent(new CustomEvent('socket:chat-message', { detail: data }));
  }

  // Public methods for emitting events
  updateLocation(location: { lat: number; lng: number; address?: string }) {
    this.socket?.emit('location:update', { location });
  }

  updateOrderStatus(orderId: string, status: string) {
    this.socket?.emit('order:status', { orderId, status });
  }

  sendInventoryAlert(productId: string, currentStock: number, threshold: number, location: string) {
    this.socket?.emit('inventory:alert', { productId, currentStock, threshold, location });
  }

  updateSales(amount: number, customerId: string) {
    this.socket?.emit('sales:update', { amount, customerId });
  }

  sendChatMessage(message: string, channel: string) {
    this.socket?.emit('chat:message', { message, channel });
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}

export const socketService = new SocketService();
'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  Bell, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  MapPin,
  MessageCircle,
  Wifi,
  WifiOff,
  Send
} from 'lucide-react';

export const RealTimeDemo: React.FC = () => {
  const { token, isAuthenticated, user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [actualToken, setActualToken] = useState<string | null>(null);
  
  // Handle hydration and token retrieval
  useEffect(() => {
    setHydrated(true);
    
    // Get token from multiple sources
    const zustandToken = token;
    const lsToken = localStorage.getItem('accessToken');
    const authStorageData = localStorage.getItem('auth-storage');
    
    let parsedToken = null;
    if (authStorageData) {
      try {
        const parsed = JSON.parse(authStorageData);
        parsedToken = parsed.state?.token;
      } catch (e) {
        console.warn('Failed to parse auth-storage:', e);
      }
    }
    
    const finalToken = zustandToken || lsToken || parsedToken;
    setActualToken(finalToken);
    
    console.log('🔍 RealTimeDemo - Token Resolution:');
    console.log('  - Zustand token:', zustandToken ? `${zustandToken.substring(0, 20)}...` : 'null');
    console.log('  - localStorage accessToken:', lsToken ? `${lsToken.substring(0, 20)}...` : 'null');
    console.log('  - auth-storage token:', parsedToken ? `${parsedToken.substring(0, 20)}...` : 'null');
    console.log('  - Final token:', finalToken ? `${finalToken.substring(0, 20)}...` : 'null');
  }, [token, isAuthenticated, user]);
  
  if (!hydrated) {
    return <div>Loading...</div>;
  }
  
  const {
    isConnected,
    notifications,
    systemAlerts,
    orderUpdates,
    inventoryAlerts,
    salesUpdates,
    locationUpdates,
    chatMessages,
    updateLocation,
    updateOrderStatus,
    sendInventoryAlert,
    updateSales,
    sendChatMessage
  } = useSocket();

  const [testMessage, setTestMessage] = useState('');

  const simulateEvents = async () => {
    try {
      // Simulate different types of events
      const events = [
        {
          endpoint: '/notifications/simulate/order-update',
          data: { orderId: 'ORD-' + Date.now(), status: 'completed' }
        },
        {
          endpoint: '/notifications/simulate/inventory-alert',
          data: { productId: 'PROD-' + Date.now(), currentStock: 3, threshold: 10 }
        },
        {
          endpoint: '/notifications/simulate/sales-update',
          data: { amount: Math.floor(Math.random() * 5000) + 1000, customerId: 'CUST-' + Date.now() }
        }
      ];

      for (const event of events) {
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}${event.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(event.data)
        });
      }
    } catch (error) {
      console.error('Error simulating events:', error);
    }
  };

  const sendTestNotification = async () => {
    try {
      console.log('🔔 Sending test notification...');
      
      // Use the resolved token
      const authToken = actualToken;
      
      console.log('Token from Zustand:', !!token);
      console.log('Token from localStorage:', !!(typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null));
      console.log('Final token available:', !!authToken);
      console.log('Token preview:', authToken ? `${authToken.substring(0, 20)}...` : 'null');
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');
      
      if (!authToken) {
        console.error('❌ No authentication token available');
        alert('No authentication token available. Please login again.');
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          userId: 'user_1', // Demo user ID
          title: 'Test Notification',
          message: 'This is a test notification from the real-time system!',
          type: 'info'
        })
      });
      
      console.log('📡 Response status:', response.status);
      const responseData = await response.json();
      console.log('📡 Response data:', responseData);
      
      if (response.ok) {
        console.log('✅ Test notification sent successfully!');
        alert('Test notification sent successfully!');
      } else {
        console.error('❌ Failed to send notification:', responseData);
        alert(`Failed to send notification: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      alert(`Error sending test notification: ${error.message}`);
    }
  };

  const sendBroadcast = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/notifications/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'System Broadcast',
          message: 'This is a broadcast message to all users in your tenant!',
          type: 'success'
        })
      });
    } catch (error) {
      console.error('Error sending broadcast:', error);
    }
  };

  const sendSystemAlert = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/notifications/alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'System Alert',
          message: 'This is a high priority system alert!',
          severity: 'high'
        })
      });
    } catch (error) {
      console.error('Error sending system alert:', error);
    }
  };

  const handleLocationUpdate = () => {
    // Simulate location update
    const locations = [
      { lat: 40.7128, lng: -74.0060, address: 'New York, NY' },
      { lat: 34.0522, lng: -118.2437, address: 'Los Angeles, CA' },
      { lat: 41.8781, lng: -87.6298, address: 'Chicago, IL' }
    ];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    updateLocation(randomLocation);
  };

  const handleOrderUpdate = () => {
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    updateOrderStatus(`ORD-${Date.now()}`, randomStatus);
  };

  const handleInventoryAlert = () => {
    sendInventoryAlert(
      `PROD-${Date.now()}`,
      Math.floor(Math.random() * 5) + 1,
      10,
      'Main Warehouse'
    );
  };

  const handleSalesUpdate = () => {
    updateSales(
      Math.floor(Math.random() * 5000) + 1000,
      `CUST-${Date.now()}`
    );
  };

  const handleChatMessage = () => {
    if (testMessage.trim()) {
      sendChatMessage(testMessage, 'general');
      setTestMessage('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <Wifi className="w-5 h-5 text-green-500" />
                <span className="text-green-600 font-medium">Connected to Real-time Server</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-500" />
                <span className="text-red-600 font-medium">Disconnected from Real-time Server</span>
              </>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Socket.IO Status
          </div>
          
          {/* Debug Auth Status */}
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <div>Auth Status: {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</div>
            <div>Zustand Token: {token ? `✅ Available (${token.substring(0, 20)}...)` : '❌ Missing'}</div>
            <div>Actual Token: {actualToken ? `✅ Available (${actualToken.substring(0, 20)}...)` : '❌ Missing'}</div>
            <div>User: {user ? `✅ ${user.name} (${user.role})` : '❌ No User'}</div>
          </div>
        </div>
      </Card>

      {/* Test Controls */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Real-time Event Testing</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Button onClick={sendTestNotification} className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Send Test Notification
          </Button>
          
          <Button onClick={sendBroadcast} className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Send Broadcast
          </Button>
          
          <Button onClick={sendSystemAlert} className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Send System Alert
          </Button>
          
          <Button onClick={simulateEvents} className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Simulate Events
          </Button>
          
          <Button onClick={handleLocationUpdate} className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Update Location
          </Button>
          
          <Button onClick={handleOrderUpdate} className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Update Order
          </Button>
        </div>

        {/* Chat Test */}
        <div className="flex gap-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Type a test message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleChatMessage()}
          />
          <Button onClick={handleChatMessage} className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Send Chat
          </Button>
        </div>
      </Card>

      {/* Real-time Data Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Notifications */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-blue-500" />
            <h4 className="font-medium">Notifications</h4>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {notifications.length}
            </span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {notifications.slice(0, 3).map((notif, index) => (
              <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                <div className="font-medium">{notif.title}</div>
                <div className="text-gray-600 text-xs">{notif.message}</div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-sm text-gray-500">No notifications</div>
            )}
          </div>
        </Card>

        {/* System Alerts */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h4 className="font-medium">System Alerts</h4>
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {systemAlerts.length}
            </span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {systemAlerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="text-sm p-2 bg-red-50 rounded">
                <div className="font-medium">{alert.title}</div>
                <div className="text-gray-600 text-xs">{alert.message}</div>
              </div>
            ))}
            {systemAlerts.length === 0 && (
              <div className="text-sm text-gray-500">No alerts</div>
            )}
          </div>
        </Card>

        {/* Order Updates */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-green-500" />
            <h4 className="font-medium">Order Updates</h4>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {orderUpdates.length}
            </span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {orderUpdates.slice(0, 3).map((update, index) => (
              <div key={index} className="text-sm p-2 bg-green-50 rounded">
                <div className="font-medium">{update.orderId}</div>
                <div className="text-gray-600 text-xs capitalize">{update.status}</div>
              </div>
            ))}
            {orderUpdates.length === 0 && (
              <div className="text-sm text-gray-500">No updates</div>
            )}
          </div>
        </Card>

        {/* Sales Updates */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-yellow-500" />
            <h4 className="font-medium">Sales Updates</h4>
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              {salesUpdates.length}
            </span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {salesUpdates.slice(0, 3).map((sale, index) => (
              <div key={index} className="text-sm p-2 bg-yellow-50 rounded">
                <div className="font-medium">${sale.amount}</div>
                <div className="text-gray-600 text-xs">{sale.customerId}</div>
              </div>
            ))}
            {salesUpdates.length === 0 && (
              <div className="text-sm text-gray-500">No sales updates</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
'use client';

import React, { useState } from 'react';
import { Bell, X, AlertTriangle, Info, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const {
    isConnected,
    notifications,
    systemAlerts,
    clearNotifications,
    clearSystemAlerts
  } = useSocket();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'alerts'>('notifications');

  const totalCount = notifications.length + systemAlerts.length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: string | Date) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        
        {/* Connection Status Indicator */}
        <div className="absolute -top-1 -left-1">
          {isConnected ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
        </div>
        
        {/* Notification Count Badge */}
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Notifications</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm">
                    {isConnected ? (
                      <>
                        <Wifi className="w-3 h-3 text-green-500" />
                        <span className="text-green-600">Connected</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3 text-red-500" />
                        <span className="text-red-600">Disconnected</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex mt-3 border-b">
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'notifications'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Notifications ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'alerts'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Alerts ({systemAlerts.length})
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
              {activeTab === 'notifications' && (
                <div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-2 border-b">
                        <button
                          onClick={clearNotifications}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Clear all notifications
                        </button>
                      </div>
                      {notifications.map((notification, index) => (
                        <div key={notification.id || index} className="p-3 border-b hover:bg-gray-50">
                          <div className="flex items-start gap-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatTime(notification.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'alerts' && (
                <div>
                  {systemAlerts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No system alerts</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-2 border-b">
                        <button
                          onClick={clearSystemAlerts}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Clear all alerts
                        </button>
                      </div>
                      {systemAlerts.map((alert, index) => (
                        <div key={alert.id || index} className="p-3 border-b hover:bg-gray-50">
                          <div className="flex items-start gap-3">
                            {getAlertIcon(alert.severity)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {alert.title}
                                </p>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                  alert.severity === 'high' ? 'bg-red-50 text-red-700' :
                                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {alert.severity}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {alert.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatTime(alert.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
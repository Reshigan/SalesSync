'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Bell, Check, X } from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'New Order Received', message: 'Order #ORD001 has been placed', type: 'info', read: false, timestamp: '2024-01-01T10:00:00Z' },
    { id: '2', title: 'Low Stock Alert', message: 'Product ABC is running low', type: 'warning', read: false, timestamp: '2024-01-01T09:30:00Z' },
    { id: '3', title: 'Payment Received', message: 'Payment for invoice #INV001 received', type: 'success', read: true, timestamp: '2024-01-01T09:00:00Z' }
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with system notifications</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card key={notification.id} className={`p-4 ${!notification.read ? 'border-blue-200 bg-blue-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{notification.title}</h3>
                  <Badge variant={notification.type as any}>{notification.type}</Badge>
                  {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                </div>
                <p className="text-gray-600 text-sm">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Check className="h-4 w-4 text-green-600" />
                </button>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

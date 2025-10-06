'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Upload,
  Database
} from 'lucide-react'

interface OfflineData {
  pendingUploads: number
  lastSync: string
  dataSize: string
  queuedActions: number
}

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [offlineData, setOfflineData] = useState<OfflineData>({
    pendingUploads: 12,
    lastSync: '2024-10-01 09:30 AM',
    dataSize: '2.4 MB',
    queuedActions: 8
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSync = async () => {
    setIsSyncing(true)
    await new Promise(resolve => setTimeout(resolve, 3000))
    setOfflineData({
      ...offlineData,
      pendingUploads: 0,
      lastSync: new Date().toLocaleString(),
      queuedActions: 0
    })
    setIsSyncing(false)
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500'
    if (offlineData.pendingUploads > 0) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (isSyncing) return 'Syncing...'
    if (offlineData.pendingUploads > 0) return 'Sync Pending'
    return 'Online'
  }

  return (
    <div className="relative">
      <div 
        className="flex items-center space-x-2 cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        <span className="text-sm font-medium text-gray-700">
          {getStatusText()}
        </span>
        {isOnline ? (
          <Wifi className="w-4 h-4 text-gray-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
      </div>

      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 z-50">
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold">Connection Status</h3>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {isOnline ? (
                    <Wifi className="w-5 h-5 text-green-600" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {isOnline ? 'Connected' : 'Disconnected'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {isOnline ? 'Real-time sync available' : 'Working offline'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Pending Uploads</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {offlineData.pendingUploads}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Last Sync</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {offlineData.lastSync}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Offline Data</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {offlineData.dataSize}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                {isOnline && offlineData.pendingUploads > 0 && (
                  <Button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full mb-2"
                    size="sm"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                )}

                {!isOnline && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Working Offline
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Data is saved locally and will sync when connection is restored.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isOnline && offlineData.pendingUploads === 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium text-green-800">
                        All data synchronized
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  )
}
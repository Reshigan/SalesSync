'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { WifiOff, RefreshCw, Home, Layers } from 'lucide-react'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
      if (navigator.onLine) {
        // Redirect to dashboard when back online
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
    }

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [router])

  const handleRetry = () => {
    window.location.reload()
  }

  const goHome = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">SalesSync</h1>
          </div>

          {/* Offline Icon */}
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-10 h-10 text-gray-400" />
          </div>

          {/* Status Message */}
          {isOnline ? (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-green-600 mb-2">
                Back Online!
              </h2>
              <p className="text-gray-600">
                Your connection has been restored. Redirecting...
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                You're Offline
              </h2>
              <p className="text-gray-600">
                It looks like you've lost your internet connection. Don't worry, 
                SalesSync works offline too!
              </p>
            </div>
          )}

          {/* Features Available Offline */}
          {!isOnline && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-blue-900 mb-2">Available Offline:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• View cached customer data</li>
                <li>• Create new orders (will sync later)</li>
                <li>• Access product catalog</li>
                <li>• View recent transactions</li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {isOnline ? (
              <Button
                onClick={goHome}
                className="w-full"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleRetry}
                  className="w-full"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={goHome}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Continue Offline
                </Button>
              </>
            )}
          </div>

          {/* Connection Status */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-600">
                {isOnline ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
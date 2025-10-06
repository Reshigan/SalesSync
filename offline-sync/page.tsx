'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RefreshCw } from 'lucide-react'

export default function OfflineSyncPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <RefreshCw className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offline Sync</h1>
          <p className="text-gray-600">Manage offline data synchronization</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>Offline Sync functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
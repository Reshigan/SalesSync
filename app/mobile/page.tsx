'use client'

import { Card } from '@/components/ui/Card'
import { Smartphone, Wifi, WifiOff } from 'lucide-react'

export default function MobilePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Smartphone className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mobile Dashboard</h1>
          <p className="text-gray-600">Mobile-optimized interface</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Mobile Features</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5 text-green-600" />
              <span>Online Mode Active</span>
            </div>
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-gray-400" />
              <span>Offline Mode Available</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

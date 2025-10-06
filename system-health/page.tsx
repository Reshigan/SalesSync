'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Activity } from 'lucide-react'

export default function SystemHealthPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-600">System performance monitoring</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>System Health functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
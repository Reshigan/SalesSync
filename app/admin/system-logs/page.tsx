'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileText } from 'lucide-react'

export default function SystemLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600">System activity and error logs</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>System Logs functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
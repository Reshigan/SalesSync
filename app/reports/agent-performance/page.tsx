'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BarChart } from 'lucide-react'

export default function AgentPerformanceReportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Performance Report</h1>
          <p className="text-gray-600">Field agent performance analytics</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>Agent Performance Report functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Download } from 'lucide-react'

export default function DataExportToolPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Download className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Export Tool</h1>
          <p className="text-gray-600">Export system data</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>Data Export Tool functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
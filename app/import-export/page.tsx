'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileText, Database } from 'lucide-react'

export default function ImportExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import & Export</h1>
        <p className="text-gray-600">Manage data import and export operations</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Import Data</h3>
          </div>
          <p className="text-gray-600 mb-4">Import data from external sources</p>
          <Button className="w-full">Start Import</Button>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold">Export Data</h3>
          </div>
          <p className="text-gray-600 mb-4">Export data to external formats</p>
          <Button className="w-full">Start Export</Button>
        </Card>
      </div>
    </div>
  )
}

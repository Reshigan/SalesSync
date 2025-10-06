'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Upload } from 'lucide-react'

export default function DataImportToolPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Upload className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Import Tool</h1>
          <p className="text-gray-600">Import external data</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>Data Import Tool functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
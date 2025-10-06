'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Upload, Download, Trash2, Edit } from 'lucide-react'

export default function BulkOperationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Operations</h1>
        <p className="text-gray-600">Perform bulk operations on your data</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Bulk Import</h3>
          <p className="text-sm text-gray-600 mb-4">Import data from CSV/Excel files</p>
          <Button className="w-full">Import Data</Button>
        </Card>
        
        <Card className="p-6 text-center">
          <Download className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Bulk Export</h3>
          <p className="text-sm text-gray-600 mb-4">Export data to various formats</p>
          <Button className="w-full">Export Data</Button>
        </Card>
        
        <Card className="p-6 text-center">
          <Edit className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Bulk Update</h3>
          <p className="text-sm text-gray-600 mb-4">Update multiple records at once</p>
          <Button className="w-full">Update Records</Button>
        </Card>
        
        <Card className="p-6 text-center">
          <Trash2 className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Bulk Delete</h3>
          <p className="text-sm text-gray-600 mb-4">Delete multiple records safely</p>
          <Button className="w-full" variant="outline">Delete Records</Button>
        </Card>
      </div>
    </div>
  )
}

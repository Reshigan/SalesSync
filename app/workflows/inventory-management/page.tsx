'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Package } from 'lucide-react'

export default function InventoryManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Inventory workflow management</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>Inventory Management functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
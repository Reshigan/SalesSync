'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Store } from 'lucide-react'

export default function StoreDetailsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Store className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Details</h1>
          <p className="text-gray-600">View store information</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>Store Details functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
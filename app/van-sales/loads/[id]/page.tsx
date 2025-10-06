'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Truck } from 'lucide-react'

export default function LoadDetailsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Truck className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Load Details</h1>
          <p className="text-gray-600">View van sales load details</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>Load Details functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
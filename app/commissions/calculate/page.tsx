'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calculator } from 'lucide-react'

export default function CalculateCommissionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calculate Commissions</h1>
          <p className="text-gray-600">Calculate agent commissions</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>Calculate Commissions functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
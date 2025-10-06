'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'

export default function CreateCampaignPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Plus className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
          <p className="text-gray-600">Create new marketing campaign</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>Create Campaign functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
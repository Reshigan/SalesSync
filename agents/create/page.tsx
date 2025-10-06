'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserPlus } from 'lucide-react'

export default function CreateAgentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserPlus className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Agent</h1>
          <p className="text-gray-600">Add new field agent</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>Create Agent functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
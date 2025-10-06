'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Edit } from 'lucide-react'

export default function EditAgentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Edit className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Agent</h1>
          <p className="text-gray-600">Modify agent information</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>Edit Agent functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
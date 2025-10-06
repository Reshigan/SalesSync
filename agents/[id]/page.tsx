'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { User } from 'lucide-react'

export default function AgentProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Profile</h1>
          <p className="text-gray-600">View agent information and performance</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>Agent Profile functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
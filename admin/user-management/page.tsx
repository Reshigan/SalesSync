'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Users } from 'lucide-react'

export default function UserManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">System user administration</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>User Management functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserPlus } from 'lucide-react'

export default function CreateUserPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserPlus className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create User</h1>
          <p className="text-gray-600">Add new user to system</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>Create User functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
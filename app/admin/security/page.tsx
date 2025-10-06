'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Shield } from 'lucide-react'

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-gray-600">System security configuration</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>Security Settings functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
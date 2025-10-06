'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Code } from 'lucide-react'

export default function APIDocumentationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Code className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
          <p className="text-gray-600">System API documentation</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>API Documentation functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
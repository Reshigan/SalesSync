'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Search } from 'lucide-react'

export default function GlobalSearchPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Search className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Search</h1>
          <p className="text-gray-600">Search across all system data</p>
        </div>
      </div>
      
      <Card className="p-6">
        <p>Global Search functionality will be implemented here.</p>
      </Card>
    </div>
  )
}
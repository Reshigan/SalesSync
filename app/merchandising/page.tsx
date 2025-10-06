'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Eye, Plus, Search, Filter, Download, MapPin, Calendar, Camera } from 'lucide-react'

export default function MerchandisingPage() {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merchandising</h1>
          <p className="text-gray-600">Store visits and shelf management</p>
        </div>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Visit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Visits</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Photos Taken</p>
              <p className="text-2xl font-bold text-gray-900">892</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Camera className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliance</p>
              <p className="text-2xl font-bold text-green-600">94%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Eye className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Store Visits</h3>
        <div className="text-center py-8 text-gray-500">
          No visits recorded yet. Start your first merchandising visit.
        </div>
      </Card>
    </div>
  )
}

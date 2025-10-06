'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Route, Plus, MapPin, Truck, Clock, Target } from 'lucide-react'

export default function RoutesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routes Management</h1>
          <p className="text-gray-600">Plan and optimize delivery routes</p>
        </div>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Route
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Routes</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Route className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Stops</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Time</p>
              <p className="text-2xl font-bold text-gray-900">4.5h</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Efficiency</p>
              <p className="text-2xl font-bold text-green-600">92%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Performance</h3>
        <div className="text-center py-8 text-gray-500">
          No route data available. Create and assign routes to optimize deliveries.
        </div>
      </Card>
    </div>
  )
}

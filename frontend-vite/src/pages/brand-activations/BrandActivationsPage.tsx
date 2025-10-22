import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { 
  MapPin, Users, Package, TrendingUp, Calendar, Plus, 
  Filter, ShoppingCart, Gift, MessageCircle 
} from 'lucide-react'
import { formatCurrency } from '../../utils/currency'

interface BrandActivation {
  id: string
  name: string
  description: string
  type: 'in_store' | 'outdoor' | 'mall' | 'event'
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  location: string
  store_name?: string
  date: string
  start_time: string
  end_time: string
  budget: number
  assigned_agents: Array<{ id: string; name: string; role: string }>
  products: Array<{ id: string; name: string; quantity: number; samples_allocated: number }>
  targets: {
    customer_interactions: number
    samples_to_distribute: number
    sales_target: number
  }
  actual: {
    customer_interactions: number
    samples_distributed: number
    sales_made: number
    revenue_generated: number
  }
}

export default function BrandActivationsPage() {
  const [activations, setActivations] = useState<BrandActivation[]>([])
  const [loading, setLoading] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Activations</h1>
          <p className="text-gray-500 mt-1">
            In-store demos, sampling, and customer engagement activities
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Schedule Activation
        </Button>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Brand Activations Module</h3>
          <p className="text-gray-600 mb-4">
            Manage in-store demonstrations, product sampling, and customer engagement events
          </p>
          <p className="text-sm text-gray-500">
            This feature will be fully implemented shortly
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

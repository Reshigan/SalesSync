import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { TrendingUp, Target, DollarSign, Users, BarChart3, Calendar } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'

interface TradeMarketingMetrics {
  totalSpend: number
  activePromotions: number
  retailerParticipation: number
  roi: number
  marketShare: number
  competitorAnalysis: number
}

interface Promotion {
  id: string
  name: string
  type: 'discount' | 'rebate' | 'volume_incentive' | 'display_allowance'
  status: 'active' | 'planned' | 'completed' | 'paused'
  startDate: string
  endDate: string
  budget: number
  spent: number
  participatingRetailers: number
  expectedROI: number
  actualROI?: number
}

export default function TradeMarketingPage() {
  const [metrics, setMetrics] = useState<TradeMarketingMetrics>({
    totalSpend: 0,
    activePromotions: 0,
    retailerParticipation: 0,
    roi: 0,
    marketShare: 0,
    competitorAnalysis: 0
  })
  
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTradeMarketingData()
  }, [])

  const fetchTradeMarketingData = async () => {
    try {
      setLoading(true)
      // TODO: Replace with real API calls
      setMetrics({
        totalSpend: 125000,
        activePromotions: 8,
        retailerParticipation: 85,
        roi: 3.2,
        marketShare: 24.5,
        competitorAnalysis: 12
      })

      setPromotions([
        {
          id: '1',
          name: 'Summer Volume Incentive',
          type: 'volume_incentive',
          status: 'active',
          startDate: '2024-01-01',
          endDate: '2024-03-31',
          budget: 50000,
          spent: 32000,
          participatingRetailers: 45,
          expectedROI: 3.5,
          actualROI: 3.8
        },
        {
          id: '2',
          name: 'New Product Launch Rebate',
          type: 'rebate',
          status: 'active',
          startDate: '2024-01-15',
          endDate: '2024-02-15',
          budget: 25000,
          spent: 18500,
          participatingRetailers: 28,
          expectedROI: 2.8,
          actualROI: 3.1
        },
        {
          id: '3',
          name: 'Holiday Display Program',
          type: 'display_allowance',
          status: 'planned',
          startDate: '2024-02-01',
          endDate: '2024-02-29',
          budget: 35000,
          spent: 0,
          participatingRetailers: 0,
          expectedROI: 4.2
        }
      ])
    } catch (error) {
      console.error('Error fetching trade marketing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'planned': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-gray-600 bg-gray-100'
      case 'paused': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'discount': return 'text-purple-600 bg-purple-100'
      case 'rebate': return 'text-blue-600 bg-blue-100'
      case 'volume_incentive': return 'text-green-600 bg-green-100'
      case 'display_allowance': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getBudgetUtilization = (spent: number, budget: number) => {
    return Math.round((spent / budget) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trade Marketing</h1>
          <p className="text-gray-600">Manage trade promotions, retailer incentives, and market analysis</p>
        </div>
        <Button>
          <Target className="h-4 w-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spend</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalSpend)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Promotions</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.activePromotions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Retailer Participation</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.retailerParticipation}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average ROI</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.roi}x</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Market Share</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.marketShare}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Competitor Analysis</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.competitorAnalysis}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promotions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Promotions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Promotion Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget Utilization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retailers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promotions.map((promotion) => (
                  <tr key={promotion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{promotion.name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(promotion.startDate).toLocaleDateString()} - {new Date(promotion.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(promotion.type)}`}>
                        {promotion.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(promotion.status)}`}>
                        {promotion.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(promotion.spent)} / {formatCurrency(promotion.budget)}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            getBudgetUtilization(promotion.spent, promotion.budget) > 80 
                              ? 'bg-red-600' 
                              : getBudgetUtilization(promotion.spent, promotion.budget) > 60 
                                ? 'bg-yellow-600' 
                                : 'bg-green-600'
                          }`}
                          style={{ width: `${getBudgetUtilization(promotion.spent, promotion.budget)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getBudgetUtilization(promotion.spent, promotion.budget)}% utilized
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {promotion.participatingRetailers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Expected: {promotion.expectedROI}x
                      </div>
                      {promotion.actualROI && (
                        <div className={`text-sm ${promotion.actualROI >= promotion.expectedROI ? 'text-green-600' : 'text-red-600'}`}>
                          Actual: {promotion.actualROI}x
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ReportingDashboard from '@/components/reporting/ReportingDashboard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { 
  MapPin, 
  TrendingUp, 
  Clock, 
  Route,
  Target,
  AlertTriangle,
  CheckCircle,
  Users,
  DollarSign,
  Truck,
  Navigation,
  Activity,
  BarChart3,
  Eye,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Fuel,
  Calendar,
  Star,
  Award,
  Zap,
  Globe,
  Building,
  Map
} from 'lucide-react'

interface RoutePerformance {
  id: string
  routeCode: string
  routeName: string
  areaName: string
  regionName: string
  agentName: string
  agentCode: string
  customersAssigned: number
  customersVisited: number
  visitCompletionRate: number
  totalDistance: number
  plannedDistance: number
  distanceEfficiency: number
  totalTime: number
  plannedTime: number
  timeEfficiency: number
  ordersGenerated: number
  totalRevenue: number
  avgOrderValue: number
  fuelCost: number
  operatingCost: number
  profitability: number
  customerSatisfaction: number
  lastVisitDate: string
  performanceScore: number
  riskLevel: 'low' | 'medium' | 'high'
}

interface TerritoryAnalysis {
  territory: string
  routesCount: number
  totalCustomers: number
  coverage: number
  penetration: number
  totalRevenue: number
  avgRevenuePerRoute: number
  efficiency: number
  growthRate: number
  marketPotential: number
  competitorPresence: number
}

interface AgentPerformance {
  agentId: string
  agentName: string
  agentCode: string
  routesAssigned: number
  totalCustomers: number
  visitRate: number
  conversionRate: number
  avgOrderValue: number
  totalRevenue: number
  efficiency: number
  customerSatisfaction: number
  performanceRank: number
  growthRate: number
}

interface RouteOptimization {
  routeId: string
  routeName: string
  currentDistance: number
  optimizedDistance: number
  distanceSaving: number
  currentTime: number
  optimizedTime: number
  timeSaving: number
  fuelSaving: number
  costSaving: number
  implementationComplexity: 'low' | 'medium' | 'high'
  priority: number
}

export default function RouteAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '2024-07-01', end: '2024-09-30' })
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedArea, setSelectedArea] = useState('all')
  const [selectedAgent, setSelectedAgent] = useState('all')
  const [analysisType, setAnalysisType] = useState('performance')

  // Mock data
  const [routePerformance, setRoutePerformance] = useState<RoutePerformance[]>([])
  const [territoryAnalysis, setTerritoryAnalysis] = useState<TerritoryAnalysis[]>([])
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([])
  const [routeOptimization, setRouteOptimization] = useState<RouteOptimization[]>([])

  useEffect(() => {
    // Mock data loading
    setTimeout(() => {
      setRoutePerformance([
        {
          id: '1',
          routeCode: 'LM001',
          routeName: 'Lagos Central',
          areaName: 'Lagos Metro',
          regionName: 'South West',
          agentName: 'John Adebayo',
          agentCode: 'AGT001',
          customersAssigned: 45,
          customersVisited: 42,
          visitCompletionRate: 93.3,
          totalDistance: 125.5,
          plannedDistance: 118.0,
          distanceEfficiency: 94.0,
          totalTime: 480,
          plannedTime: 450,
          timeEfficiency: 93.8,
          ordersGenerated: 38,
          totalRevenue: 1850000,
          avgOrderValue: 48684,
          fuelCost: 15000,
          operatingCost: 45000,
          profitability: 88.5,
          customerSatisfaction: 4.6,
          lastVisitDate: '2024-09-30',
          performanceScore: 92,
          riskLevel: 'low'
        },
        {
          id: '2',
          routeCode: 'LI002',
          routeName: 'Lagos Island',
          areaName: 'Lagos Metro',
          regionName: 'South West',
          agentName: 'Mary Okafor',
          agentCode: 'AGT002',
          customersAssigned: 28,
          customersVisited: 25,
          visitCompletionRate: 89.3,
          totalDistance: 85.2,
          plannedDistance: 78.5,
          distanceEfficiency: 92.1,
          totalTime: 360,
          plannedTime: 330,
          timeEfficiency: 91.7,
          ordersGenerated: 22,
          totalRevenue: 1420000,
          avgOrderValue: 64545,
          fuelCost: 12000,
          operatingCost: 38000,
          profitability: 91.2,
          customerSatisfaction: 4.8,
          lastVisitDate: '2024-09-29',
          performanceScore: 89,
          riskLevel: 'low'
        },
        {
          id: '3',
          routeCode: 'AB001',
          routeName: 'Abuja Central',
          areaName: 'FCT Metro',
          regionName: 'North Central',
          agentName: 'Ahmed Hassan',
          agentCode: 'AGT003',
          customersAssigned: 35,
          customersVisited: 28,
          visitCompletionRate: 80.0,
          totalDistance: 145.8,
          plannedDistance: 125.0,
          distanceEfficiency: 85.8,
          totalTime: 520,
          plannedTime: 480,
          timeEfficiency: 92.3,
          ordersGenerated: 24,
          totalRevenue: 1180000,
          avgOrderValue: 49167,
          fuelCost: 18000,
          operatingCost: 52000,
          profitability: 82.1,
          customerSatisfaction: 4.2,
          lastVisitDate: '2024-09-28',
          performanceScore: 78,
          riskLevel: 'medium'
        }
      ])

      setTerritoryAnalysis([
        {
          territory: 'Lagos Metro',
          routesCount: 15,
          totalCustomers: 450,
          coverage: 92.5,
          penetration: 78.2,
          totalRevenue: 28500000,
          avgRevenuePerRoute: 1900000,
          efficiency: 91.8,
          growthRate: 18.5,
          marketPotential: 85.2,
          competitorPresence: 65.8
        },
        {
          territory: 'FCT Metro',
          routesCount: 12,
          totalCustomers: 320,
          coverage: 88.1,
          penetration: 72.5,
          totalRevenue: 18200000,
          avgRevenuePerRoute: 1516667,
          efficiency: 86.4,
          growthRate: 12.3,
          marketPotential: 78.9,
          competitorPresence: 58.2
        },
        {
          territory: 'Port Harcourt Metro',
          routesCount: 10,
          totalCustomers: 280,
          coverage: 85.7,
          penetration: 68.9,
          totalRevenue: 15800000,
          avgRevenuePerRoute: 1580000,
          efficiency: 83.2,
          growthRate: 15.7,
          marketPotential: 82.1,
          competitorPresence: 52.4
        }
      ])

      setAgentPerformance([
        {
          agentId: '1',
          agentName: 'John Adebayo',
          agentCode: 'AGT001',
          routesAssigned: 2,
          totalCustomers: 78,
          visitRate: 94.2,
          conversionRate: 87.5,
          avgOrderValue: 52000,
          totalRevenue: 3200000,
          efficiency: 93.8,
          customerSatisfaction: 4.7,
          performanceRank: 1,
          growthRate: 22.1
        },
        {
          agentId: '2',
          agentName: 'Mary Okafor',
          agentCode: 'AGT002',
          routesAssigned: 1,
          totalCustomers: 28,
          visitRate: 89.3,
          conversionRate: 88.0,
          avgOrderValue: 64545,
          totalRevenue: 1420000,
          efficiency: 91.7,
          customerSatisfaction: 4.8,
          performanceRank: 2,
          growthRate: 18.9
        },
        {
          agentId: '3',
          agentName: 'Ahmed Hassan',
          agentCode: 'AGT003',
          routesAssigned: 1,
          totalCustomers: 35,
          visitRate: 80.0,
          conversionRate: 85.7,
          avgOrderValue: 49167,
          totalRevenue: 1180000,
          efficiency: 85.8,
          customerSatisfaction: 4.2,
          performanceRank: 3,
          growthRate: 8.5
        }
      ])

      setRouteOptimization([
        {
          routeId: '3',
          routeName: 'Abuja Central',
          currentDistance: 145.8,
          optimizedDistance: 128.5,
          distanceSaving: 17.3,
          currentTime: 520,
          optimizedTime: 465,
          timeSaving: 55,
          fuelSaving: 2500,
          costSaving: 8500,
          implementationComplexity: 'medium',
          priority: 1
        },
        {
          routeId: '1',
          routeName: 'Lagos Central',
          currentDistance: 125.5,
          optimizedDistance: 118.2,
          distanceSaving: 7.3,
          currentTime: 480,
          optimizedTime: 455,
          timeSaving: 25,
          fuelSaving: 1200,
          costSaving: 3800,
          implementationComplexity: 'low',
          priority: 2
        }
      ])

      setLoading(false)
    }, 1000)
  }, [dateRange, selectedRegion, selectedArea, selectedAgent])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const metrics = [
    {
      title: 'Total Routes',
      value: 45,
      change: 5.2,
      changeType: 'increase' as const,
      icon: Route,
      color: 'bg-blue-600',
      subtitle: 'Active routes',
      format: 'number' as const
    },
    {
      title: 'Route Efficiency',
      value: 89.2,
      change: 3.8,
      changeType: 'increase' as const,
      icon: Target,
      color: 'bg-green-600',
      subtitle: 'Average efficiency',
      format: 'percentage' as const
    },
    {
      title: 'Customer Coverage',
      value: 91.5,
      change: 2.1,
      changeType: 'increase' as const,
      icon: Users,
      color: 'bg-purple-600',
      subtitle: 'Customers reached',
      format: 'percentage' as const
    },
    {
      title: 'Total Distance',
      value: 5420,
      change: -8.5,
      changeType: 'decrease' as const,
      icon: Navigation,
      color: 'bg-orange-600',
      subtitle: 'Kilometers traveled',
      format: 'number' as const
    },
    {
      title: 'Revenue per Route',
      value: 1650000,
      change: 15.8,
      changeType: 'increase' as const,
      icon: DollarSign,
      color: 'bg-indigo-600',
      subtitle: 'Average revenue',
      format: 'currency' as const
    },
    {
      title: 'Fuel Efficiency',
      value: 12.5,
      change: 7.2,
      changeType: 'increase' as const,
      icon: Fuel,
      color: 'bg-red-600',
      subtitle: 'Km per liter',
      format: 'number' as const
    }
  ]

  const charts = [
    {
      id: 'territory-performance',
      title: 'Territory Performance Comparison',
      type: 'bar' as const,
      data: territoryAnalysis,
      config: {
        xAxis: 'territory',
        yAxis: 'totalRevenue',
        colors: ['#3B82F6'],
        showGrid: true
      }
    },
    {
      id: 'route-efficiency',
      title: 'Route Efficiency Distribution',
      type: 'pie' as const,
      data: routePerformance,
      config: {
        colors: ['#10B981', '#F59E0B', '#EF4444'],
        showLegend: true
      }
    },
    {
      id: 'agent-performance',
      title: 'Agent Performance Ranking',
      type: 'bar' as const,
      data: agentPerformance,
      config: {
        xAxis: 'agentName',
        yAxis: 'totalRevenue',
        colors: ['#8B5CF6'],
        showGrid: true
      }
    },
    {
      id: 'optimization-savings',
      title: 'Route Optimization Potential',
      type: 'area' as const,
      data: routeOptimization,
      config: {
        xAxis: 'routeName',
        yAxis: 'costSaving',
        colors: ['#10B981'],
        showGrid: true
      }
    }
  ]

  const filters = [
    {
      id: 'dateRange',
      label: 'Date Range',
      type: 'daterange' as const,
      value: dateRange,
      onChange: setDateRange
    },
    {
      id: 'region',
      label: 'Region',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Regions' },
        { value: 'sw', label: 'South West' },
        { value: 'ss', label: 'South South' },
        { value: 'se', label: 'South East' },
        { value: 'nc', label: 'North Central' }
      ],
      value: selectedRegion,
      onChange: setSelectedRegion
    },
    {
      id: 'area',
      label: 'Area',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Areas' },
        { value: 'lagos-metro', label: 'Lagos Metro' },
        { value: 'fct-metro', label: 'FCT Metro' },
        { value: 'ph-metro', label: 'Port Harcourt Metro' }
      ],
      value: selectedArea,
      onChange: setSelectedArea
    },
    {
      id: 'analysisType',
      label: 'Analysis Type',
      type: 'select' as const,
      options: [
        { value: 'performance', label: 'Performance Analysis' },
        { value: 'efficiency', label: 'Efficiency Analysis' },
        { value: 'optimization', label: 'Optimization Analysis' },
        { value: 'territory', label: 'Territory Analysis' }
      ],
      value: analysisType,
      onChange: setAnalysisType
    }
  ]

  const routeColumns = [
    {
      header: 'Route',
      accessor: 'route',
      cell: ({ row }: { row: RoutePerformance }) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.routeName}</div>
            <div className="text-sm text-gray-500">{row.routeCode}</div>
            <div className="text-xs text-gray-400">{row.regionName} → {row.areaName}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Agent',
      accessor: 'agent',
      cell: ({ row }: { row: RoutePerformance }) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">{row.agentName}</div>
          <div className="text-xs text-gray-500">{row.agentCode}</div>
        </div>
      ),
    },
    {
      header: 'Coverage',
      accessor: 'coverage',
      cell: ({ row }: { row: RoutePerformance }) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {row.customersVisited}/{row.customersAssigned}
          </div>
          <div className="text-sm text-blue-600">
            {row.visitCompletionRate}% completion
          </div>
          <div className="text-xs text-gray-500">
            {row.ordersGenerated} orders
          </div>
        </div>
      ),
    },
    {
      header: 'Efficiency',
      accessor: 'efficiency',
      cell: ({ row }: { row: RoutePerformance }) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {row.distanceEfficiency}% distance
          </div>
          <div className="text-sm text-purple-600">
            {row.timeEfficiency}% time
          </div>
          <div className="text-xs text-gray-500">
            {row.totalDistance}km traveled
          </div>
        </div>
      ),
    },
    {
      header: 'Performance',
      accessor: 'performance',
      cell: ({ row }: { row: RoutePerformance }) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {formatCurrency(row.totalRevenue)}
          </div>
          <div className="text-sm text-green-600">
            AOV: {formatCurrency(row.avgOrderValue)}
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span className="text-xs text-gray-500">Score: {row.performanceScore}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Profitability',
      accessor: 'profitability',
      cell: ({ row }: { row: RoutePerformance }) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {row.profitability}% margin
          </div>
          <div className="text-sm text-red-600">
            Fuel: {formatCurrency(row.fuelCost)}
          </div>
          <div className="text-xs text-gray-500">
            OpEx: {formatCurrency(row.operatingCost)}
          </div>
        </div>
      ),
    },
    {
      header: 'Risk & Satisfaction',
      accessor: 'risk',
      cell: ({ row }: { row: RoutePerformance }) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              row.riskLevel === 'low' ? 'bg-green-500' : 
              row.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-500 capitalize">{row.riskLevel} risk</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span className="text-xs text-gray-500">{row.customerSatisfaction}/5.0</span>
          </div>
          <div className="text-xs text-gray-400">
            Last: {new Date(row.lastVisitDate).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: ({ row }: { row: RoutePerformance }) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Navigation className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <BarChart3 className="w-4 h-4" />
          </Button>
        </div>
      ),
    }
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading route analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <ReportingDashboard
        title="Route Performance & Territory Analytics"
        subtitle="Comprehensive route efficiency, territory coverage, and agent performance analysis"
        metrics={metrics}
        charts={charts}
        filters={filters}
        onExport={(format) => console.log(`Exporting route analytics as ${format}`)}
        onRefresh={() => window.location.reload()}
        customActions={
          <Button variant="outline">
            <Zap className="w-4 h-4 mr-2" />
            Optimize Routes
          </Button>
        }
      />

      {/* Detailed Analysis Sections */}
      <div className="mt-8 space-y-6">
        {/* Territory Analysis */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Territory Performance Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {territoryAnalysis.map(territory => (
              <Card key={territory.territory} className="p-4 border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900">{territory.territory}</h4>
                  <span className="text-sm text-gray-500">{territory.coverage}% coverage</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Routes:</span>
                    <span className="font-medium">{territory.routesCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Customers:</span>
                    <span className="font-medium">{territory.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium">{formatCurrency(territory.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg/Route:</span>
                    <span className="font-medium">{formatCurrency(territory.avgRevenuePerRoute)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Efficiency:</span>
                    <span className="font-medium text-green-600">{territory.efficiency}%</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Growth Rate:</span>
                    <span className={`text-xs font-medium ${territory.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {territory.growthRate > 0 ? '+' : ''}{territory.growthRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-600">Market Potential:</span>
                    <span className="text-xs font-medium text-blue-600">{territory.marketPotential}%</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-600">Competition:</span>
                    <span className="text-xs font-medium text-orange-600">{territory.competitorPresence}%</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Agent Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Performance Ranking</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agentPerformance.map((agent, index) => (
              <Card key={agent.agentId} className={`p-4 border-l-4 ${
                index === 0 ? 'border-gold-500 bg-yellow-50' :
                index === 1 ? 'border-silver-500 bg-gray-50' :
                'border-bronze-500 bg-orange-50'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <Award className={`w-5 h-5 ${
                      index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-gray-600' :
                      'text-orange-600'
                    }`} />
                    <h4 className="font-medium text-gray-900">{agent.agentName}</h4>
                  </div>
                  <span className="text-sm font-bold text-blue-600">#{agent.performanceRank}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Routes:</span>
                    <span className="font-medium">{agent.routesAssigned}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Customers:</span>
                    <span className="font-medium">{agent.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Visit Rate:</span>
                    <span className="font-medium text-blue-600">{agent.visitRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Conversion:</span>
                    <span className="font-medium text-green-600">{agent.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium">{formatCurrency(agent.totalRevenue)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Efficiency:</span>
                    <span className="text-xs font-medium text-purple-600">{agent.efficiency}%</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-600">Satisfaction:</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs font-medium">{agent.customerSatisfaction}/5.0</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-600">Growth:</span>
                    <span className={`text-xs font-medium ${agent.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {agent.growthRate > 0 ? '+' : ''}{agent.growthRate}%
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Route Performance Table */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Detailed Route Performance</h3>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Analysis
            </Button>
          </div>
          <DataTable
            data={routePerformance}
            columns={routeColumns}
          />
        </Card>

        {/* Route Optimization */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Route Optimization Opportunities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {routeOptimization.map((optimization, index) => (
              <Card key={optimization.routeId} className="p-4 border-l-4 border-green-500">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900">{optimization.routeName}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    optimization.priority === 1 ? 'bg-red-100 text-red-800' :
                    optimization.priority === 2 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    Priority {optimization.priority}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">Distance Optimization</div>
                    <div className="text-sm font-medium text-gray-900">
                      {optimization.currentDistance}km → {optimization.optimizedDistance}km
                    </div>
                    <div className="text-sm text-green-600">
                      Save: {optimization.distanceSaving}km ({((optimization.distanceSaving / optimization.currentDistance) * 100).toFixed(1)}%)
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">Time Optimization</div>
                    <div className="text-sm font-medium text-gray-900">
                      {Math.round(optimization.currentTime / 60)}h → {Math.round(optimization.optimizedTime / 60)}h
                    </div>
                    <div className="text-sm text-blue-600">
                      Save: {Math.round(optimization.timeSaving / 60)}h ({((optimization.timeSaving / optimization.currentTime) * 100).toFixed(1)}%)
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Cost Savings:</span>
                    <span className="text-xs font-medium text-green-600">{formatCurrency(optimization.costSaving)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-600">Fuel Savings:</span>
                    <span className="text-xs font-medium text-green-600">{formatCurrency(optimization.fuelSaving)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-600">Complexity:</span>
                    <span className={`text-xs font-medium ${
                      optimization.implementationComplexity === 'low' ? 'text-green-600' :
                      optimization.implementationComplexity === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {optimization.implementationComplexity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
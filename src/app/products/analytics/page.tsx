'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ReportingDashboard from '@/components/reporting/ReportingDashboard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Percent,
  Star,
  Award,
  Zap,
  Clock,
  RefreshCw,
  Eye,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ShoppingCart,
  Users,
  MapPin,
  Tag,
  Layers,
  TrendingDown,
  Activity
} from 'lucide-react'

interface ProductPerformance {
  id: string
  sku: string
  name: string
  category: string
  brand: string
  unitsSold: number
  revenue: number
  unitPrice: number
  costPrice: number
  margin: number
  marginPercent: number
  inventoryTurnover: number
  stockLevel: number
  reorderLevel: number
  daysOutOfStock: number
  customerCount: number
  avgOrderQuantity: number
  seasonalityIndex: number
  growthRate: number
  profitabilityScore: number
  riskLevel: 'low' | 'medium' | 'high'
}

interface CategoryAnalysis {
  category: string
  productCount: number
  totalRevenue: number
  totalUnits: number
  avgMargin: number
  marketShare: number
  growthRate: number
  topProduct: string
  seasonality: 'high' | 'medium' | 'low'
}

interface BrandPerformance {
  brand: string
  productCount: number
  totalRevenue: number
  marketShare: number
  avgMargin: number
  customerPenetration: number
  brandLoyalty: number
  growthRate: number
  profitability: number
}

interface InventoryAnalysis {
  sku: string
  name: string
  category: string
  currentStock: number
  reorderLevel: number
  maxStock: number
  turnoverRate: number
  daysOfSupply: number
  stockoutRisk: number
  excessStock: number
  carryingCost: number
  status: 'optimal' | 'low' | 'excess' | 'critical'
}

export default function ProductAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '2024-07-01', end: '2024-09-30' })
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [analysisType, setAnalysisType] = useState('performance')

  // Mock data
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([])
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>([])
  const [brandPerformance, setBrandPerformance] = useState<BrandPerformance[]>([])
  const [inventoryAnalysis, setInventoryAnalysis] = useState<InventoryAnalysis[]>([])

  useEffect(() => {
    // Mock data loading
    setTimeout(() => {
      setProductPerformance([
        {
          id: '1',
          sku: 'BEV001',
          name: 'Coca-Cola 500ml',
          category: 'Beverages',
          brand: 'Coca-Cola',
          unitsSold: 5420,
          revenue: 1355000,
          unitPrice: 250,
          costPrice: 180,
          margin: 70,
          marginPercent: 28,
          inventoryTurnover: 12.5,
          stockLevel: 1250,
          reorderLevel: 200,
          daysOutOfStock: 2,
          customerCount: 340,
          avgOrderQuantity: 15.9,
          seasonalityIndex: 1.2,
          growthRate: 18.5,
          profitabilityScore: 85,
          riskLevel: 'low'
        },
        {
          id: '2',
          sku: 'SNK002',
          name: 'Pringles Original 165g',
          category: 'Snacks',
          brand: 'Pringles',
          unitsSold: 890,
          revenue: 712000,
          unitPrice: 800,
          costPrice: 600,
          margin: 200,
          marginPercent: 25,
          inventoryTurnover: 8.2,
          stockLevel: 45,
          reorderLevel: 50,
          daysOutOfStock: 5,
          customerCount: 156,
          avgOrderQuantity: 5.7,
          seasonalityIndex: 0.9,
          growthRate: 12.3,
          profitabilityScore: 72,
          riskLevel: 'medium'
        },
        {
          id: '3',
          sku: 'HOU003',
          name: 'Ariel Washing Powder 1kg',
          category: 'Household',
          brand: 'Ariel',
          unitsSold: 320,
          revenue: 384000,
          unitPrice: 1200,
          costPrice: 900,
          margin: 300,
          marginPercent: 25,
          inventoryTurnover: 6.8,
          stockLevel: 15,
          reorderLevel: 25,
          daysOutOfStock: 8,
          customerCount: 89,
          avgOrderQuantity: 3.6,
          seasonalityIndex: 1.1,
          growthRate: -5.2,
          profitabilityScore: 58,
          riskLevel: 'high'
        }
      ])

      setCategoryAnalysis([
        {
          category: 'Beverages',
          productCount: 45,
          totalRevenue: 28500000,
          totalUnits: 125000,
          avgMargin: 26.5,
          marketShare: 35.2,
          growthRate: 15.8,
          topProduct: 'Coca-Cola 500ml',
          seasonality: 'high'
        },
        {
          category: 'Snacks',
          productCount: 32,
          totalRevenue: 18200000,
          totalUnits: 45000,
          avgMargin: 28.3,
          marketShare: 22.5,
          growthRate: 12.1,
          topProduct: 'Pringles Original',
          seasonality: 'medium'
        },
        {
          category: 'Household',
          productCount: 28,
          totalRevenue: 15600000,
          totalUnits: 18500,
          avgMargin: 24.8,
          marketShare: 19.3,
          growthRate: 8.7,
          topProduct: 'Ariel Powder',
          seasonality: 'low'
        }
      ])

      setBrandPerformance([
        {
          brand: 'Coca-Cola',
          productCount: 12,
          totalRevenue: 15200000,
          marketShare: 18.8,
          avgMargin: 27.2,
          customerPenetration: 78.5,
          brandLoyalty: 85.2,
          growthRate: 16.3,
          profitability: 88
        },
        {
          brand: 'Pringles',
          productCount: 8,
          totalRevenue: 8900000,
          marketShare: 11.0,
          avgMargin: 25.8,
          customerPenetration: 45.2,
          brandLoyalty: 72.1,
          growthRate: 12.8,
          profitability: 75
        },
        {
          brand: 'Ariel',
          productCount: 6,
          totalRevenue: 6800000,
          marketShare: 8.4,
          avgMargin: 24.5,
          customerPenetration: 38.7,
          brandLoyalty: 68.9,
          growthRate: 9.2,
          profitability: 71
        }
      ])

      setInventoryAnalysis([
        {
          sku: 'BEV001',
          name: 'Coca-Cola 500ml',
          category: 'Beverages',
          currentStock: 1250,
          reorderLevel: 200,
          maxStock: 2000,
          turnoverRate: 12.5,
          daysOfSupply: 28,
          stockoutRisk: 15,
          excessStock: 0,
          carryingCost: 45000,
          status: 'optimal'
        },
        {
          sku: 'SNK002',
          name: 'Pringles Original 165g',
          category: 'Snacks',
          currentStock: 45,
          reorderLevel: 50,
          maxStock: 150,
          turnoverRate: 8.2,
          daysOfSupply: 12,
          stockoutRisk: 75,
          excessStock: 0,
          carryingCost: 18000,
          status: 'low'
        },
        {
          sku: 'HOU003',
          name: 'Ariel Washing Powder 1kg',
          category: 'Household',
          currentStock: 15,
          reorderLevel: 25,
          maxStock: 100,
          turnoverRate: 6.8,
          daysOfSupply: 8,
          stockoutRisk: 85,
          excessStock: 0,
          carryingCost: 22500,
          status: 'critical'
        }
      ])

      setLoading(false)
    }, 1000)
  }, [dateRange, selectedCategory, selectedBrand, selectedRegion])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const metrics = [
    {
      title: 'Total Products',
      value: 156,
      change: 8.5,
      changeType: 'increase' as const,
      icon: Package,
      color: 'bg-blue-600',
      subtitle: 'Active SKUs',
      format: 'number' as const
    },
    {
      title: 'Total Revenue',
      value: 81500000,
      change: 15.2,
      changeType: 'increase' as const,
      icon: DollarSign,
      color: 'bg-green-600',
      subtitle: 'Product sales',
      format: 'currency' as const
    },
    {
      title: 'Average Margin',
      value: 26.8,
      change: 2.3,
      changeType: 'increase' as const,
      icon: Percent,
      color: 'bg-purple-600',
      subtitle: 'Gross margin %',
      format: 'percentage' as const
    },
    {
      title: 'Inventory Turnover',
      value: 9.2,
      change: -1.5,
      changeType: 'decrease' as const,
      icon: RefreshCw,
      color: 'bg-orange-600',
      subtitle: 'Times per year',
      format: 'number' as const
    },
    {
      title: 'Top Performer Revenue',
      value: 1355000,
      change: 18.5,
      changeType: 'increase' as const,
      icon: Award,
      color: 'bg-indigo-600',
      subtitle: 'Best selling product',
      format: 'currency' as const
    },
    {
      title: 'Stock-out Risk',
      value: 12.5,
      change: -5.2,
      changeType: 'decrease' as const,
      icon: AlertTriangle,
      color: 'bg-red-600',
      subtitle: 'Products at risk',
      format: 'percentage' as const
    }
  ]

  const charts = [
    {
      id: 'category-performance',
      title: 'Revenue by Category',
      type: 'bar' as const,
      data: categoryAnalysis,
      config: {
        xAxis: 'category',
        yAxis: 'totalRevenue',
        colors: ['#3B82F6'],
        showGrid: true
      }
    },
    {
      id: 'brand-market-share',
      title: 'Brand Market Share',
      type: 'pie' as const,
      data: brandPerformance,
      config: {
        colors: ['#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'],
        showLegend: true
      }
    },
    {
      id: 'product-profitability',
      title: 'Product Profitability Matrix',
      type: 'area' as const,
      data: productPerformance,
      config: {
        xAxis: 'unitsSold',
        yAxis: 'marginPercent',
        colors: ['#10B981'],
        showGrid: true
      }
    },
    {
      id: 'inventory-status',
      title: 'Inventory Status Distribution',
      type: 'bar' as const,
      data: inventoryAnalysis,
      config: {
        xAxis: 'status',
        yAxis: 'count',
        colors: ['#3B82F6'],
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
      id: 'category',
      label: 'Category',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Categories' },
        { value: 'beverages', label: 'Beverages' },
        { value: 'snacks', label: 'Snacks' },
        { value: 'household', label: 'Household' },
        { value: 'personal_care', label: 'Personal Care' }
      ],
      value: selectedCategory,
      onChange: setSelectedCategory
    },
    {
      id: 'brand',
      label: 'Brand',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Brands' },
        { value: 'coca-cola', label: 'Coca-Cola' },
        { value: 'pringles', label: 'Pringles' },
        { value: 'ariel', label: 'Ariel' },
        { value: 'unilever', label: 'Unilever' }
      ],
      value: selectedBrand,
      onChange: setSelectedBrand
    },
    {
      id: 'analysisType',
      label: 'Analysis Type',
      type: 'select' as const,
      options: [
        { value: 'performance', label: 'Performance Analysis' },
        { value: 'profitability', label: 'Profitability Analysis' },
        { value: 'inventory', label: 'Inventory Analysis' },
        { value: 'market', label: 'Market Analysis' }
      ],
      value: analysisType,
      onChange: setAnalysisType
    }
  ]

  const productColumns = [
    {
      header: 'Product',
      accessorKey: 'product',
      cell: (product: ProductPerformance) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{product.name}</div>
            <div className="text-sm text-gray-500">{product.sku}</div>
            <div className="text-xs text-gray-400">{product.category} • {product.brand}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Sales Performance',
      accessorKey: 'sales',
      cell: (product: ProductPerformance) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {product.unitsSold.toLocaleString()} units
          </div>
          <div className="text-sm text-green-600">
            {formatCurrency(product.revenue)}
          </div>
          <div className="text-xs text-gray-500">
            {product.customerCount} customers
          </div>
        </div>
      ),
    },
    {
      header: 'Profitability',
      accessorKey: 'profitability',
      cell: (product: ProductPerformance) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {formatCurrency(product.margin)} margin
          </div>
          <div className="text-sm text-purple-600">
            {product.marginPercent}% margin
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span className="text-xs text-gray-500">Score: {product.profitabilityScore}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Inventory',
      accessorKey: 'inventory',
      cell: (product: ProductPerformance) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {product.stockLevel} units
          </div>
          <div className="text-sm text-blue-600">
            {product.inventoryTurnover}x turnover
          </div>
          <div className={`text-xs ${product.daysOutOfStock > 5 ? 'text-red-600' : 'text-green-600'}`}>
            {product.daysOutOfStock} days OOS
          </div>
        </div>
      ),
    },
    {
      header: 'Growth & Risk',
      accessorKey: 'growth',
      cell: (product: ProductPerformance) => (
        <div className="space-y-1">
          <div className={`flex items-center space-x-1 ${product.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.growthRate > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span className="text-sm font-medium">{Math.abs(product.growthRate)}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              product.riskLevel === 'low' ? 'bg-green-500' : 
              product.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-500 capitalize">{product.riskLevel} risk</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (product: ProductPerformance) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Target className="w-4 h-4" />
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
            <p className="mt-4 text-gray-600">Loading product analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <ReportingDashboard
        title="Product Performance Analytics"
        subtitle="Comprehensive product analysis including sales, profitability, inventory, and market insights"
        metrics={metrics}
        charts={charts}
        filters={filters}
        onExport={(format) => console.log(`Exporting product analytics as ${format}`)}
        onRefresh={() => window.location.reload()}
        customActions={
          <Button variant="outline">
            <Zap className="w-4 h-4 mr-2" />
            Optimize Portfolio
          </Button>
        }
      />

      {/* Detailed Analysis Sections */}
      <div className="mt-8 space-y-6">
        {/* Category Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categoryAnalysis.map(category => (
              <Card key={category.category} className="p-4 border-l-4 border-green-500">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900">{category.category}</h4>
                  <span className="text-sm text-gray-500">{category.marketShare}% share</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Products:</span>
                    <span className="font-medium">{category.productCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium">{formatCurrency(category.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Units Sold:</span>
                    <span className="font-medium">{category.totalUnits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Margin:</span>
                    <span className="font-medium text-purple-600">{category.avgMargin}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Growth:</span>
                    <span className={`font-medium ${category.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {category.growthRate > 0 ? '+' : ''}{category.growthRate}%
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Top Product:</span>
                    <span className="text-xs font-medium text-blue-600">{category.topProduct}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-600">Seasonality:</span>
                    <span className={`text-xs font-medium ${
                      category.seasonality === 'high' ? 'text-red-600' : 
                      category.seasonality === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {category.seasonality.toUpperCase()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Brand Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Performance Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {brandPerformance.map(brand => (
              <Card key={brand.brand} className="p-4 border-l-4 border-purple-500">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900">{brand.brand}</h4>
                  <span className="text-sm text-gray-500">{brand.marketShare}% share</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Products:</span>
                    <span className="font-medium">{brand.productCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium">{formatCurrency(brand.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Margin:</span>
                    <span className="font-medium text-purple-600">{brand.avgMargin}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Penetration:</span>
                    <span className="font-medium text-blue-600">{brand.customerPenetration}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Loyalty:</span>
                    <span className="font-medium text-green-600">{brand.brandLoyalty}%</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Growth Rate:</span>
                    <span className={`text-xs font-medium ${brand.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {brand.growthRate > 0 ? '+' : ''}{brand.growthRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-600">Profitability Score:</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs font-medium">{brand.profitability}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Product Performance Table */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Detailed Product Performance</h3>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Analysis
            </Button>
          </div>
          <DataTable
            data={productPerformance}
            columns={productColumns}
            searchable={true}
            pagination={true}
            pageSize={10}
          />
        </Card>

        {/* Inventory Analysis */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Status Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {inventoryAnalysis.map((item, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                item.status === 'optimal' ? 'bg-green-50 border-green-500' :
                item.status === 'low' ? 'bg-yellow-50 border-yellow-500' :
                item.status === 'excess' ? 'bg-blue-50 border-blue-500' :
                'bg-red-50 border-red-500'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === 'optimal' ? 'bg-green-100 text-green-800' :
                    item.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                    item.status === 'excess' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current:</span>
                    <span className="font-medium">{item.currentStock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reorder:</span>
                    <span className="font-medium">{item.reorderLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Turnover:</span>
                    <span className="font-medium">{item.turnoverRate}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Supply:</span>
                    <span className="font-medium">{item.daysOfSupply}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk:</span>
                    <span className={`font-medium ${item.stockoutRisk > 50 ? 'text-red-600' : 'text-green-600'}`}>
                      {item.stockoutRisk}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import vanSalesService from '@/services/van-sales.service';
import { 
  Truck, 
  Package, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Minus,
  Barcode,
  Camera,
  Search
} from 'lucide-react'

interface LoadItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  available: number
}

interface ActiveLoad {
  id: string
  vanCode: string
  salesmanName: string
  loadTime: string
  stockValue: number
  cashFloat: number
  status: string
}

export default function VanLoadingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [selectedVan, setSelectedVan] = useState('')
  const [loadItems, setLoadItems] = useState<LoadItem[]>([])
  const [cashFloat, setCashFloat] = useState(5000)
  const [scanMode, setScanMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data
  const availableStock: LoadItem[] = [
    {
      productId: '1',
      productName: 'Coca Cola 500ml',
      sku: 'CC-500',
      quantity: 0,
      unitPrice: 2.50,
      available: 150,
    },
    {
      productId: '2',
      productName: 'Pepsi 500ml',
      sku: 'PP-500',
      quantity: 0,
      unitPrice: 2.45,
      available: 120,
    },
    {
      productId: '3',
      productName: 'Sprite 500ml',
      sku: 'SP-500',
      quantity: 0,
      unitPrice: 2.40,
      available: 80,
    },
    {
      productId: '4',
      productName: 'Fanta Orange 500ml',
      sku: 'FO-500',
      quantity: 0,
      unitPrice: 2.40,
      available: 95,
    },
  ]

  const activeLoads: ActiveLoad[] = [
    {
      id: '1',
      vanCode: 'VAN-001',
      salesmanName: 'John Doe',
      loadTime: '08:30 AM',
      stockValue: 2500,
      cashFloat: 5000,
      status: 'in_field',
    },
    {
      id: '2',
      vanCode: 'VAN-002',
      salesmanName: 'Sarah Wilson',
      loadTime: '09:15 AM',
      stockValue: 3200,
      cashFloat: 5000,
      status: 'returning',
    },
  ]

  const handleAddItem = (product: LoadItem) => {
    const existing = loadItems.find(item => item.productId === product.productId)
    if (existing) {
      setLoadItems(loadItems.map(item =>
        item.productId === product.productId
          ? { ...item, quantity: Math.min(item.quantity + 1, product.available) }
          : item
      ))
    } else {
      setLoadItems([...loadItems, {
        ...product,
        quantity: 1,
      }])
    }
  }

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    const product = availableStock.find(p => p.productId === productId)
    if (!product) return

    if (newQuantity <= 0) {
      setLoadItems(loadItems.filter(item => item.productId !== productId))
    } else {
      setLoadItems(loadItems.map(item =>
        item.productId === productId
          ? { ...item, quantity: Math.min(newQuantity, product.available) }
          : item
      ))
    }
  }

  const calculateTotalValue = () => {
    return loadItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  }

  const filteredStock = availableStock.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleBarcodeScanned = (barcode: string) => {
    const product = availableStock.find(p => p.sku === barcode)
    if (product) {
      handleAddItem(product)
    }
  }

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Van Loading</h1>
            <p className="text-gray-600">Prepare vans for daily routes</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setScanMode(!scanMode)}
            >
              <Barcode className="w-4 h-4 mr-2" />
              {scanMode ? 'Manual Entry' : 'Scan Mode'}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Vans</p>
                <p className="text-2xl font-bold">{activeLoads.length}</p>
              </div>
              <Truck className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Stock Value</p>
                <p className="text-2xl font-bold">
                  ${activeLoads.reduce((sum, load) => sum + load.stockValue, 0).toLocaleString()}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cash in Field</p>
                <p className="text-2xl font-bold">
                  ${activeLoads.reduce((sum, load) => sum + load.cashFloat, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Reconciliation</p>
                <p className="text-2xl font-bold">
                  {activeLoads.filter(l => l.status === 'returning').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Loading Interface */}
        <div className="grid grid-cols-3 gap-6">
          {/* Product Selection */}
          <div className="col-span-2">
            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Select Products</h3>
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                {scanMode ? (
                  <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Scan product barcode</p>
                    <Input
                      placeholder="Enter barcode or scan..."
                      className="max-w-xs mx-auto"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleBarcodeScanned(e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredStock.map(product => (
                      <div
                        key={product.productId}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-sm text-gray-500">
                            SKU: {product.sku} | Available: {product.available}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">${product.unitPrice}</span>
                          <Button
                            size="sm"
                            onClick={() => handleAddItem(product)}
                            disabled={product.available === 0}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>

          {/* Load Summary */}
          <div>
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold">Load Summary</h3>
              </Card.Header>
              <Card.Content className="space-y-4">
                {/* Van Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Van
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedVan}
                    onChange={(e) => setSelectedVan(e.target.value)}
                  >
                    <option value="">Choose van...</option>
                    <option value="van1">VAN-001 - Toyota Hiace</option>
                    <option value="van2">VAN-002 - Ford Transit</option>
                    <option value="van3">VAN-003 - Mercedes Sprinter</option>
                  </select>
                </div>

                {/* Cash Float */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cash Float
                  </label>
                  <Input
                    type="number"
                    value={cashFloat}
                    onChange={(e) => setCashFloat(Number(e.target.value))}
                  />
                </div>

                {/* Load Items */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Items ({loadItems.length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {loadItems.map(item => (
                      <div key={item.productId} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                        <span className="flex-1 truncate">{item.productName}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock Value:</span>
                    <span className="font-medium">${calculateTotalValue().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cash Float:</span>
                    <span className="font-medium">${cashFloat.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>${(calculateTotalValue() + cashFloat).toLocaleString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    fullWidth
                    disabled={!selectedVan || loadItems.length === 0}
                    onClick={() => {
                      console.log('Loading van...', { selectedVan, loadItems, cashFloat })
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Loading
                  </Button>
                  <Button variant="outline" fullWidth>
                    Print Load Sheet
                  </Button>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>

        {/* Active Loads Table */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">Active Van Loads</h3>
          </Card.Header>
          <Card.Content>
            <DataTable
              columns={[
                { header: 'Van', accessor: 'vanCode' },
                { header: 'Salesman', accessor: 'salesmanName' },
                { header: 'Load Time', accessor: 'loadTime' },
                { 
                  header: 'Stock Value', 
                  accessor: 'stockValue',
                  cell: ({ value }) => `$${value.toLocaleString()}`
                },
                { 
                  header: 'Cash Float', 
                  accessor: 'cashFloat',
                  cell: ({ value }) => `$${value.toLocaleString()}`
                },
                { 
                  header: 'Status', 
                  accessor: 'status',
                  cell: ({ value }) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      value === 'in_field' ? 'bg-blue-100 text-blue-800' :
                      value === 'returning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {value.replace('_', ' ')}
                    </span>
                  )
                },
                { 
                  header: 'Actions', 
                  accessor: 'id',
                  cell: ({ row }) => (
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  ),
                },
              ]}
              data={activeLoads}
            />
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>)
}
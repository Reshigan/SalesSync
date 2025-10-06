'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Package, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Camera,
  Calculator,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface ReconciliationItem {
  productId: string
  productName: string
  loaded: number
  sold: number
  returned: number
  damaged: number
  variance: number
}

interface CashReconciliation {
  openingFloat: number
  cashSales: number
  totalExpected: number
  actualCash: number
  variance: number
}

export default function ReconciliationPage() {
  const [selectedLoad, setSelectedLoad] = useState('load1')
  const [actualCash, setActualCash] = useState(7250)
  const [expenses, setExpenses] = useState([
    { description: 'Fuel', amount: 50 },
    { description: 'Parking', amount: 10 },
  ])
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0 })
  const [damagedItems, setDamagedItems] = useState<any[]>([])

  // Mock data for today's load
  const todayLoad = {
    id: 'load1',
    vanCode: 'VAN-001',
    salesmanName: 'John Doe',
    loadDate: '2024-10-01',
    openingFloat: 5000,
    stockLoaded: [
      { productId: '1', productName: 'Coca Cola 500ml', quantity: 50, unitPrice: 2.50 },
      { productId: '2', productName: 'Pepsi 500ml', quantity: 40, unitPrice: 2.45 },
      { productId: '3', productName: 'Sprite 500ml', quantity: 30, unitPrice: 2.40 },
      { productId: '4', productName: 'Fanta Orange 500ml', quantity: 35, unitPrice: 2.40 },
    ]
  }

  // Mock sales data
  const salesData = [
    { productId: '1', sold: 45 },
    { productId: '2', sold: 38 },
    { productId: '3', sold: 28 },
    { productId: '4', sold: 32 },
  ]

  const calculateReconciliation = (): ReconciliationItem[] => {
    return todayLoad.stockLoaded.map(loadedItem => {
      const sold = salesData.find(s => s.productId === loadedItem.productId)?.sold || 0
      const damaged = damagedItems.find(d => d.productId === loadedItem.productId)?.quantity || 0
      const returned = loadedItem.quantity - sold - damaged
      const variance = loadedItem.quantity - (sold + returned + damaged)

      return {
        productId: loadedItem.productId,
        productName: loadedItem.productName,
        loaded: loadedItem.quantity,
        sold,
        returned,
        damaged,
        variance,
      }
    })
  }

  const reconciliationItems = calculateReconciliation()
  const totalCashSales = salesData.reduce((sum, sale) => {
    const product = todayLoad.stockLoaded.find(p => p.productId === sale.productId)
    return sum + (sale.sold * (product?.unitPrice || 0))
  }, 0)

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const expectedCash = todayLoad.openingFloat + totalCashSales - totalExpenses
  const cashVariance = actualCash - expectedCash

  const cashReconciliation: CashReconciliation = {
    openingFloat: todayLoad.openingFloat,
    cashSales: totalCashSales,
    totalExpected: expectedCash,
    actualCash,
    variance: cashVariance,
  }

  const hasDiscrepancies = reconciliationItems.some(item => item.variance !== 0) || Math.abs(cashVariance) > 5

  const addExpense = () => {
    if (newExpense.description && newExpense.amount > 0) {
      setExpenses([...expenses, newExpense])
      setNewExpense({ description: '', amount: 0 })
    }
  }

  const addDamagedItem = (productId: string, quantity: number) => {
    const existing = damagedItems.find(item => item.productId === productId)
    if (existing) {
      setDamagedItems(damagedItems.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      ))
    } else {
      const product = todayLoad.stockLoaded.find(p => p.productId === productId)
      setDamagedItems([...damagedItems, {
        productId,
        productName: product?.productName,
        quantity,
      }])
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Van Reconciliation</h1>
            <p className="text-gray-600">Reconcile stock and cash for {todayLoad.salesmanName} - {todayLoad.vanCode}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Camera className="w-4 h-4 mr-2" />
              Add Photos
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Products Loaded</p>
                <p className="text-2xl font-bold">{todayLoad.stockLoaded.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cash Sales</p>
                <p className="text-2xl font-bold">${totalCashSales.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cash Variance</p>
                <p className={`text-2xl font-bold ${cashVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(cashVariance).toFixed(2)}
                </p>
              </div>
              {cashVariance >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500" />
              )}
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-bold ${hasDiscrepancies ? 'text-orange-600' : 'text-green-600'}`}>
                  {hasDiscrepancies ? 'Discrepancy' : 'Balanced'}
                </p>
              </div>
              {hasDiscrepancies ? (
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-500" />
              )}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Stock Reconciliation */}
          <div className="col-span-2">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold">Stock Reconciliation</h3>
              </Card.Header>
              <Card.Content>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Loaded</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Sold</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Returned</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Damaged</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reconciliationItems.map((item) => (
                        <tr key={item.productId} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{item.productName}</p>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4 text-gray-900">{item.loaded}</td>
                          <td className="text-center py-3 px-4 text-green-600 font-medium">{item.sold}</td>
                          <td className="text-center py-3 px-4 text-blue-600">{item.returned}</td>
                          <td className="text-center py-3 px-4">
                            <Input
                              type="number"
                              value={item.damaged}
                              onChange={(e) => addDamagedItem(item.productId, parseInt(e.target.value) || 0)}
                              className="w-16 text-center"
                              min="0"
                              max={item.loaded}
                            />
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`font-medium ${
                              item.variance === 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {item.variance}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Damaged Items Section */}
                {damagedItems.length > 0 && (
                  <div className="mt-6 p-4 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">Damaged Items</h4>
                    <div className="space-y-2">
                      {damagedItems.map((item) => (
                        <div key={item.productId} className="flex justify-between text-sm">
                          <span>{item.productName}</span>
                          <span className="font-medium">{item.quantity} units</span>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="mt-3">
                      <Camera className="w-4 h-4 mr-2" />
                      Add Damage Photos
                    </Button>
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>

          {/* Cash Reconciliation */}
          <div>
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold">Cash Reconciliation</h3>
              </Card.Header>
              <Card.Content className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Opening Float</span>
                    <span className="font-medium">${cashReconciliation.openingFloat.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cash Sales</span>
                    <span className="font-medium text-green-600">${cashReconciliation.cashSales.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">${(cashReconciliation.openingFloat + cashReconciliation.cashSales).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-gray-900 mb-2">Expenses</h4>
                    <div className="space-y-2">
                      {expenses.map((expense, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">{expense.description}</span>
                          <span className="text-red-600">-${expense.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Add Expense */}
                    <div className="mt-3 space-y-2">
                      <Input
                        placeholder="Expense description"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={newExpense.amount || ''}
                          onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                        />
                        <Button size="sm" onClick={addExpense}>Add</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Expected</span>
                      <span className="font-medium">${cashReconciliation.totalExpected.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Actual Cash Input */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Cash Count
                  </label>
                  <Input
                    type="number"
                    value={actualCash}
                    onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
                    leftIcon={<DollarSign className="w-4 h-4 text-gray-400" />}
                  />
                </div>

                {/* Variance Display */}
                <div className={`p-4 rounded-lg ${
                  Math.abs(cashVariance) <= 5 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Cash Variance</span>
                    <span className={`text-lg font-bold ${
                      cashVariance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {cashVariance >= 0 ? '+' : ''}${cashVariance.toFixed(2)}
                    </span>
                  </div>
                  {Math.abs(cashVariance) > 5 && (
                    <p className="text-sm text-red-600 mt-1">
                      Variance exceeds acceptable limit ($5.00)
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    fullWidth
                    disabled={hasDiscrepancies && Math.abs(cashVariance) > 50}
                    onClick={() => {
                      console.log('Submitting reconciliation...', {
                        stockReconciliation: reconciliationItems,
                        cashReconciliation,
                        expenses,
                        damagedItems,
                      })
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {hasDiscrepancies ? 'Submit with Discrepancies' : 'Complete Reconciliation'}
                  </Button>
                  
                  {hasDiscrepancies && (
                    <Button variant="outline" fullWidth>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Flag for Manager Review
                    </Button>
                  )}
                  
                  <Button variant="outline" fullWidth>
                    <Calculator className="w-4 h-4 mr-2" />
                    Recount Cash
                  </Button>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>

        {/* Discrepancy Notes */}
        {hasDiscrepancies && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-orange-600">Discrepancy Notes</h3>
            </Card.Header>
            <Card.Content>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
                placeholder="Please explain any discrepancies found during reconciliation..."
              />
              <div className="mt-3 flex justify-end">
                <Button>Save Notes</Button>
              </div>
            </Card.Content>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
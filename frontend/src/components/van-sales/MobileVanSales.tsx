'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MapPin, 
  Navigation, 
  Package, 
  DollarSign, 
  Users, 
  Clock,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  CheckCircle,
  AlertCircle,
  Truck,
  ShoppingCart,
  FileText,
  Camera,
  Mic,
  Star
} from 'lucide-react'

interface Location {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface Customer {
  id: string
  name: string
  address: string
  phone: string
  location: Location
  lastVisit?: string
  totalOrders: number
  outstandingAmount: number
  creditLimit: number
  status: 'active' | 'inactive' | 'blocked'
}

interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category: string
  image?: string
}

interface Order {
  id: string
  customerId: string
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  total: number
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
  timestamp: number
  location?: Location
}

export default function MobileVanSales() {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [battery, setBattery] = useState(100)
  const [signal, setSignal] = useState(4)
  const [activeTab, setActiveTab] = useState<'route' | 'customers' | 'products' | 'orders' | 'cash'>('route')
  
  // Van Sales Data
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [todayStats, setTodayStats] = useState({
    visitedCustomers: 0,
    totalOrders: 0,
    totalSales: 0,
    cashCollected: 0,
    routeProgress: 0
  })

  // Initialize location tracking
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          })
        },
        (error) => {
          console.error('Location error:', error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Mock data initialization
  useEffect(() => {
    // Initialize with sample data
    setCustomers([
      {
        id: '1',
        name: 'ABC Store',
        address: '123 Main St, City',
        phone: '+1234567890',
        location: { latitude: 40.7128, longitude: -74.0060, accuracy: 10, timestamp: Date.now() },
        lastVisit: '2025-10-10',
        totalOrders: 45,
        outstandingAmount: 1250.00,
        creditLimit: 5000.00,
        status: 'active'
      },
      {
        id: '2',
        name: 'XYZ Market',
        address: '456 Oak Ave, City',
        phone: '+1234567891',
        location: { latitude: 40.7589, longitude: -73.9851, accuracy: 15, timestamp: Date.now() },
        lastVisit: '2025-10-09',
        totalOrders: 32,
        outstandingAmount: 850.00,
        creditLimit: 3000.00,
        status: 'active'
      }
    ])

    setProducts([
      {
        id: '1',
        name: 'Premium Cola 500ml',
        sku: 'COL-500-001',
        price: 2.50,
        stock: 48,
        category: 'Beverages'
      },
      {
        id: '2',
        name: 'Chocolate Bar 100g',
        sku: 'CHO-100-001',
        price: 3.75,
        stock: 24,
        category: 'Confectionery'
      }
    ])

    setTodayStats({
      visitedCustomers: 3,
      totalOrders: 8,
      totalSales: 1245.50,
      cashCollected: 890.25,
      routeProgress: 45
    })
  }, [])

  const StatusBar = () => (
    <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center text-sm">
      <div className="flex items-center space-x-2">
        <span className="font-medium">09:57</span>
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-400" />
        )}
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex">
          {[...Array(signal)].map((_, i) => (
            <div key={i} className="w-1 h-3 bg-white mr-0.5 rounded-sm" />
          ))}
        </div>
        <Battery className="w-4 h-4" />
        <span>{battery}%</span>
      </div>
    </div>
  )

  const QuickStats = () => (
    <div className="bg-white p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{todayStats.visitedCustomers}</div>
          <div className="text-xs text-gray-600">Customers Visited</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">${todayStats.totalSales}</div>
          <div className="text-xs text-gray-600">Total Sales</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{todayStats.totalOrders}</div>
          <div className="text-xs text-gray-600">Orders</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{todayStats.routeProgress}%</div>
          <div className="text-xs text-gray-600">Route Progress</div>
        </div>
      </div>
    </div>
  )

  const RouteTab = () => (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Current Location</h3>
          <MapPin className="w-5 h-5 text-blue-600" />
        </div>
        {currentLocation ? (
          <div className="text-sm text-gray-600">
            <p>Lat: {currentLocation.latitude.toFixed(6)}</p>
            <p>Lng: {currentLocation.longitude.toFixed(6)}</p>
            <p>Accuracy: ±{currentLocation.accuracy}m</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Getting location...</p>
        )}
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Next Customers</h3>
        <div className="space-y-3">
          {customers.slice(0, 3).map((customer) => (
            <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{customer.name}</p>
                <p className="text-sm text-gray-600">{customer.address}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600">Navigate</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const CustomersTab = () => (
    <div className="p-4 space-y-4">
      {customers.map((customer) => (
        <div key={customer.id} className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{customer.name}</h3>
            <div className={`px-2 py-1 rounded-full text-xs ${
              customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {customer.status}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">{customer.address}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Outstanding:</span>
              <span className="font-medium ml-1">${customer.outstandingAmount}</span>
            </div>
            <div>
              <span className="text-gray-500">Credit Limit:</span>
              <span className="font-medium ml-1">${customer.creditLimit}</span>
            </div>
          </div>
          <div className="flex space-x-2 mt-3">
            <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium">
              Visit
            </button>
            <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium">
              Call
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  const ProductsTab = () => (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Van Inventory</h3>
          <Package className="w-5 h-5 text-blue-600" />
        </div>
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-600">{product.sku}</p>
                <p className="text-sm font-medium text-green-600">${product.price}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{product.stock}</p>
                <p className="text-xs text-gray-500">in stock</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const OrdersTab = () => (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Today's Orders</h3>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No orders yet today</p>
            <button className="mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
              Create Order
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Order #{order.id}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">Customer: {order.customerId}</p>
                <p className="text-lg font-bold text-green-600">${order.total}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const CashTab = () => (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Cash Management</h3>
        <div className="space-y-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-green-800 font-medium">Cash Collected</span>
              <span className="text-2xl font-bold text-green-600">${todayStats.cashCollected}</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">Credit Sales</span>
              <span className="text-2xl font-bold text-blue-600">${todayStats.totalSales - todayStats.cashCollected}</span>
            </div>
          </div>
          <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium">
            Record Cash Collection
          </button>
          <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium">
            End of Day Reconciliation
          </button>
        </div>
      </div>
    </div>
  )

  const BottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        {[
          { id: 'route', icon: Navigation, label: 'Route' },
          { id: 'customers', icon: Users, label: 'Customers' },
          { id: 'products', icon: Package, label: 'Products' },
          { id: 'orders', icon: ShoppingCart, label: 'Orders' },
          { id: 'cash', icon: DollarSign, label: 'Cash' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg ${
              activeTab === tab.id ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <tab.icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'route': return <RouteTab />
      case 'customers': return <CustomersTab />
      case 'products': return <ProductsTab />
      case 'orders': return <OrdersTab />
      case 'cash': return <CashTab />
      default: return <RouteTab />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <StatusBar />
      
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Van Sales</h1>
            <p className="text-blue-100 text-sm">Route: Downtown Circuit</p>
          </div>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-400" />
            )}
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      <QuickStats />

      {/* Content */}
      <div className="pb-20">
        {renderActiveTab()}
      </div>

      <BottomNavigation />

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-20 left-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <WifiOff className="w-5 h-5 mr-2" />
            <span className="font-medium">Working Offline</span>
          </div>
          <p className="text-sm mt-1">Data will sync when connection is restored</p>
        </div>
      )}
    </div>
  )
}
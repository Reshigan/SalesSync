'use client'
import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { MapPin, Plus, Search, Download, Eye, Edit, Navigation, Users, CheckCircle, Clock } from 'lucide-react'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import vanSalesService from '@/services/van-sales.service';

interface VanRoute {
  id: string
  routeNumber: string
  routeName: string
  driver: string
  van: string
  customers: number
  plannedVisits: number
  completedVisits: number
  routeDate: string
  status: 'planned' | 'in_progress' | 'completed'
  distance: number
}

export default function VanRoutesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const routes: VanRoute[] = [
    { id: '1', routeNumber: 'VR-001', routeName: 'Lagos Central', driver: 'John Driver', van: 'VAN-001', customers: 25, plannedVisits: 20, completedVisits: 18, routeDate: '2025-10-04', status: 'in_progress', distance: 45 },
    { id: '2', routeNumber: 'VR-002', routeName: 'Ikeja Industrial', driver: 'Mary Agent', van: 'VAN-002', customers: 30, plannedVisits: 25, completedVisits: 25, routeDate: '2025-10-03', status: 'completed', distance: 52 },
    { id: '3', routeNumber: 'VR-003', routeName: 'Victoria Island', driver: 'Peter Sales', van: 'VAN-003', customers: 18, plannedVisits: 15, completedVisits: 0, routeDate: '2025-10-05', status: 'planned', distance: 38 }
  ]

  const stats = {
    activeRoutes: routes.filter(r => r.status === 'in_progress').length,
    totalCustomers: routes.reduce((sum, r) => sum + r.customers, 0),
    todayVisits: routes.filter(r => r.routeDate === '2025-10-04').reduce((sum, r) => sum + r.plannedVisits, 0),
    completed: routes.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.completedVisits, 0),
    pending: routes.filter(r => r.status === 'planned').length
  }

  const filteredRoutes = routes.filter(r => {
    const matchesSearch = r.routeNumber.toLowerCase().includes(searchTerm.toLowerCase()) || r.routeName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      planned: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700'
    }
    return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${colors[status]}`}>{status.replace('_', ' ')}</span>
  }

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl"><MapPin className="w-8 h-8 text-white" /></div>
              Van Sales Routes
            </h1>
            <p className="text-gray-600 mt-1">Plan and optimize delivery routes</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg">
            <Plus className="w-5 h-5" />Create Route
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-indigo-600">Active</p><p className="text-2xl font-bold">{stats.activeRoutes}</p></div>
              <Navigation className="w-10 h-10 text-indigo-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-purple-600">Customers</p><p className="text-2xl font-bold">{stats.totalCustomers}</p></div>
              <Users className="w-10 h-10 text-purple-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-blue-600">Today</p><p className="text-2xl font-bold">{stats.todayVisits}</p></div>
              <MapPin className="w-10 h-10 text-blue-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-green-600">Completed</p><p className="text-2xl font-bold">{stats.completed}</p></div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-yellow-600">Pending</p><p className="text-2xl font-bold">{stats.pending}</p></div>
              <Clock className="w-10 h-10 text-yellow-400" />
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Search routes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
              </div>
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
              <option value="all">All Status</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg"><Download className="w-4 h-4" />Export</button>
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Route #', 'Route Name', 'Driver', 'Van', 'Customers', 'Visits', 'Date', 'Distance', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRoutes.map(route => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="text-sm font-medium text-indigo-600">{route.routeNumber}</div></td>
                    <td className="px-6 py-4 text-sm font-medium">{route.routeName}</td>
                    <td className="px-6 py-4 text-sm">{route.driver}</td>
                    <td className="px-6 py-4 text-sm">{route.van}</td>
                    <td className="px-6 py-4 text-sm">{route.customers}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-green-600">{route.completedVisits}</span>
                      <span className="text-gray-400">/{route.plannedVisits}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">{new Date(route.routeDate).toLocaleDateString('en-GB')}</td>
                    <td className="px-6 py-4 text-sm">{route.distance} km</td>
                    <td className="px-6 py-4">{getStatusBadge(route.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="text-blue-600"><Eye className="w-4 h-4" /></button>
                        <button className="text-gray-600"><Edit className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>)
}

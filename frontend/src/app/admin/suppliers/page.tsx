'use client'

import { useState, useEffect } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import apiService from '@/lib/api'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Building, 
  MapPin,
  Phone,
  Mail,
  Filter,
  Download,
  Upload,
  Package,
  DollarSign,
  Calendar,
  Star,
  Globe
} from 'lucide-react'

interface Supplier {
  id: string
  code: string
  name: string
  type: 'manufacturer' | 'distributor' | 'wholesaler' | 'service_provider'
  category: string
  contact_person: string
  email: string
  phone: string
  website?: string
  address: string
  city: string
  province: string
  postal_code: string
  country: string
  tax_number?: string
  registration_number?: string
  payment_terms: string
  credit_limit?: number
  current_balance?: number
  rating: number
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  contract_start?: string
  contract_end?: string
  last_order_date?: string
  total_orders?: number
  ytd_spend?: number
  created_at: string
  updated_at: string
}

export default function SuppliersPage() {
  const { hasPermission } = usePermissions()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'manufacturer' as 'manufacturer' | 'distributor' | 'wholesaler' | 'service_provider',
    category: '',
    contact_person: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'South Africa',
    tax_number: '',
    registration_number: '',
    payment_terms: '',
    credit_limit: '',
    rating: '3',
    status: 'active' as 'active' | 'inactive' | 'suspended' | 'pending',
    contract_start: '',
    contract_end: ''
  })

  // Mock data for now - will be replaced with real API calls
  useEffect(() => {
    setTimeout(() => {
      setSuppliers([
        {
          id: '1',
          code: 'SUP001',
          name: 'PepsiCo Manufacturing SA',
          type: 'manufacturer',
          category: 'Beverages',
          contact_person: 'John Manufacturing',
          email: 'john.m@pepsico.com',
          phone: '+27 11 123 4567',
          website: 'https://pepsico.com',
          address: '123 Manufacturing Street',
          city: 'Johannesburg',
          province: 'Gauteng',
          postal_code: '2001',
          country: 'South Africa',
          tax_number: '9876543210',
          registration_number: 'REG001',
          payment_terms: 'Net 30',
          credit_limit: 5000000,
          current_balance: 2500000,
          rating: 5,
          status: 'active',
          contract_start: '2023-01-01',
          contract_end: '2025-12-31',
          last_order_date: '2024-01-15',
          total_orders: 156,
          ytd_spend: 12500000,
          created_at: '2023-01-01',
          updated_at: '2024-01-15'
        },
        {
          id: '2',
          code: 'SUP002',
          name: 'Cape Logistics Distribution',
          type: 'distributor',
          category: 'Logistics',
          contact_person: 'Sarah Distribution',
          email: 'sarah.d@capelogistics.com',
          phone: '+27 21 234 5678',
          website: 'https://capelogistics.com',
          address: '456 Distribution Avenue',
          city: 'Cape Town',
          province: 'Western Cape',
          postal_code: '8001',
          country: 'South Africa',
          tax_number: '8765432109',
          registration_number: 'REG002',
          payment_terms: 'Net 15',
          credit_limit: 2000000,
          current_balance: 850000,
          rating: 4,
          status: 'active',
          contract_start: '2023-03-15',
          contract_end: '2024-03-14',
          last_order_date: '2024-01-12',
          total_orders: 89,
          ytd_spend: 4200000,
          created_at: '2023-03-15',
          updated_at: '2024-01-12'
        },
        {
          id: '3',
          code: 'SUP003',
          name: 'KZN Wholesale Suppliers',
          type: 'wholesaler',
          category: 'General Supplies',
          contact_person: 'Mike Wholesale',
          email: 'mike.w@kznwholesale.com',
          phone: '+27 31 345 6789',
          address: '789 Wholesale Road',
          city: 'Durban',
          province: 'KwaZulu-Natal',
          postal_code: '4001',
          country: 'South Africa',
          tax_number: '7654321098',
          registration_number: 'REG003',
          payment_terms: 'Net 45',
          credit_limit: 1500000,
          current_balance: 650000,
          rating: 3,
          status: 'active',
          contract_start: '2023-06-01',
          contract_end: '2024-05-31',
          last_order_date: '2024-01-10',
          total_orders: 67,
          ytd_spend: 2800000,
          created_at: '2023-06-01',
          updated_at: '2024-01-10'
        },
        {
          id: '4',
          code: 'SUP004',
          name: 'Tech Solutions Provider',
          type: 'service_provider',
          category: 'Technology',
          contact_person: 'Lisa Technology',
          email: 'lisa.t@techsolutions.com',
          phone: '+27 12 456 7890',
          website: 'https://techsolutions.com',
          address: '321 Tech Park',
          city: 'Pretoria',
          province: 'Gauteng',
          postal_code: '0001',
          country: 'South Africa',
          tax_number: '6543210987',
          registration_number: 'REG004',
          payment_terms: 'Net 30',
          credit_limit: 800000,
          current_balance: 125000,
          rating: 4,
          status: 'suspended',
          contract_start: '2023-09-01',
          contract_end: '2024-08-31',
          last_order_date: '2023-12-20',
          total_orders: 23,
          ytd_spend: 950000,
          created_at: '2023-09-01',
          updated_at: '2023-12-20'
        }
      ])
      
      setLoading(false)
    }, 1000)
  }, [])

  // Get unique categories for filter
  const categories = Array.from(new Set(suppliers.map(s => s.category)))

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter
    const matchesType = typeFilter === 'all' || supplier.type === typeFilter
    const matchesCategory = categoryFilter === 'all' || supplier.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesType && matchesCategory
  })

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Saving supplier:', formData)
    setShowModal(false)
    resetForm()
  }

  // Handle delete
  const handleDelete = async (supplier: Supplier) => {
    if (confirm(`Are you sure you want to delete supplier "${supplier.name}"?`)) {
      console.log('Deleting supplier:', supplier.id)
      setSuppliers(suppliers.filter(s => s.id !== supplier.id))
    }
  }

  // Handle edit
  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      code: supplier.code,
      name: supplier.name,
      type: supplier.type,
      category: supplier.category,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      website: supplier.website || '',
      address: supplier.address,
      city: supplier.city,
      province: supplier.province,
      postal_code: supplier.postal_code,
      country: supplier.country,
      tax_number: supplier.tax_number || '',
      registration_number: supplier.registration_number || '',
      payment_terms: supplier.payment_terms,
      credit_limit: supplier.credit_limit?.toString() || '',
      rating: supplier.rating.toString(),
      status: supplier.status,
      contract_start: supplier.contract_start || '',
      contract_end: supplier.contract_end || ''
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setEditingSupplier(null)
    setFormData({
      code: '',
      name: '',
      type: 'manufacturer',
      category: '',
      contact_person: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      province: '',
      postal_code: '',
      country: 'South Africa',
      tax_number: '',
      registration_number: '',
      payment_terms: '',
      credit_limit: '',
      rating: '3',
      status: 'active',
      contract_start: '',
      contract_end: ''
    })
  }

  // Get type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'manufacturer': return 'bg-blue-100 text-blue-800'
      case 'distributor': return 'bg-green-100 text-green-800'
      case 'wholesaler': return 'bg-purple-100 text-purple-800'
      case 'service_provider': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get rating stars
  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-xs text-gray-600">{rating}/5</span>
      </div>
    )
  }

  // Calculate credit utilization
  const getCreditUtilization = (current?: number, limit?: number) => {
    if (!current || !limit) return 0
    return Math.round((current / limit) * 100)
  }

  // Table columns
  const columns = [
    {
      header: 'Code',
      accessor: 'code',
      sortable: true,
      cell: ({ row }: { row: Supplier }) => (
        <div className="font-medium text-gray-900">{row.code}</div>
      )
    },
    {
      header: 'Supplier Name',
      accessor: 'name',
      sortable: true,
      cell: ({ row }: { row: Supplier }) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">{row.category}</div>
          {row.website && (
            <div className="flex items-center text-xs text-blue-600">
              <Globe className="h-3 w-3 mr-1" />
              <a href={row.website} target="_blank" rel="noopener noreferrer">
                Website
              </a>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'type',
      cell: ({ row }: { row: Supplier }) => (
        <Badge className={getTypeColor(row.type)}>
          {row.type.replace('_', ' ')}
        </Badge>
      )
    },
    {
      header: 'Contact',
      accessor: 'contact',
      cell: ({ row }: { row: Supplier }) => (
        <div className="text-sm">
          <div className="font-medium">{row.contact_person}</div>
          <div className="flex items-center text-gray-500">
            <Phone className="h-3 w-3 mr-1" />
            {row.phone}
          </div>
          <div className="flex items-center text-gray-500">
            <Mail className="h-3 w-3 mr-1" />
            {row.email}
          </div>
        </div>
      )
    },
    {
      header: 'Location',
      accessor: 'location',
      cell: ({ row }: { row: Supplier }) => (
        <div className="text-sm">
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
            <span>{row.city}</span>
          </div>
          <div className="text-xs text-gray-500">{row.province}</div>
        </div>
      )
    },
    {
      header: 'Financial',
      accessor: 'financial',
      cell: ({ row }: { row: Supplier }) => {
        const utilization = getCreditUtilization(row.current_balance, row.credit_limit)
        return (
          <div className="text-sm">
            <div className="flex items-center">
              <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
              <span className="font-medium">
                R{row.current_balance?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Limit: R{row.credit_limit?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-gray-500">
              {row.payment_terms}
            </div>
          </div>
        )
      }
    },
    {
      header: 'Performance',
      accessor: 'performance',
      cell: ({ row }: { row: Supplier }) => (
        <div className="text-sm">
          {getRatingStars(row.rating)}
          <div className="text-xs text-gray-500 mt-1">
            {row.total_orders || 0} orders
          </div>
          <div className="text-xs text-gray-500">
            YTD: R{row.ytd_spend?.toLocaleString() || '0'}
          </div>
        </div>
      )
    },
    {
      header: 'Contract',
      accessor: 'contract',
      cell: ({ row }: { row: Supplier }) => (
        <div className="text-sm">
          {row.contract_start && row.contract_end ? (
            <>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                <span className="text-xs">
                  {new Date(row.contract_start).toLocaleDateString()} - 
                  {new Date(row.contract_end).toLocaleDateString()}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(row.contract_end) > new Date() ? 'Active' : 'Expired'}
              </div>
            </>
          ) : (
            <span className="text-xs text-gray-500">No contract</span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: ({ row }: { row: Supplier }) => (
        <Badge variant={
          row.status === 'active' ? 'success' : 
          row.status === 'suspended' ? 'warning' :
          row.status === 'pending' ? 'info' : 'secondary'
        }>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: ({ row }: { row: Supplier }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers Management</h1>
            <p className="text-gray-600">Manage supplier relationships, contracts, and performance</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
                <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Suppliers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {suppliers.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">YTD Spend</p>
                <p className="text-2xl font-bold text-gray-900">
                  R{suppliers.reduce((sum, s) => sum + (s.ytd_spend || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'pending', label: 'Pending' }
              ]}
            />
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'manufacturer', label: 'Manufacturer' },
                { value: 'distributor', label: 'Distributor' },
                { value: 'wholesaler', label: 'Wholesaler' },
                { value: 'service_provider', label: 'Service Provider' }
              ]}
            />
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map(category => ({ value: category, label: category }))
              ]}
            />
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setTypeFilter('all')
                setCategoryFilter('all')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </Card>

        {/* Data Table */}
        <Card>
          <DataTable
            data={filteredSuppliers}
            columns={columns}
            loading={loading}
            emptyMessage="No suppliers found"
          />
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            resetForm()
          }}
          title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        >
          <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Code *
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., SUP001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., ABC Manufacturing"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  required
                  options={[
                    { value: 'manufacturer', label: 'Manufacturer' },
                    { value: 'distributor', label: 'Distributor' },
                    { value: 'wholesaler', label: 'Wholesaler' },
                    { value: 'service_provider', label: 'Service Provider' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Beverages"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <Select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  options={[
                    { value: '1', label: '1 Star' },
                    { value: '2', label: '2 Stars' },
                    { value: '3', label: '3 Stars' },
                    { value: '4', label: '4 Stars' },
                    { value: '5', label: '5 Stars' }
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person *
                </label>
                <Input
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="e.g., John Smith"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., contact@supplier.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., +27 11 123 4567"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="e.g., https://supplier.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., 123 Business Street"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., Johannesburg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Province *
                </label>
                <Select
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  required
                  options={[
                    { value: '', label: 'Select Province' },
                    { value: 'Gauteng', label: 'Gauteng' },
                    { value: 'Western Cape', label: 'Western Cape' },
                    { value: 'KwaZulu-Natal', label: 'KwaZulu-Natal' },
                    { value: 'Eastern Cape', label: 'Eastern Cape' },
                    { value: 'Free State', label: 'Free State' },
                    { value: 'Limpopo', label: 'Limpopo' },
                    { value: 'Mpumalanga', label: 'Mpumalanga' },
                    { value: 'North West', label: 'North West' },
                    { value: 'Northern Cape', label: 'Northern Cape' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <Input
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="e.g., 2001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Number
                </label>
                <Input
                  value={formData.tax_number}
                  onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                  placeholder="e.g., 9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number
                </label>
                <Input
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  placeholder="e.g., REG001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <Input
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  placeholder="e.g., Net 30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Limit (R)
                </label>
                <Input
                  type="number"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                  placeholder="e.g., 1000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Start
                </label>
                <Input
                  type="date"
                  value={formData.contract_start}
                  onChange={(e) => setFormData({ ...formData, contract_start: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract End
                </label>
                <Input
                  type="date"
                  value={formData.contract_end}
                  onChange={(e) => setFormData({ ...formData, contract_end: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'suspended', label: 'Suspended' },
                  { value: 'pending', label: 'Pending' }
                ]}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
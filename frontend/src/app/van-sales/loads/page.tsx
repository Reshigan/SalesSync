'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Truck,
  User,
  Calendar,
  DollarSign,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface VanLoad {
  id: string;
  load_date: string;
  status: string;
  cash_collected: number;
  cash_float: number;
  registration_number: string;
  salesman_name: string;
  items_loaded: number;
  items_sold: number;
  van_model: string;
  created_at: string;
}

export default function VanLoadsPage() {
  const [loads, setLoads] = useState<VanLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/van-sales/loads');
      if (response.success) {
        setLoads(response.data.loads || []);
      } else {
        setError(response.error?.message || 'Failed to fetch loads');
      }
    } catch (err) {
      setError('Failed to fetch loads');
      console.error('Loads fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loading': return 'bg-blue-100 text-blue-800';
      case 'in_field': return 'bg-green-100 text-green-800';
      case 'returning': return 'bg-yellow-100 text-yellow-800';
      case 'reconciling': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading': return <Package className="h-4 w-4" />;
      case 'in_field': return <Truck className="h-4 w-4" />;
      case 'returning': return <MapPin className="h-4 w-4" />;
      case 'reconciling': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredLoads = loads.filter(load => {
    const matchesSearch = load.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         load.salesman_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         load.van_model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || load.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const loadDate = new Date(load.load_date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = loadDate.toDateString() === today.toDateString();
          break;
        case 'yesterday':
          matchesDate = loadDate.toDateString() === yesterday.toDateString();
          break;
        case 'week':
          matchesDate = loadDate >= weekAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Van Loads</h1>
          <p className="text-gray-600 mt-2">Manage van loading and reconciliation activities</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/van-sales')} variant="outline">
            Back to Dashboard
          </Button>
          <Button onClick={() => router.push('/van-sales/loads/new')} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Load
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by van registration, salesman, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="loading">Loading</SelectItem>
                  <SelectItem value="in_field">In Field</SelectItem>
                  <SelectItem value="returning">Returning</SelectItem>
                  <SelectItem value="reconciling">Reconciling</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Load History</CardTitle>
          <CardDescription>
            {filteredLoads.length} load{filteredLoads.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLoads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No loads found</h3>
              <p className="mb-4">
                {loads.length === 0 
                  ? "Start by creating your first van load"
                  : "Try adjusting your search or filter criteria"
                }
              </p>
              {loads.length === 0 && (
                <Button onClick={() => router.push('/van-sales/loads/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Load
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Load Date</TableHead>
                  <TableHead>Van</TableHead>
                  <TableHead>Salesman</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Cash Float</TableHead>
                  <TableHead>Cash Collected</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoads.map((load) => (
                  <TableRow key={load.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {new Date(load.load_date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(load.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{load.registration_number}</div>
                          <div className="text-sm text-gray-500">{load.van_model}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{load.salesman_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(load.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(load.status)}
                          <span className="capitalize">{load.status.replace('_', ' ')}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{load.items_loaded || 0} loaded</div>
                          {load.items_sold > 0 && (
                            <div className="text-sm text-green-600">{load.items_sold} sold</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span>${load.cash_float?.toLocaleString() || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-green-600">
                          ${load.cash_collected?.toLocaleString() || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/van-sales/loads/${load.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {load.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/van-sales/loads/${load.id}/reconcile`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {loads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loads</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loads.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loads</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loads.filter(l => ['loading', 'in_field', 'returning', 'reconciling'].includes(l.status)).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Loads</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loads.filter(l => l.status === 'completed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cash Collected</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${loads.reduce((sum, l) => sum + (l.cash_collected || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  User,
  Calendar,
  Package,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface Van {
  id: string;
  registration_number: string;
  model: string;
  capacity_units: number;
  assigned_salesman_id: string;
  salesman_name: string;
  status: string;
  total_loads: number;
  last_load_date: string;
}

interface NewVan {
  registration_number: string;
  model: string;
  capacity_units: number;
  assigned_salesman_id: string;
}

export default function VansPage() {
  const [vans, setVans] = useState<Van[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVan, setNewVan] = useState<NewVan>({
    registration_number: '',
    model: '',
    capacity_units: 0,
    assigned_salesman_id: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchVans();
  }, []);

  const fetchVans = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/van-sales/vans');
      if (response.success) {
        setVans(response.data.vans || []);
      } else {
        setError(response.error?.message || 'Failed to fetch vans');
      }
    } catch (err) {
      setError('Failed to fetch vans');
      console.error('Vans fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVan = async () => {
    if (!newVan.registration_number || !newVan.model || !newVan.capacity_units) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.post('/van-sales/vans', newVan);
      if (response.success) {
        setShowAddDialog(false);
        setNewVan({
          registration_number: '',
          model: '',
          capacity_units: 0,
          assigned_salesman_id: ''
        });
        fetchVans();
      } else {
        setError(response.error?.message || 'Failed to create van');
      }
    } catch (err) {
      setError('Failed to create van');
      console.error('Van creation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <AlertCircle className="h-4 w-4" />;
      case 'maintenance': return <Package className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredVans = vans.filter(van => {
    const matchesSearch = van.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         van.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         van.salesman_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || van.status === statusFilter;
    return matchesSearch && matchesStatus;
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
          <h1 className="text-3xl font-bold text-gray-900">Van Management</h1>
          <p className="text-gray-600 mt-2">Manage your fleet of vans and assignments</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/van-sales')} variant="outline">
            Back to Dashboard
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Van
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Van</DialogTitle>
                <DialogDescription>
                  Add a new van to your fleet
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="registration" className="text-right">
                    Registration *
                  </Label>
                  <Input
                    id="registration"
                    value={newVan.registration_number}
                    onChange={(e) => setNewVan({...newVan, registration_number: e.target.value})}
                    className="col-span-3"
                    placeholder="e.g., ABC-123"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="model" className="text-right">
                    Model *
                  </Label>
                  <Input
                    id="model"
                    value={newVan.model}
                    onChange={(e) => setNewVan({...newVan, model: e.target.value})}
                    className="col-span-3"
                    placeholder="e.g., Ford Transit"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="capacity" className="text-right">
                    Capacity *
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={newVan.capacity_units}
                    onChange={(e) => setNewVan({...newVan, capacity_units: parseInt(e.target.value) || 0})}
                    className="col-span-3"
                    placeholder="Units capacity"
                  />
                </div>
              </div>
              {error && (
                <div className="text-red-600 text-sm mb-4">{error}</div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddVan} disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Van'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  placeholder="Search vans by registration, model, or salesman..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
          <CardDescription>
            {filteredVans.length} van{filteredVans.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredVans.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Truck className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No vans found</h3>
              <p className="mb-4">
                {vans.length === 0 
                  ? "Start by adding your first van to the fleet"
                  : "Try adjusting your search or filter criteria"
                }
              </p>
              {vans.length === 0 && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Van
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Assigned Salesman</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Loads</TableHead>
                  <TableHead>Last Load</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVans.map((van) => (
                  <TableRow key={van.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <span>{van.registration_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>{van.model}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{van.capacity_units} units</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {van.salesman_name ? (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{van.salesman_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(van.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(van.status)}
                          <span className="capitalize">{van.status}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{van.total_loads || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {van.last_load_date ? (
                        new Date(van.last_load_date).toLocaleDateString()
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/van-sales/vans/${van.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
      {vans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vans</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vans.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vans</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vans.filter(v => v.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Vans</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vans.filter(v => v.salesman_name).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vans.reduce((sum, v) => sum + v.capacity_units, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Units</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
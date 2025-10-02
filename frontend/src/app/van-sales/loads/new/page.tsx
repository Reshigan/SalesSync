'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  Truck, 
  User, 
  Calendar,
  DollarSign,
  Plus,
  Minus,
  Save,
  ArrowLeft,
  Search
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface Van {
  id: string;
  registration_number: string;
  model: string;
  capacity_units: number;
  salesman_name: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  unit_of_measure: string;
  selling_price: number;
}

interface LoadItem {
  product_id: string;
  product_name: string;
  product_code: string;
  quantity: number;
  batch_number: string;
  unit_price: number;
}

interface NewLoad {
  van_id: string;
  salesman_id: string;
  load_date: string;
  cash_float: number;
  stock_loaded: LoadItem[];
  notes: string;
}

export default function NewLoadPage() {
  const [vans, setVans] = useState<Van[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [newLoad, setNewLoad] = useState<NewLoad>({
    van_id: '',
    salesman_id: '',
    load_date: new Date().toISOString().split('T')[0],
    cash_float: 0,
    stock_loaded: [],
    notes: ''
  });
  const router = useRouter();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [vansResponse, productsResponse] = await Promise.all([
        apiClient.get('/van-sales/vans'),
        apiClient.get('/products')
      ]);

      if (vansResponse.success) {
        setVans(vansResponse.data.vans || []);
      }
      if (productsResponse.success) {
        setProducts(productsResponse.data.products || []);
      }
    } catch (err) {
      setError('Failed to fetch initial data');
      console.error('Initial data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addProductToLoad = (product: Product) => {
    const existingItem = newLoad.stock_loaded.find(item => item.product_id === product.id);
    
    if (existingItem) {
      setNewLoad({
        ...newLoad,
        stock_loaded: newLoad.stock_loaded.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      setNewLoad({
        ...newLoad,
        stock_loaded: [
          ...newLoad.stock_loaded,
          {
            product_id: product.id,
            product_name: product.name,
            product_code: product.code,
            quantity: 1,
            batch_number: '',
            unit_price: product.selling_price
          }
        ]
      });
    }
    setProductSearch('');
  };

  const updateLoadItem = (productId: string, field: keyof LoadItem, value: any) => {
    setNewLoad({
      ...newLoad,
      stock_loaded: newLoad.stock_loaded.map(item =>
        item.product_id === productId
          ? { ...item, [field]: value }
          : item
      )
    });
  };

  const removeLoadItem = (productId: string) => {
    setNewLoad({
      ...newLoad,
      stock_loaded: newLoad.stock_loaded.filter(item => item.product_id !== productId)
    });
  };

  const handleSubmit = async () => {
    if (!newLoad.van_id || !newLoad.load_date || newLoad.stock_loaded.length === 0) {
      setError('Please fill in all required fields and add at least one product');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.post('/van-sales/loads', {
        ...newLoad,
        salesman_id: vans.find(v => v.id === newLoad.van_id)?.salesman_name ? newLoad.van_id : null
      });

      if (response.success) {
        router.push(`/van-sales/loads/${response.data.id}`);
      } else {
        setError(response.error?.message || 'Failed to create load');
      }
    } catch (err) {
      setError('Failed to create load');
      console.error('Load creation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  const totalItems = newLoad.stock_loaded.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = newLoad.stock_loaded.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

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
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/van-sales/loads')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Van Load</h1>
          <p className="text-gray-600 mt-2">Set up a new van loading session</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Load Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Load Details</CardTitle>
              <CardDescription>Basic information about the van load</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="van">Van *</Label>
                  <Select value={newLoad.van_id} onValueChange={(value) => setNewLoad({...newLoad, van_id: value})}>
                    <SelectTrigger>
                      <Truck className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Select van" />
                    </SelectTrigger>
                    <SelectContent>
                      {vans.map((van) => (
                        <SelectItem key={van.id} value={van.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{van.registration_number} - {van.model}</span>
                            {van.salesman_name && (
                              <span className="text-sm text-gray-500 ml-2">({van.salesman_name})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Load Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="date"
                      type="date"
                      value={newLoad.load_date}
                      onChange={(e) => setNewLoad({...newLoad, load_date: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cash_float">Cash Float</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="cash_float"
                    type="number"
                    step="0.01"
                    value={newLoad.cash_float}
                    onChange={(e) => setNewLoad({...newLoad, cash_float: parseFloat(e.target.value) || 0})}
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newLoad.notes}
                  onChange={(e) => setNewLoad({...newLoad, notes: e.target.value})}
                  placeholder="Additional notes about this load..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Add Products</CardTitle>
              <CardDescription>Search and add products to the van load</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products by name or code..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {productSearch && filteredProducts.length > 0 && (
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {filteredProducts.slice(0, 10).map((product) => (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => addProductToLoad(product)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.code}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${product.selling_price}</div>
                            <div className="text-sm text-gray-500">{product.unit_of_measure}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loaded Items */}
          <Card>
            <CardHeader>
              <CardTitle>Loaded Items ({newLoad.stock_loaded.length})</CardTitle>
              <CardDescription>Products being loaded into the van</CardDescription>
            </CardHeader>
            <CardContent>
              {newLoad.stock_loaded.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items added yet</p>
                  <p className="text-sm">Search and add products above</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newLoad.stock_loaded.map((item) => (
                      <TableRow key={item.product_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-sm text-gray-500">{item.product_code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateLoadItem(item.product_id, 'quantity', Math.max(1, item.quantity - 1))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLoadItem(item.product_id, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-20 text-center"
                              min="1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateLoadItem(item.product_id, 'quantity', item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.batch_number}
                            onChange={(e) => updateLoadItem(item.product_id, 'batch_number', e.target.value)}
                            placeholder="Batch #"
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLoadItem(item.product_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Load Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Items:</span>
                <span className="font-medium">{totalItems}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-medium">${totalValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cash Float:</span>
                <span className="font-medium">${newLoad.cash_float.toFixed(2)}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Load Value:</span>
                  <span>${(totalValue + newLoad.cash_float).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-red-200">
              <CardContent className="pt-6">
                <div className="text-red-600 text-sm">{error}</div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleSubmit}
              disabled={submitting || newLoad.stock_loaded.length === 0}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {submitting ? 'Creating Load...' : 'Create Load'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/van-sales/loads')}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
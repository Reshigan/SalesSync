'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { 
  DollarSign, 
  CreditCard, 
  FileText,
  Download,
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Eye
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  tenant: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  dueDate: string;
  paidDate?: string;
  plan: string;
  billingPeriod: string;
}

export default function BillingManagement() {
  const [invoices] = useState<Invoice[]>([
    {
      id: '1',
      invoiceNumber: 'INV-2024-001',
      tenant: 'Coca Cola Nigeria',
      amount: 15000,
      status: 'paid',
      dueDate: '2024-10-01',
      paidDate: '2024-09-28',
      plan: 'Enterprise',
      billingPeriod: 'Oct 2024',
    },
    {
      id: '2',
      invoiceNumber: 'INV-2024-002',
      tenant: 'PepsiCo Nigeria',
      amount: 12000,
      status: 'paid',
      dueDate: '2024-10-01',
      paidDate: '2024-09-30',
      plan: 'Enterprise',
      billingPeriod: 'Oct 2024',
    },
    {
      id: '3',
      invoiceNumber: 'INV-2024-003',
      tenant: 'Unilever Nigeria',
      amount: 8000,
      status: 'pending',
      dueDate: '2024-10-15',
      plan: 'Professional',
      billingPeriod: 'Oct 2024',
    },
    {
      id: '4',
      invoiceNumber: 'INV-2024-004',
      tenant: 'MTN Nigeria',
      amount: 25000,
      status: 'paid',
      dueDate: '2024-10-01',
      paidDate: '2024-09-25',
      plan: 'Enterprise',
      billingPeriod: 'Oct 2024',
    },
    {
      id: '5',
      invoiceNumber: 'INV-2024-005',
      tenant: 'Dangote Group',
      amount: 5000,
      status: 'overdue',
      dueDate: '2024-09-20',
      plan: 'Professional',
      billingPeriod: 'Sep 2024',
    },
  ]);

  const stats = {
    totalRevenue: invoices.reduce((sum, inv) => sum + (inv.status === 'paid' ? inv.amount : 0), 0),
    pendingRevenue: invoices.reduce((sum, inv) => sum + (inv.status === 'pending' ? inv.amount : 0), 0),
    overdueRevenue: invoices.reduce((sum, inv) => sum + (inv.status === 'overdue' ? inv.amount : 0), 0),
    paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
  };

  const columns = [
    {
      accessor: 'invoiceNumber',
      header: 'Invoice #',
      sortable: true,
      cell: ({ value }: { value: string }) => (
        <span className="font-mono text-sm font-medium">{value}</span>
      ),
    },
    {
      accessor: 'tenant',
      header: 'Tenant',
      sortable: true,
    },
    {
      accessor: 'plan',
      header: 'Plan',
      cell: ({ value }: { value: string }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Enterprise' ? 'bg-purple-100 text-purple-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      accessor: 'amount',
      header: 'Amount',
      sortable: true,
      cell: ({ value }: { value: number }) => (
        <span className="font-semibold">${value.toLocaleString()}</span>
      ),
    },
    {
      accessor: 'billingPeriod',
      header: 'Period',
    },
    {
      accessor: 'dueDate',
      header: 'Due Date',
      sortable: true,
    },
    {
      accessor: 'status',
      header: 'Status',
      cell: ({ value, row }: { value: string; row: Invoice }) => (
        <div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'paid' ? 'bg-green-100 text-green-800' :
            value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            value === 'overdue' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {value}
          </span>
          {row.paidDate && (
            <div className="text-xs text-gray-500 mt-1">Paid: {row.paidDate}</div>
          )}
        </div>
      ),
    },
    {
      accessor: 'id',
      header: 'Actions',
      cell: ({ row }: { row: Invoice }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" title="View Invoice">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" title="Download PDF">
            <Download className="h-4 w-4" />
          </Button>
          {row.status !== 'paid' && (
            <Button size="sm" variant="ghost" title="Send Reminder">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing & Revenue</h1>
            <p className="text-gray-600 mt-1">Manage subscriptions and invoices</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Paid Revenue</p>
                <p className="text-3xl font-bold text-green-900">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">{stats.paidInvoices} invoices</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-900">${stats.pendingRevenue.toLocaleString()}</p>
                <p className="text-xs text-yellow-600 mt-1">Awaiting payment</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Overdue</p>
                <p className="text-3xl font-bold text-red-900">${stats.overdueRevenue.toLocaleString()}</p>
                <p className="text-xs text-red-600 mt-1">Requires action</p>
              </div>
              <AlertCircle className="h-12 w-12 text-red-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total MRR</p>
                <p className="text-3xl font-bold text-blue-900">
                  ${(stats.totalRevenue + stats.pendingRevenue).toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% this month
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-blue-600 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search invoices..."
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Status
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Date Range
            </Button>
          </div>
        </Card>

        {/* Invoices Table */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Recent Invoices</h2>
          </div>
          <DataTable data={invoices} columns={columns} />
        </Card>

        {/* Payment Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Methods
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Stripe</div>
                    <div className="text-xs text-gray-500">Online payments</div>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-gradient-to-r from-green-600 to-green-400 rounded flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">PayPal</div>
                    <div className="text-xs text-gray-500">Alternative payment</div>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-gradient-to-r from-purple-600 to-purple-400 rounded flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Bank Transfer</div>
                    <div className="text-xs text-gray-500">Manual processing</div>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Active
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>September 2024</span>
                  <span className="font-semibold">$245,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>October 2024 (Current)</span>
                  <span className="font-semibold">$285,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '95%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>November 2024 (Projected)</span>
                  <span className="font-semibold text-gray-500">$320,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-400 h-2 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-sm text-blue-900">+16.3% Growth</div>
                  <div className="text-xs text-blue-700">Compared to last month</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

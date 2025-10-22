import React, { useState } from 'react';
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle, FileText, Filter, Download, Calendar, MapPin, Camera, Package, Target } from 'lucide-react';

interface Commission {
  id: string;
  type: 'board' | 'product' | 'new_customer';
  customerName: string;
  date: Date;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  brandName?: string;
  details: string;
  rejectionReason?: string;
}

const COMMISSION_TYPES = {
  board: { label: 'Board Placement', icon: Target, color: 'purple' },
  product: { label: 'Product Distribution', icon: Package, color: 'orange' },
  new_customer: { label: 'New Customer', icon: CheckCircle, color: 'green' }
};

const MOCK_COMMISSIONS: Commission[] = [
  {
    id: 'COM-001',
    type: 'board',
    customerName: 'ABC Spaza Shop',
    date: new Date('2025-10-20T14:32:00'),
    amount: 150,
    status: 'pending',
    brandName: 'Coca-Cola',
    details: 'Large Billboard - Coverage: 32%, Quality: 8/10'
  },
  {
    id: 'COM-002',
    type: 'product',
    customerName: 'ABC Spaza Shop',
    date: new Date('2025-10-20T15:10:00'),
    amount: 250,
    status: 'pending',
    brandName: 'MTN',
    details: 'MTN SIM Cards × 5'
  },
  {
    id: 'COM-003',
    type: 'board',
    customerName: 'XYZ Mini Market',
    date: new Date('2025-10-18T11:20:00'),
    amount: 100,
    status: 'approved',
    brandName: 'Vodacom',
    details: 'Standard Signage - Coverage: 25%, Quality: 9/10'
  },
  {
    id: 'COM-004',
    type: 'product',
    customerName: 'Lucky Store',
    date: new Date('2025-10-15T09:45:00'),
    amount: 500,
    status: 'paid',
    brandName: 'Samsung',
    details: 'Samsung Galaxy A14 × 1'
  },
  {
    id: 'COM-005',
    type: 'board',
    customerName: 'Corner Shop',
    date: new Date('2025-10-10T16:00:00'),
    amount: 150,
    status: 'rejected',
    brandName: 'Coca-Cola',
    details: 'Billboard - Coverage: 8%, Quality: 5/10',
    rejectionReason: 'Coverage percentage below minimum threshold (15%). Please reposition board and resubmit.'
  }
];

export default function MyCommissions() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');
  const [commissions] = useState<Commission[]>(MOCK_COMMISSIONS);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filterCommissions = (status?: Commission['status']) => {
    if (!status || status === 'all') return commissions;
    return commissions.filter(c => c.status === status);
  };

  const calculateTotals = () => {
    return {
      pending: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
      approved: commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.amount, 0),
      paid: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
      total: commissions.reduce((sum, c) => sum + c.amount, 0)
    };
  };

  const totals = calculateTotals();
  const filteredCommissions = filterCommissions(activeTab === 'all' ? undefined : activeTab);

  const getStatusBadge = (status: Commission['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'Pending',
      approved: 'Approved',
      paid: 'Paid',
      rejected: 'Rejected'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTypeIcon = (type: Commission['type']) => {
    const TypeIcon = COMMISSION_TYPES[type].icon;
    const color = COMMISSION_TYPES[type].color;
    const colorClasses = {
      purple: 'text-purple-600 bg-purple-100',
      orange: 'text-orange-600 bg-orange-100',
      green: 'text-green-600 bg-green-100'
    };
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
        <TypeIcon className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <DollarSign className="w-6 h-6 mr-2" />
              My Commissions
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
              <button className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium opacity-90">Pending</span>
            </div>
            <p className="text-3xl font-bold">R{totals.pending.toFixed(2)}</p>
            <p className="text-sm opacity-90 mt-1">
              {commissions.filter(c => c.status === 'pending').length} items
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium opacity-90">Approved</span>
            </div>
            <p className="text-3xl font-bold">R{totals.approved.toFixed(2)}</p>
            <p className="text-sm opacity-90 mt-1">
              {commissions.filter(c => c.status === 'approved').length} items
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium opacity-90">Paid This Month</span>
            </div>
            <p className="text-3xl font-bold">R{totals.paid.toFixed(2)}</p>
            <p className="text-sm opacity-90 mt-1">
              {commissions.filter(c => c.status === 'paid').length} payments
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium opacity-90">Total Earned</span>
            </div>
            <p className="text-3xl font-bold">R{totals.total.toFixed(2)}</p>
            <p className="text-sm opacity-90 mt-1">All time</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {[
                { key: 'all', label: 'All', count: commissions.length },
                { key: 'pending', label: 'Pending', count: commissions.filter(c => c.status === 'pending').length },
                { key: 'approved', label: 'Approved', count: commissions.filter(c => c.status === 'approved').length },
                { key: 'paid', label: 'Paid', count: commissions.filter(c => c.status === 'paid').length },
                { key: 'rejected', label: 'Rejected', count: commissions.filter(c => c.status === 'rejected').length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Commission List */}
          <div className="divide-y divide-gray-200">
            {filteredCommissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No commissions found</p>
              </div>
            ) : (
              filteredCommissions.map(commission => (
                <div
                  key={commission.id}
                  onClick={() => setSelectedCommission(commission)}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {getTypeIcon(commission.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {COMMISSION_TYPES[commission.type].label}
                          </h3>
                          {getStatusBadge(commission.status)}
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">{commission.customerName}</p>
                        <p className="text-sm text-gray-500 mb-2">{commission.details}</p>
                        <div className="flex items-center text-xs text-gray-500 space-x-4">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {commission.date.toLocaleDateString()} at {commission.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {commission.brandName && (
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                              {commission.brandName}
                            </span>
                          )}
                        </div>
                        {commission.status === 'rejected' && commission.rejectionReason && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
                            <p className="text-xs text-red-700">{commission.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-lg font-bold text-gray-900">R{commission.amount.toFixed(2)}</p>
                      <button className="text-sm text-blue-600 hover:text-blue-700 mt-1">
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Payment History
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {[
              {
                month: 'October 2025',
                amount: 15200,
                date: '15 Oct 2025',
                method: 'EFT',
                reference: 'PAY-2025-10-001',
                items: 45
              },
              {
                month: 'September 2025',
                amount: 18450,
                date: '15 Sep 2025',
                method: 'EFT',
                reference: 'PAY-2025-09-001',
                items: 52
              }
            ].map((payment, index) => (
              <div key={index} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{payment.month}</h3>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Payment Date: {payment.date}</p>
                      <p>Method: {payment.method}</p>
                      <p>Reference: {payment.reference}</p>
                      <p>Items: {payment.items} commissions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600 mb-2">R{payment.amount.toFixed(2)}</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Paid
                    </span>
                    <div className="mt-2 space-x-2">
                      <button className="text-xs text-blue-600 hover:text-blue-700">View Details</button>
                      <button className="text-xs text-blue-600 hover:text-blue-700">Download Receipt</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commission Detail Modal */}
      {selectedCommission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Commission Details</h2>
              <button
                onClick={() => setSelectedCommission(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(selectedCommission.type)}
                  <div>
                    <p className="font-medium text-gray-900">{COMMISSION_TYPES[selectedCommission.type].label}</p>
                    <p className="text-sm text-gray-500">{selectedCommission.id}</p>
                  </div>
                </div>
                {getStatusBadge(selectedCommission.status)}
              </div>

              {/* Amount */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Commission Amount</p>
                <p className="text-3xl font-bold text-gray-900">R{selectedCommission.amount.toFixed(2)}</p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Customer</p>
                  <p className="text-sm text-gray-900">{selectedCommission.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Date & Time</p>
                  <p className="text-sm text-gray-900">
                    {selectedCommission.date.toLocaleDateString()} at {selectedCommission.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {selectedCommission.brandName && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Brand</p>
                    <p className="text-sm text-gray-900">{selectedCommission.brandName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Activity Details</p>
                  <p className="text-sm text-gray-900">{selectedCommission.details}</p>
                </div>
              </div>

              {/* Rejection Reason */}
              {selectedCommission.status === 'rejected' && selectedCommission.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 mb-2">Rejection Reason</p>
                  <p className="text-sm text-red-700">{selectedCommission.rejectionReason}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  View on Map
                </button>
                <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center">
                  <Camera className="w-4 h-4 mr-2" />
                  View Photos
                </button>
              </div>

              {selectedCommission.status === 'rejected' && (
                <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                  Contact Manager
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Target, Package, DollarSign, Clock, MapPin, AlertCircle, ChevronDown, ChevronUp, MessageSquare, Calendar, Check } from 'lucide-react';

interface VisitSummaryData {
  visitId: string;
  customerId: string;
  customerName: string;
  visitDate: Date;
  duration: number; // minutes
  gpsVerified: boolean;
  gpsDistance?: number;
  surveys: {
    mandatory: { completed: number; total: number };
    adhoc: { completed: number; total: number; skipped: number };
  };
  boards: Array<{
    id: string;
    brandName: string;
    boardType: string;
    coveragePercentage: number;
    qualityScore: number;
    commission: number;
    photoUrl?: string;
  }>;
  products: Array<{
    id: string;
    productName: string;
    quantity: number;
    recipientName: string;
    commission: number;
  }>;
  totalCommission: number;
  notes?: string;
  syncStatus: 'synced' | 'pending' | 'failed';
}

export default function VisitSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // In production, this data would come from location.state or API
  const [visitData] = useState<VisitSummaryData>({
    visitId: 'VST-2025-10-22-001',
    customerId: 'CUST-001',
    customerName: 'ABC Spaza Shop',
    visitDate: new Date(),
    duration: 28,
    gpsVerified: true,
    gpsDistance: 5,
    surveys: {
      mandatory: { completed: 2, total: 2 },
      adhoc: { completed: 1, total: 2, skipped: 1 }
    },
    boards: [
      {
        id: 'BRD-001',
        brandName: 'Coca-Cola',
        boardType: 'Large Billboard',
        coveragePercentage: 32,
        qualityScore: 8,
        commission: 150
      },
      {
        id: 'BRD-002',
        brandName: 'MTN',
        boardType: 'Standard Signage',
        coveragePercentage: 18,
        qualityScore: 9,
        commission: 100
      }
    ],
    products: [
      {
        id: 'PROD-001',
        productName: 'MTN SIM Cards',
        quantity: 5,
        recipientName: 'Store Inventory',
        commission: 250
      },
      {
        id: 'PROD-002',
        productName: 'Samsung Galaxy A14',
        quantity: 1,
        recipientName: 'John Mthembu',
        commission: 500
      }
    ],
    totalCommission: 1000,
    syncStatus: 'synced',
    notes: ''
  });

  const [notes, setNotes] = useState(visitData.notes || '');
  const [flagForFollowup, setFlagForFollowup] = useState(false);
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleCompleteVisit = async () => {
    setIsCompleting(true);
    try {
      // TODO: API call to complete visit
      const payload = {
        visitId: visitData.visitId,
        notes,
        flagForFollowup,
        nextVisitDate: nextVisitDate || null,
        completedAt: new Date().toISOString()
      };

      console.log('Completing visit:', payload);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Navigate to dashboard
      navigate('/field-marketing/dashboard', {
        state: { message: 'Visit completed successfully!', commission: visitData.totalCommission }
      });
    } catch (error) {
      console.error('Error completing visit:', error);
      alert('Failed to complete visit. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Visit Summary</h1>
              <p className="text-sm text-gray-500">{visitData.customerName}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              visitData.syncStatus === 'synced' ? 'bg-green-100 text-green-800' :
              visitData.syncStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {visitData.syncStatus === 'synced' ? '✅ Synced' :
               visitData.syncStatus === 'pending' ? '🔄 Pending' :
               '❌ Failed'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{visitData.duration}</p>
            <p className="text-sm text-gray-500">Minutes</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <MapPin className="w-5 h-5 text-green-500" />
              {visitData.gpsVerified && <CheckCircle className="w-4 h-4 text-green-500" />}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {visitData.gpsDistance}m
            </p>
            <p className="text-sm text-gray-500">GPS Distance</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {visitData.boards.length + visitData.products.length}
            </p>
            <p className="text-sm text-gray-500">Activities</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              R{visitData.totalCommission.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">Commission</p>
          </div>
        </div>

        {/* Surveys Summary */}
        <div className="bg-white rounded-lg shadow mb-4">
          <button
            onClick={() => toggleSection('surveys')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Surveys Completed</h3>
                <p className="text-sm text-gray-500">
                  Mandatory: {visitData.surveys.mandatory.completed}/{visitData.surveys.mandatory.total} | 
                  Ad-hoc: {visitData.surveys.adhoc.completed}/{visitData.surveys.adhoc.total}
                </p>
              </div>
            </div>
            {expandedSection === 'surveys' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {expandedSection === 'surveys' && (
            <div className="px-6 pb-4 border-t border-gray-200">
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Mandatory Surveys</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    {visitData.surveys.mandatory.completed}/{visitData.surveys.mandatory.total} ✓
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Ad-hoc Surveys</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {visitData.surveys.adhoc.completed} completed, {visitData.surveys.adhoc.skipped} skipped
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Boards Placed */}
        {visitData.boards.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-4">
            <button
              onClick={() => toggleSection('boards')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center">
                <Target className="w-5 h-5 text-purple-600 mr-3" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Boards Placed ({visitData.boards.length})</h3>
                  <p className="text-sm text-gray-500">
                    Total commission: R{visitData.boards.reduce((sum, b) => sum + b.commission, 0).toFixed(2)}
                  </p>
                </div>
              </div>
              {expandedSection === 'boards' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSection === 'boards' && (
              <div className="px-6 pb-4 border-t border-gray-200">
                <div className="mt-4 space-y-3">
                  {visitData.boards.map((board) => (
                    <div key={board.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{board.brandName}</h4>
                          <p className="text-sm text-gray-500">{board.boardType}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          R{board.commission.toFixed(2)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600">Coverage:</span>
                          <span className={`ml-2 font-medium ${
                            board.coveragePercentage >= 15 && board.coveragePercentage <= 50 ? 'text-green-600' :
                            board.coveragePercentage >= 5 && board.coveragePercentage < 70 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {board.coveragePercentage}%
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600">Quality:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {board.qualityScore}/10 {'⭐'.repeat(Math.round(board.qualityScore / 2))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products Distributed */}
        {visitData.products.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-4">
            <button
              onClick={() => toggleSection('products')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center">
                <Package className="w-5 h-5 text-orange-600 mr-3" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Products Distributed ({visitData.products.length})</h3>
                  <p className="text-sm text-gray-500">
                    Total commission: R{visitData.products.reduce((sum, p) => sum + p.commission, 0).toFixed(2)}
                  </p>
                </div>
              </div>
              {expandedSection === 'products' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSection === 'products' && (
              <div className="px-6 pb-4 border-t border-gray-200">
                <div className="mt-4 space-y-3">
                  {visitData.products.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{product.productName}</h4>
                          <p className="text-sm text-gray-500">Qty: {product.quantity}</p>
                          <p className="text-sm text-gray-500">Recipient: {product.recipientName}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          R{product.commission.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Additional Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Additional Actions (Optional)</h3>

          <div className="space-y-4">
            {/* Visit Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Visit Notes/Comments
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add any observations, issues, or special notes about this visit..."
              />
            </div>

            {/* Flag for Follow-up */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="followup"
                checked={flagForFollowup}
                onChange={(e) => setFlagForFollowup(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="followup" className="ml-2 text-sm font-medium text-gray-700">
                Flag customer for follow-up
              </label>
            </div>

            {/* Schedule Next Visit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Next Visit (Optional)
              </label>
              <input
                type="date"
                value={nextVisitDate}
                onChange={(e) => setNextVisitDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Total Commission Highlight */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Total Commissions Earned (Pending Approval)</p>
              <p className="text-4xl font-bold">R{visitData.totalCommission.toFixed(2)}</p>
              <p className="text-sm opacity-90 mt-2">
                {visitData.boards.length} board(s) + {visitData.products.length} product(s)
              </p>
            </div>
            <DollarSign className="w-16 h-16 opacity-20" />
          </div>
        </div>

        {/* Complete Visit Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 shadow-lg">
          <button
            onClick={handleCompleteVisit}
            disabled={isCompleting}
            className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
          >
            {isCompleting ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Completing Visit...
              </>
            ) : (
              <>
                <Check className="w-6 h-6 mr-3" />
                Complete Visit
              </>
            )}
          </button>
          <p className="text-center text-sm text-gray-500 mt-2">
            ⚠️ This action cannot be undone
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { 
  MapPin, 
  User, 
  Clock,
  Camera,
  FileText,
  CheckCircle,
  ShoppingCart,
  AlertCircle,
  Calendar,
  Navigation,
  Package,
  DollarSign
} from 'lucide-react';

export default function VisitDetailPage() {
    const { formatCurrency } = useCurrency();
const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const params = useParams();
  const visitId = params.id;

  const visit = {
    id: visitId,
    visitNumber: 'VIS-2024-001',
    date: '2024-10-01',
    customer: {
      name: 'Shoprite Lagos Mall',
      code: 'CUST-001',
      address: '123 Mall Road, Victoria Island, Lagos',
      phone: '+234-800-123-4567',
    },
    agent: {
      name: 'John Doe',
      code: 'AGT-001',
      phone: '+234-801-234-5678',
    },
    checkIn: {
      time: '09:30 AM',
      location: { lat: 6.4281, lng: 3.4219 },
      address: '123 Mall Road, Victoria Island, Lagos',
    },
    checkOut: {
      time: '11:15 AM',
      location: { lat: 6.4281, lng: 3.4219 },
      address: '123 Mall Road, Victoria Island, Lagos',
    },
    duration: '1h 45min',
    status: 'completed',
    visitType: 'Sales Call',
    purpose: 'Product Order & Stock Check',
    outcome: 'Order Placed',
    orderCreated: {
      orderNumber: 'ORD-2024-001',
      amount: 125000,
      items: 15,
    },
    photos: [
      { id: '1', type: 'Store Front', url: '/images/store1.jpg', caption: 'Store entrance' },
      { id: '2', type: 'Product Display', url: '/images/display1.jpg', caption: 'Coca-Cola display shelf' },
      { id: '3', type: 'Stock Room', url: '/images/stock1.jpg', caption: 'Current stock levels' },
      { id: '4', type: 'Competitor', url: '/images/comp1.jpg', caption: 'Pepsi promotion' },
    ],
    surveyResponses: [
      { question: 'Store Cleanliness', answer: 'Excellent', score: 5 },
      { question: 'Staff Availability', answer: 'Good', score: 4 },
      { question: 'Product Visibility', answer: 'Fair', score: 3 },
      { question: 'Stock Levels', answer: 'Low', score: 2 },
    ],
    issues: [
      { type: 'Stock Issue', description: 'Low stock on Coca-Cola 500ml', priority: 'High' },
      { type: 'Display Issue', description: 'Damaged promotional banner', priority: 'Medium' },
    ],
    notes: 'Customer requested faster delivery times. Competitor running aggressive promotion. Need to increase visibility on main shelf.',
  };

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{visit.visitNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                visit.status === 'completed' ? 'bg-green-100 text-green-800' :
                visit.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {visit.status}
              </span>
            </div>
            <p className="text-gray-600 mt-1">{visit.date} • {visit.visitType}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Download Report
            </Button>
            <Button>
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Order
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Duration</p>
                <p className="text-2xl font-bold text-blue-900">{visit.duration}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Order Value</p>
                <p className="text-2xl font-bold text-green-900">₦{visit.orderCreated.amount.toLocaleString()}</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Photos</p>
                <p className="text-2xl font-bold text-purple-900">{visit.photos.length}</p>
              </div>
              <Camera className="h-10 w-10 text-purple-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Issues</p>
                <p className="text-2xl font-bold text-orange-900">{visit.issues.length}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-orange-600 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Visit Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Customer Name</div>
                <div className="font-medium">{visit.customer.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Customer Code</div>
                <div className="font-mono text-sm">{visit.customer.code}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Address</div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-sm">{visit.customer.address}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div>{visit.customer.phone}</div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2">
                View Customer Profile
              </Button>
            </div>
          </Card>

          {/* Agent Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Sales Agent
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Agent Name</div>
                <div className="font-medium">{visit.agent.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Agent Code</div>
                <div className="font-mono text-sm">{visit.agent.code}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div>{visit.agent.phone}</div>
              </div>
              <div className="pt-3 border-t">
                <div className="text-sm text-gray-600">Visit Purpose</div>
                <div className="font-medium">{visit.purpose}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Outcome</div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-600">{visit.outcome}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Check-in & Check-out */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Check-in */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Navigation className="h-5 w-5 mr-2 text-green-600" />
              Check-in
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Time</div>
                <div className="font-medium text-lg">{visit.checkIn.time}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Location</div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-sm">{visit.checkIn.address}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">GPS Coordinates</div>
                <div className="font-mono text-xs">
                  {visit.checkIn.location.lat}, {visit.checkIn.location.lng}
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <MapPin className="h-4 w-4 mr-2" />
                View on Map
              </Button>
            </div>
          </Card>

          {/* Check-out */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Navigation className="h-5 w-5 mr-2 text-red-600" />
              Check-out
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Time</div>
                <div className="font-medium text-lg">{visit.checkOut.time}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Location</div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-sm">{visit.checkOut.address}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">GPS Coordinates</div>
                <div className="font-mono text-xs">
                  {visit.checkOut.location.lat}, {visit.checkOut.location.lng}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Visit Duration</div>
                <div className="font-semibold text-blue-600">{visit.duration}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Photos Captured */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Photos Captured ({visit.photos.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {visit.photos.map((photo) => (
              <div key={photo.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="bg-gray-200 h-40 flex items-center justify-center">
                  <Camera className="h-12 w-12 text-gray-400" />
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm">{photo.type}</div>
                  <div className="text-xs text-gray-600 mt-1">{photo.caption}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Survey Responses & Issues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Survey Responses */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Survey Responses</h2>
            <div className="space-y-3">
              {visit.surveyResponses.map((response, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-sm">{response.question}</div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className={`w-4 h-4 ${
                            star <= response.score ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">{response.answer}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Issues Reported */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Issues Reported
            </h2>
            <div className="space-y-3">
              {visit.issues.map((issue, idx) => (
                <div key={idx} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-sm">{issue.type}</div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      issue.priority === 'High' ? 'bg-red-100 text-red-800' :
                      issue.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {issue.priority}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">{issue.description}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Order Created */}
        {visit.orderCreated && (
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Order Created
                </h2>
                <div className="mt-2 space-y-1">
                  <div className="text-sm">
                    <span className="text-gray-600">Order Number:</span>{' '}
                    <span className="font-mono font-medium">{visit.orderCreated.orderNumber}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Amount:</span>{' '}
                    <span className="font-semibold">₦{visit.orderCreated.amount.toLocaleString()}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Items:</span>{' '}
                    <span className="font-medium">{visit.orderCreated.items}</span>
                  </div>
                </div>
              </div>
              <Button>
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Order Details
              </Button>
            </div>
          </Card>
        )}

        {/* Visit Notes */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Visit Notes</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">{visit.notes}</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>);
}

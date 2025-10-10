'use client';

import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Megaphone, Calendar, DollarSign, TrendingUp, Users, Package, Target, CheckCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';

export default function CampaignDetailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const params = useParams();
  const campaignId = params.id;

  const campaign = {
    id: campaignId,
    name: 'Summer Refreshment Promo 2024',
    code: 'CMP-2024-001',
    status: 'active',
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    budget: 5000000,
    spent: 3250000,
    targetRevenue: 25000000,
    actualRevenue: 18500000,
    targetCustomers: 500,
    reachedCustomers: 387,
    productsIncluded: ['Coca Cola 500ml', 'Pepsi 500ml', 'Sprite 500ml', 'Fanta 500ml'],
    discount: '15% off on bulk orders',
    description: 'Summer refreshment campaign offering special discounts on beverage purchases',
  };

  const performance = [
    { metric: 'Revenue Achievement', target: 25000000, actual: 18500000, percent: 74 },
    { metric: 'Customer Reach', target: 500, actual: 387, percent: 77 },
    { metric: 'Budget Utilization', target: 5000000, actual: 3250000, percent: 65 },
  ];

  const activities = [
    { date: '2024-07-15', activity: 'Store Activation', location: 'Shoprite Lagos', participants: 45, sales: 125000 },
    { date: '2024-07-10', activity: 'Product Sampling', location: 'Mega Plaza', participants: 80, sales: 98000 },
    { date: '2024-07-05', activity: 'In-store Promotion', location: 'Game Stores', participants: 35, sales: 75000 },
  ];

  const topProducts = [
    { name: 'Coca Cola 500ml', sold: 1250, revenue: 312500 },
    { name: 'Pepsi 500ml', sold: 980, revenue: 235200 },
    { name: 'Sprite 500ml', sold: 750, revenue: 172500 },
  ];

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{campaign.name}</h1>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">{campaign.status}</span>
            </div>
            <p className="text-gray-600 mt-1">{campaign.code} • {campaign.startDate} to {campaign.endDate}</p>
          </div>
          <Button><Megaphone className="h-4 w-4 mr-2" />Edit Campaign</Button>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-blue-600 font-medium">Budget</p>
                <p className="text-2xl font-bold text-blue-900">₦{(campaign.budget/1000000).toFixed(1)}M</p>
                <p className="text-xs text-blue-600 mt-1">{((campaign.spent/campaign.budget)*100).toFixed(0)}% spent</p></div>
              <DollarSign className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-green-600 font-medium">Revenue</p>
                <p className="text-2xl font-bold text-green-900">₦{(campaign.actualRevenue/1000000).toFixed(1)}M</p>
                <p className="text-xs text-green-600 mt-1">{((campaign.actualRevenue/campaign.targetRevenue)*100).toFixed(0)}% of target</p></div>
              <TrendingUp className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-purple-600 font-medium">Customers</p>
                <p className="text-2xl font-bold text-purple-900">{campaign.reachedCustomers}</p>
                <p className="text-xs text-purple-600 mt-1">of {campaign.targetCustomers} target</p></div>
              <Users className="h-10 w-10 text-purple-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-orange-600 font-medium">ROI</p>
                <p className="text-2xl font-bold text-orange-900">{((campaign.actualRevenue/campaign.spent)*100 - 100).toFixed(0)}%</p></div>
              <Target className="h-10 w-10 text-orange-600 opacity-50" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Campaign Details</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3"><Calendar className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Duration</div><div className="font-medium">{campaign.startDate} - {campaign.endDate}</div></div></div>
              <div className="flex items-start gap-3"><Target className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Target Audience</div><div className="font-medium">{campaign.targetCustomers} customers</div></div></div>
              <div className="flex items-start gap-3"><Package className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Products</div><div className="text-sm">{campaign.productsIncluded.join(', ')}</div></div></div>
              <div className="flex items-start gap-3"><DollarSign className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Offer</div><div className="font-medium">{campaign.discount}</div></div></div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
            <div className="space-y-4">{performance.map((perf, idx) => (<div key={idx}><div className="flex justify-between text-sm mb-2"><span className="text-gray-600">{perf.metric}</span><span className="font-medium">{perf.percent}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${perf.percent >= 75 ? 'bg-green-600' : perf.percent >= 50 ? 'bg-yellow-600' : 'bg-red-600'}`} style={{ width: `${perf.percent}%` }} /></div></div>))}</div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Campaign Activities</h2>
          <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Participants</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sales</th></tr></thead><tbody className="divide-y divide-gray-200">{activities.map((activity, idx) => (<tr key={idx} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm">{activity.date}</td><td className="px-4 py-3 text-sm font-medium">{activity.activity}</td><td className="px-4 py-3 text-sm">{activity.location}</td><td className="px-4 py-3 text-sm text-right">{activity.participants}</td><td className="px-4 py-3 text-sm text-right font-semibold">₦{activity.sales.toLocaleString()}</td></tr>))}</tbody></table></div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Top Performing Products</h2>
          <div className="space-y-3">{topProducts.map((product, idx) => (<div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"><div className="flex items-center gap-3"><Package className="h-8 w-8 text-blue-600" /><div><div className="font-medium">{product.name}</div><div className="text-sm text-gray-600">{product.sold} units sold</div></div></div><div className="text-right"><div className="font-semibold text-lg">₦{product.revenue.toLocaleString()}</div></div></div>))}</div>
        </Card>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>);
}

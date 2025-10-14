'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Target, 
  Megaphone, 
  Gift, 
  Zap, 
  TrendingUp, 
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Filter,
  Search
} from 'lucide-react';

function TradeMarketingContent() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for trade marketing metrics
  const metrics = {
    activeCampaigns: 12,
    campaignChange: 8.3,
    totalROI: 245.7,
    roiChange: 15.2,
    brandActivations: 8,
    activationChange: 12.5,
    marketShare: 18.4,
    shareChange: 2.1
  };

  const campaigns = [
    {
      id: 1,
      name: 'Summer Refresh Campaign',
      status: 'Active',
      budget: 150000,
      spent: 89000,
      roi: 185.5,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      reach: 45000,
      conversions: 1250
    },
    {
      id: 2,
      name: 'Back to School Promo',
      status: 'Planning',
      budget: 200000,
      spent: 0,
      roi: 0,
      startDate: '2024-08-15',
      endDate: '2024-09-30',
      reach: 0,
      conversions: 0
    },
    {
      id: 3,
      name: 'Holiday Season Push',
      status: 'Completed',
      budget: 300000,
      spent: 285000,
      roi: 220.3,
      startDate: '2023-11-01',
      endDate: '2023-12-31',
      reach: 78000,
      conversions: 2850
    }
  ];

  const activations = [
    {
      id: 1,
      name: 'Mall Activation - Victoria Island',
      type: 'Brand Experience',
      status: 'Active',
      location: 'Victoria Island, Lagos',
      startDate: '2024-07-01',
      endDate: '2024-07-07',
      footfall: 12500,
      engagement: 85.2
    },
    {
      id: 2,
      name: 'University Campus Tour',
      type: 'Student Engagement',
      status: 'Upcoming',
      location: 'University of Lagos',
      startDate: '2024-07-15',
      endDate: '2024-07-20',
      footfall: 0,
      engagement: 0
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trade Marketing</h1>
          <p className="text-gray-600">Manage campaigns, activations, and market intelligence</p>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium">
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Megaphone className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{metrics.activeCampaigns}</p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  metrics.campaignChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metrics.campaignChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 flex-shrink-0 self-center" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 flex-shrink-0 self-center" />
                  )}
                  {Math.abs(metrics.campaignChange)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total ROI</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{metrics.totalROI}%</p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  metrics.roiChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metrics.roiChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 flex-shrink-0 self-center" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 flex-shrink-0 self-center" />
                  )}
                  {Math.abs(metrics.roiChange)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Brand Activations</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{metrics.brandActivations}</p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  metrics.activationChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metrics.activationChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 flex-shrink-0 self-center" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 flex-shrink-0 self-center" />
                  )}
                  {Math.abs(metrics.activationChange)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Market Share</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{metrics.marketShare}%</p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  metrics.shareChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metrics.shareChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 flex-shrink-0 self-center" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 flex-shrink-0 self-center" />
                  )}
                  {Math.abs(metrics.shareChange)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'campaigns', name: 'Campaigns', icon: Megaphone },
              { id: 'activations', name: 'Activations', icon: Zap },
              { id: 'intelligence', name: 'Market Intelligence', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Campaign Management</h3>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search campaigns..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                            <div className="text-sm text-gray-500">{campaign.startDate} - {campaign.endDate}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(campaign.budget)}</div>
                          <div className="text-sm text-gray-500">Spent: {formatCurrency(campaign.spent)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{campaign.roi}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Reach: {formatNumber(campaign.reach)}</div>
                          <div className="text-sm text-gray-500">Conversions: {formatNumber(campaign.conversions)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'activations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Brand Activations</h3>
                <button className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium">
                  <Plus className="w-4 h-4 mr-2" />
                  New Activation
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activations.map((activation) => (
                  <div key={activation.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">{activation.name}</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activation.status)}`}>
                        {activation.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600"><strong>Type:</strong> {activation.type}</p>
                      <p className="text-sm text-gray-600"><strong>Location:</strong> {activation.location}</p>
                      <p className="text-sm text-gray-600"><strong>Duration:</strong> {activation.startDate} - {activation.endDate}</p>
                      {activation.footfall > 0 && (
                        <>
                          <p className="text-sm text-gray-600"><strong>Footfall:</strong> {formatNumber(activation.footfall)}</p>
                          <p className="text-sm text-gray-600"><strong>Engagement:</strong> {activation.engagement}%</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Trade Marketing Overview</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Campaign Performance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Campaigns</span>
                      <span className="text-sm font-medium">{metrics.activeCampaigns}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average ROI</span>
                      <span className="text-sm font-medium">{metrics.totalROI}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Market Share</span>
                      <span className="text-sm font-medium">{metrics.marketShare}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Upcoming Activities</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">University Campus Tour - July 15</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Gift className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Back to School Promo - August 15</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Holiday Campaign Planning - September 1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'intelligence' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Market Intelligence</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
                    <h4 className="text-md font-medium text-gray-900">Market Trends</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Mobile commerce up 25%</li>
                    <li>• Social media engagement +18%</li>
                    <li>• Premium products gaining traction</li>
                    <li>• Sustainability focus increasing</li>
                  </ul>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Users className="w-6 h-6 text-green-600 mr-2" />
                    <h4 className="text-md font-medium text-gray-900">Consumer Insights</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Price sensitivity high in Q3</li>
                    <li>• Brand loyalty increasing</li>
                    <li>• Digital touchpoints preferred</li>
                    <li>• Quality over quantity trend</li>
                  </ul>
                </div>

                <div className="bg-orange-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Target className="w-6 h-6 text-orange-600 mr-2" />
                    <h4 className="text-md font-medium text-gray-900">Competitive Analysis</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Competitor A: 22% market share</li>
                    <li>• Competitor B: 19% market share</li>
                    <li>• Our position: 18.4% (+2.1%)</li>
                    <li>• Gap closing in premium segment</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TradeMarketingPage() {
  return (
    <DashboardLayout>
      <TradeMarketingContent />
    </DashboardLayout>
  );
}
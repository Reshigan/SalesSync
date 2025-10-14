'use client';

import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon,
  TruckIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface ReportCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  reports: Report[];
}

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'standard' | 'custom';
  frequency: string;
  lastGenerated?: string;
  status: 'available' | 'generating' | 'scheduled';
}

const ReportsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('sales');
  const [searchTerm, setSearchTerm] = useState('');
  const [reports, setReports] = useState<ReportCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch reports
    const fetchReports = async () => {
      setLoading(true);
      
      // Mock data - in production this would come from API
      const mockReports: ReportCategory[] = [
        {
          id: 'sales',
          name: 'Sales Reports',
          description: 'Comprehensive sales performance and analytics',
          icon: ChartBarIcon,
          reports: [
            {
              id: 'daily-sales',
              name: 'Daily Sales Summary',
              description: 'Daily sales performance across all channels',
              type: 'standard',
              frequency: 'Daily',
              lastGenerated: '2024-10-14 08:00',
              status: 'available'
            },
            {
              id: 'monthly-sales',
              name: 'Monthly Sales Report',
              description: 'Comprehensive monthly sales analysis',
              type: 'standard',
              frequency: 'Monthly',
              lastGenerated: '2024-10-01 09:00',
              status: 'available'
            },
            {
              id: 'sales-by-agent',
              name: 'Sales by Agent',
              description: 'Individual agent performance metrics',
              type: 'standard',
              frequency: 'Weekly',
              lastGenerated: '2024-10-07 10:00',
              status: 'available'
            }
          ]
        },
        {
          id: 'van-sales',
          name: 'Van Sales Reports',
          description: 'Van sales operations and route performance',
          icon: TruckIcon,
          reports: [
            {
              id: 'route-performance',
              name: 'Route Performance Report',
              description: 'Analysis of route efficiency and sales performance',
              type: 'standard',
              frequency: 'Weekly',
              lastGenerated: '2024-10-07 11:00',
              status: 'available'
            },
            {
              id: 'van-inventory',
              name: 'Van Inventory Report',
              description: 'Current inventory levels across all vans',
              type: 'standard',
              frequency: 'Daily',
              lastGenerated: '2024-10-14 07:30',
              status: 'available'
            },
            {
              id: 'cash-reconciliation',
              name: 'Cash Reconciliation Report',
              description: 'Daily cash reconciliation across all routes',
              type: 'standard',
              frequency: 'Daily',
              lastGenerated: '2024-10-14 08:15',
              status: 'available'
            }
          ]
        },
        {
          id: 'customers',
          name: 'Customer Reports',
          description: 'Customer analytics and behavior insights',
          icon: UserGroupIcon,
          reports: [
            {
              id: 'customer-analysis',
              name: 'Customer Analysis Report',
              description: 'Customer segmentation and buying patterns',
              type: 'standard',
              frequency: 'Monthly',
              lastGenerated: '2024-10-01 12:00',
              status: 'available'
            },
            {
              id: 'customer-visits',
              name: 'Customer Visit Report',
              description: 'Customer visit frequency and outcomes',
              type: 'standard',
              frequency: 'Weekly',
              lastGenerated: '2024-10-07 14:00',
              status: 'available'
            }
          ]
        },
        {
          id: 'inventory',
          name: 'Inventory Reports',
          description: 'Stock levels and inventory management',
          icon: BuildingStorefrontIcon,
          reports: [
            {
              id: 'stock-levels',
              name: 'Stock Levels Report',
              description: 'Current stock levels across all locations',
              type: 'standard',
              frequency: 'Daily',
              lastGenerated: '2024-10-14 06:00',
              status: 'available'
            },
            {
              id: 'inventory-movement',
              name: 'Inventory Movement Report',
              description: 'Detailed inventory movements and transfers',
              type: 'standard',
              frequency: 'Weekly',
              lastGenerated: '2024-10-07 16:00',
              status: 'available'
            }
          ]
        },
        {
          id: 'financial',
          name: 'Financial Reports',
          description: 'Financial performance and accounting reports',
          icon: CurrencyDollarIcon,
          reports: [
            {
              id: 'revenue-report',
              name: 'Revenue Report',
              description: 'Comprehensive revenue analysis',
              type: 'standard',
              frequency: 'Monthly',
              lastGenerated: '2024-10-01 15:00',
              status: 'available'
            },
            {
              id: 'commission-report',
              name: 'Commission Report',
              description: 'Agent commission calculations and payments',
              type: 'standard',
              frequency: 'Monthly',
              lastGenerated: '2024-10-01 16:00',
              status: 'available'
            }
          ]
        },
        {
          id: 'operational',
          name: 'Operational Reports',
          description: 'Operational efficiency and performance metrics',
          icon: ClipboardDocumentListIcon,
          reports: [
            {
              id: 'kpi-dashboard',
              name: 'KPI Dashboard Report',
              description: 'Key performance indicators summary',
              type: 'standard',
              frequency: 'Daily',
              lastGenerated: '2024-10-14 09:00',
              status: 'available'
            },
            {
              id: 'efficiency-report',
              name: 'Operational Efficiency Report',
              description: 'Analysis of operational efficiency metrics',
              type: 'standard',
              frequency: 'Weekly',
              lastGenerated: '2024-10-07 18:00',
              status: 'available'
            }
          ]
        }
      ];

      setReports(mockReports);
      setLoading(false);
    };

    fetchReports();
  }, []);

  const filteredReports = reports.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.reports.some(report => 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const selectedCategoryData = reports.find(cat => cat.id === selectedCategory);

  const handleGenerateReport = (reportId: string) => {
    console.log('Generating report:', reportId);
    // In production, this would trigger report generation
  };

  const handleDownloadReport = (reportId: string) => {
    console.log('Downloading report:', reportId);
    // In production, this would download the report
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'generating': return 'text-yellow-600 bg-yellow-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                <p className="mt-2 text-gray-600">Generate and download comprehensive business reports</p>
              </div>
              <div className="flex items-center space-x-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Create Custom Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Categories</h3>
              
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <FunnelIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                {reports.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <IconComponent className="h-5 w-5 mr-3" />
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-gray-500">{category.reports.length} reports</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {selectedCategoryData && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <selectedCategoryData.icon className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedCategoryData.name}</h2>
                      <p className="text-gray-600">{selectedCategoryData.description}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid gap-6">
                    {selectedCategoryData.reports.map((report) => (
                      <div key={report.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 mr-3">{report.name}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                {report.status}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-4">{report.description}</p>
                            
                            <div className="flex items-center text-sm text-gray-500 space-x-6">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                Frequency: {report.frequency}
                              </div>
                              {report.lastGenerated && (
                                <div className="flex items-center">
                                  <ClipboardDocumentListIcon className="h-4 w-4 mr-1" />
                                  Last Generated: {report.lastGenerated}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 ml-6">
                            <button
                              onClick={() => handleGenerateReport(report.id)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                            >
                              Generate
                            </button>
                            {report.status === 'available' && (
                              <button
                                onClick={() => handleDownloadReport(report.id)}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm flex items-center"
                              >
                                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                                Download
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
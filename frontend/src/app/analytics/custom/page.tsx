'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Plus, 
  BarChart3, 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  Play,
  Settings,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Warehouse
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import analyticsService, { 
  CustomReport, 
  CustomReportsResponse, 
  ReportParameters, 
  GeneratedReport 
} from '@/services/analytics.service';

interface ReportFormData {
  reportId: string;
  parameters: ReportParameters;
}

const categoryIcons = {
  Sales: DollarSign,
  Products: Package,
  Customers: Users,
  Performance: TrendingUp,
  Inventory: Warehouse
};

const categoryColors = {
  Sales: 'bg-green-100 text-green-800',
  Products: 'bg-blue-100 text-blue-800',
  Customers: 'bg-purple-100 text-purple-800',
  Performance: 'bg-orange-100 text-orange-800',
  Inventory: 'bg-gray-100 text-gray-800'
};

export default function CustomReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFormData, setReportFormData] = useState<ReportFormData>({
    reportId: '',
    parameters: analyticsService.getReportParameterDefaults()
  });
  const { success, error } = useToast();

  useEffect(() => {
    loadCustomReports();
  }, []);

  const loadCustomReports = async () => {
    try {
      setIsLoading(true);
      const response: CustomReportsResponse = await analyticsService.getCustomReports();
      setReports(response.reports);
      setCategories(['All', ...response.categories]);
    } catch (err) {
      console.error('Failed to load custom reports:', err);
      error('Failed to load custom reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async (reportId: string, parameters?: ReportParameters) => {
    try {
      setGeneratingReports(prev => new Set(prev).add(reportId));
      const reportParams = parameters || analyticsService.getReportParameterDefaults();
      const generatedReport = await analyticsService.generateCustomReport(reportId, reportParams);
      setGeneratedReport(generatedReport);
      setShowReportModal(true);
      success('Report generated successfully');
    } catch (err) {
      console.error('Failed to generate report:', err);
      error('Failed to generate report');
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const handleExportReport = async (reportId: string, format: 'csv' | 'json' = 'csv') => {
    try {
      const blob = await analyticsService.exportCustomReport(
        reportId, 
        reportFormData.parameters, 
        format
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportId}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      success(`Report exported as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Failed to export report:', err);
      error('Failed to export report');
    }
  };

  const filteredReports = selectedCategory === 'All' 
    ? reports 
    : reports.filter(report => report.category === selectedCategory);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Custom Reports</h1>
              <p className="text-gray-600 mt-1">Generate detailed business reports with real-time data</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "primary" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map(report => {
              const IconComponent = categoryIcons[report.category as keyof typeof categoryIcons] || FileText;
              const isGenerating = generatingReports.has(report.id);
              
              return (
                <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{report.name}</h3>
                        <Badge 
                          className={`text-xs ${categoryColors[report.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}`}
                        >
                          {report.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {report.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>Type: {report.type}</span>
                    <span>{report.parameters.length} parameters</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleGenerateReport(report.id)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <LoadingSpinner className="h-3 w-3 mr-2" />
                      ) : (
                        <Play className="h-3 w-3 mr-2" />
                      )}
                      Generate
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleExportReport(report.id, 'csv')}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredReports.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {selectedCategory === 'All' ? 'No reports available' : `No ${selectedCategory} reports`}
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedCategory === 'All' 
                    ? 'Create your first custom report to get started' 
                    : `No reports found in the ${selectedCategory} category`
                  }
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Report Modal */}
        {showReportModal && generatedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">{generatedReport.reportName}</h2>
                    <p className="text-gray-600 text-sm">
                      Generated on {new Date(generatedReport.generatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleExportReport(generatedReport.reportId, 'csv')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleExportReport(generatedReport.reportId, 'json')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowReportModal(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {/* Summary Section */}
                  {generatedReport.data.summary && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(generatedReport.data.summary).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm text-gray-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-lg font-semibold">
                              {typeof value === 'number' 
                                ? key.toLowerCase().includes('revenue') || key.toLowerCase().includes('value')
                                  ? `$${value.toLocaleString()}`
                                  : value.toLocaleString()
                                : String(value)
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data Tables */}
                  {Object.entries(generatedReport.data).map(([key, value]) => {
                    if (key === 'summary' || !Array.isArray(value) || value.length === 0) return null;
                    
                    return (
                      <div key={key}>
                        <h3 className="text-lg font-semibold mb-3 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                              <tr>
                                {Object.keys(value[0]).map(header => (
                                  <th key={header} className="px-4 py-2 text-left text-sm font-medium text-gray-700 capitalize">
                                    {header.replace(/([A-Z])/g, ' $1').trim()}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {value.slice(0, 10).map((row: any, index: number) => (
                                <tr key={index} className="border-t">
                                  {Object.entries(row).map(([cellKey, cellValue]) => (
                                    <td key={cellKey} className="px-4 py-2 text-sm">
                                      {typeof cellValue === 'number'
                                        ? cellKey.toLowerCase().includes('revenue') || 
                                          cellKey.toLowerCase().includes('value') ||
                                          cellKey.toLowerCase().includes('price')
                                          ? `$${cellValue.toLocaleString()}`
                                          : cellValue.toLocaleString()
                                        : String(cellValue)
                                      }
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {value.length > 10 && (
                            <p className="text-sm text-gray-600 mt-2">
                              Showing first 10 of {value.length} records. Export for complete data.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ErrorBoundary>
  );
}

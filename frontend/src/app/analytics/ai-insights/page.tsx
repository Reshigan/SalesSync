'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Brain, Lightbulb, AlertCircle, RefreshCw, TrendingUp, Package, Users, BarChart3 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import analyticsService, { AIInsightsResponse, AIInsight } from '@/services/analytics.service';

export default function AIInsightsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [insightsData, setInsightsData] = useState<AIInsightsResponse | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setIsLoading(true);
      const data = await analyticsService.getAIInsights();
      setInsightsData(data);
    } catch (err) {
      console.error('Error loading AI insights:', err);
      error('Failed to load AI insights');
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'inventory': return <Package className="h-6 w-6 text-blue-600" />;
      case 'sales': return <TrendingUp className="h-6 w-6 text-green-600" />;
      case 'performance': return <BarChart3 className="h-6 w-6 text-orange-600" />;
      case 'customer': return <Users className="h-6 w-6 text-purple-600" />;
      default: return <Brain className="h-6 w-6 text-gray-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'danger': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${(colors as any)[priority]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  if (isLoading) {
    return (
      <ErrorBoundary>
        <DashboardLayout>
          <LoadingPage />
        </DashboardLayout>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
              <p className="text-gray-600">Intelligent recommendations and alerts based on your data</p>
            </div>
            <Button onClick={loadInsights} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Summary Cards */}
          {insightsData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">High Priority</p>
                    <p className="text-2xl font-bold">{insightsData.summary.high}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Inventory</p>
                    <p className="text-2xl font-bold">{insightsData.summary.categories.inventory}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Sales</p>
                    <p className="text-2xl font-bold">{insightsData.summary.categories.sales}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="text-2xl font-bold">{insightsData.summary.categories.customer}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Insights List */}
          <div className="space-y-4">
            {insightsData?.insights.length === 0 ? (
              <Card className="p-8 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No insights available</h3>
                <p className="text-gray-600">Your AI assistant is analyzing your data. Check back later for insights.</p>
              </Card>
            ) : (
              insightsData?.insights.map((insight) => (
                <Card key={insight.id} className={`p-6 border-l-4 ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {getInsightIcon(insight.category)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">{insight.title}</h3>
                          {getPriorityBadge(insight.priority)}
                        </div>
                        <p className="text-gray-700 mb-3">{insight.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="capitalize">{insight.category}</span>
                          <span>•</span>
                          <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      {insight.action}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  );
}

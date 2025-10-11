'use client';
import { useState, useEffect } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Target, Brain, RefreshCw, Calendar } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import analyticsService, { PredictionsResponse, Prediction } from '@/services/analytics.service';

export default function PredictionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [predictionsData, setPredictionsData] = useState<PredictionsResponse | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const { success, error } = useToast();

  const fetchPredictions = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const data = await analyticsService.getPredictions(selectedPeriod);
      setPredictionsData(data);
      
      if (showRefreshLoader) {
        success('Predictions updated successfully');
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
      error('Failed to fetch predictions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [selectedPeriod]);

  const handleRefresh = () => {
    fetchPredictions(true);
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (<ErrorBoundary>
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Predictions</h1>
            <p className="text-gray-600 mt-1">Machine learning powered sales forecasts</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Next 7 days</option>
                <option value="14">Next 14 days</option>
                <option value="30">Next 30 days</option>
              </select>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {predictionsData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Accuracy</p>
                    <p className="text-2xl font-bold">{(predictionsData.summary.avgAccuracy * 100).toFixed(1)}%</p>
                  </div>
                  <Target className="h-8 w-8 text-green-600" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Predictions</p>
                    <p className="text-2xl font-bold">{predictionsData.summary.totalPredictions}</p>
                  </div>
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Upward Trends</p>
                    <p className="text-2xl font-bold text-green-600">{predictionsData.summary.upTrends}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Model Version</p>
                    <p className="text-2xl font-bold">{predictionsData.model.version}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Sales Predictions - {predictionsData.model.predictionPeriod}</h3>
                <div className="text-sm text-gray-500">
                  Generated: {new Date(predictionsData.generatedAt).toLocaleString()}
                </div>
              </div>
              
              {predictionsData.predictions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Product</th>
                        <th className="text-left py-3 px-4">SKU</th>
                        <th className="text-left py-3 px-4">Category</th>
                        <th className="text-left py-3 px-4">Predicted Sales</th>
                        <th className="text-left py-3 px-4">Confidence</th>
                        <th className="text-left py-3 px-4">Trend</th>
                        <th className="text-left py-3 px-4">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictionsData.predictions.map((pred, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{pred.productName}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{pred.productSku}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{pred.category}</td>
                          <td className="py-3 px-4">{pred.predictedSales.toLocaleString()} units</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${pred.confidence * 100}%` }}
                                ></div>
                              </div>
                              {(pred.confidence * 100).toFixed(0)}%
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {pred.trend === 'up' ? (
                              <TrendingUp className="h-5 w-5 text-green-600" />
                            ) : pred.trend === 'down' ? (
                              <TrendingDown className="h-5 w-5 text-red-600" />
                            ) : (
                              <div className="h-5 w-5 bg-gray-400 rounded-full"></div>
                            )}
                          </td>
                          <td className={`py-3 px-4 font-semibold ${
                            pred.trend === 'up' ? 'text-green-600' : 
                            pred.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {pred.change}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No predictions available</p>
                  <p className="text-sm">Insufficient historical data for forecasting</p>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Model Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Algorithm</p>
                  <p className="font-medium">{predictionsData.model.algorithm}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data Points</p>
                  <p className="font-medium">{predictionsData.model.dataPoints.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Trained</p>
                  <p className="font-medium">{new Date(predictionsData.model.lastTrained).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prediction Period</p>
                  <p className="font-medium">{predictionsData.model.predictionPeriod}</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
</ErrorBoundary>);
}

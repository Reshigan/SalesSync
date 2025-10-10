'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Target, Brain } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';

export default function PredictionsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const predictions = [
    { product: 'Product A', predicted: 5200, confidence: 0.92, trend: 'up', change: '+12%' },
    { product: 'Product B', predicted: 3800, confidence: 0.88, trend: 'down', change: '-5%' },
    { product: 'Product C', predicted: 6500, confidence: 0.95, trend: 'up', change: '+18%' },
  ];

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Predictions</h1>
          <p className="text-gray-600 mt-1">Machine learning powered sales forecasts</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Accuracy</p>
                <p className="text-2xl font-bold">91.5%</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Predictions Today</p>
                <p className="text-2xl font-bold">342</p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Model Version</p>
                <p className="text-2xl font-bold">v2.5</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Next Week Sales Predictions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Product</th>
                  <th className="text-left py-3 px-4">Predicted Sales</th>
                  <th className="text-left py-3 px-4">Confidence</th>
                  <th className="text-left py-3 px-4">Trend</th>
                  <th className="text-left py-3 px-4">Change</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((pred, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{pred.product}</td>
                    <td className="py-3 px-4">{pred.predicted.toLocaleString()}</td>
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
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </td>
                    <td className={`py-3 px-4 font-semibold ${
                      pred.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {pred.change}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>);
}

'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Brain, Lightbulb, AlertCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';

export default function AIInsightsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const insights = [
    { title: 'Low Stock Alert', type: 'warning', message: 'Product A running low in 3 territories', action: 'Restock' },
    { title: 'Sales Opportunity', type: 'success', message: 'Customer X showing increased demand', action: 'Upsell' },
    { title: 'Performance Drop', type: 'danger', message: 'Territory Y sales down 15%', action: 'Investigate' },
  ];

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">AI Insights</h1>
        <div className="grid gap-6">
          {insights.map((insight, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <Brain className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">{insight.title}</h3>
                    <p className="text-gray-600 mt-1">{insight.message}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md">{insight.action}</button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>);
}

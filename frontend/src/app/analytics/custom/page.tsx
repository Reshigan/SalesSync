'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, BarChart3 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';

export default function CustomReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Custom Reports</h1>
          <Button><Plus className="h-4 w-4 mr-2" />Create Report</Button>
        </div>
        <Card className="p-6">
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No custom reports yet</h3>
            <p className="text-gray-600">Create your first custom report to get started</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>);
}

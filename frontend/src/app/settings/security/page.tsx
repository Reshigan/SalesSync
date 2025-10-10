'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Shield } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';

export default function SecuritySettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Security Settings</h1>
        <p className="text-gray-600">Manage security and authentication</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Coming Soon</p>
            <p className="text-2xl font-bold">-</p>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>);
}

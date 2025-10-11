'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdvancedAnalytics from '@/components/analytics/AdvancedAnalytics'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';

import { 
  BarChart3, 
  Brain, 
  TrendingUp,
  PieChart,
  ArrowRight
} from 'lucide-react'

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const router = useRouter()

  return (<ErrorBoundary>
    <DashboardLayout>
      <AdvancedAnalytics />
    </DashboardLayout>
</ErrorBoundary>)
}

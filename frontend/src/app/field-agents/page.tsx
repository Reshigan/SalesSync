'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { MobileLayout, MobileCard, MobileList, MobileListItem } from '@/components/mobile'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';

import { 
  Map, 
  CreditCard, 
  Wifi,
  Gift,
  Users,
  MapPin,
  Package,
  Calendar,
  DollarSign,
  ArrowRight
} from 'lucide-react'

export default function FieldAgentsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { success, error } = useToast();
  const router = useRouter()

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sections = [
    {
      title: 'Agent Management',
      description: 'Manage field agents, performance, and territories',
      icon: Users,
      href: '/field-agents/agents',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Board Management',
      description: 'Track board placements and competitive analysis',
      icon: MapPin,
      href: '/field-agents/boards',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Product Distribution',
      description: 'Monitor product handouts and distribution',
      icon: Package,
      href: '/field-agents/distribution',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Visit Management',
      description: 'Schedule and track customer visits',
      icon: Calendar,
      href: '/field-agents/visits',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Commission Tracking',
      description: 'Monitor and process agent commissions',
      icon: DollarSign,
      href: '/field-agents/commissions',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Customer Management',
      description: 'Search, identify, and manage customer relationships',
      icon: Users,
      href: '/field-agents/customers',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50'
    },
    {
      title: 'Live Mapping',
      description: 'Real-time agent location tracking',
      icon: Map,
      href: '/field-agents/mapping',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'SIM Management',
      description: 'Manage agent SIM cards and connectivity',
      icon: Wifi,
      href: '/field-agents/sims',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
    },
    {
      title: 'Voucher Management',
      description: 'Issue and track agent vouchers',
      icon: Gift,
      href: '/field-agents/vouchers',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ]

  // Mobile version
  if (isMobile) {
    return (
      <ErrorBoundary>
        <MobileLayout title="Field Agents">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-blue-600">24</div>
                <div className="text-sm text-gray-600">Active Agents</div>
              </MobileCard>
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-green-600">156</div>
                <div className="text-sm text-gray-600">Visits Today</div>
              </MobileCard>
            </div>

            {/* Main Sections */}
            <MobileList>
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <MobileListItem
                    key={section.href}
                    title={section.title}
                    subtitle={section.description}
                    icon={
                      <div className={`p-2 rounded-lg ${section.bgColor}`}>
                        <Icon className={`h-5 w-5 ${section.color}`} />
                      </div>
                    }
                    onClick={() => router.push(section.href)}
                  />
                );
              })}
            </MobileList>
          </div>
        </MobileLayout>
      </ErrorBoundary>
    );
  }

  // Desktop version
  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Agents</h1>
          <p className="mt-2 text-gray-600">
            Monitor agent locations, performance, connectivity, and manage vouchers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <div 
                key={section.href}
                className="cursor-pointer bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
                onClick={() => router.push(section.href)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${section.bgColor}`}>
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">
                    {section.title}
                  </h3>
                  <p className="mt-2 text-gray-600">
                    {section.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>)
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { MobileLayout, MobileCard, MobileList, MobileListItem } from '@/components/mobile'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import visitService from '@/services/visit.service';
import customerService from '@/services/customer.service';
import boardService from '@/services/board.service';
import productService from '@/services/product.service';
import commissionService from '@/services/commission.service';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState({
    activeAgents: 0,
    visitsToday: 0,
    totalVisits: 0,
    completedVisits: 0,
    totalCustomers: 0,
    boardPlacements: 0,
    productDistributions: 0,
    totalCommissions: 0
  });
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

  // Load dashboard statistics
  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Get today's date range
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
      
      // Fetch data in parallel for better performance
      const [
        visitsResponse,
        customerStats,
        boardStats,
        productStats,
        commissionStats
      ] = await Promise.all([
        visitService.getVisits({
          dateFrom: todayStart,
          dateTo: todayEnd,
          limit: 1000
        }).catch(() => ({ visits: [], total: 0 })),
        
        customerService.getCustomerStats().catch(() => ({
          totalCustomers: 0,
          activeCustomers: 0
        })),
        
        boardService.getBoardPlacementStats({
          dateFrom: todayStart,
          dateTo: todayEnd
        }).catch(() => ({
          totalPlacements: 0,
          activePlacements: 0
        })),
        
        productService.getProductDistributionStats({
          dateFrom: todayStart,
          dateTo: todayEnd
        }).catch(() => ({
          totalDistributions: 0,
          completedDistributions: 0
        })),
        
        commissionService.getCommissionStats({
          dateFrom: todayStart,
          dateTo: todayEnd
        }).catch(() => ({
          totalCommissions: 0,
          totalAmount: 0
        }))
      ]);
      
      // Get all visits for broader statistics
      const allVisitsResponse = await visitService.getVisits({
        limit: 1000
      }).catch(() => ({ visits: [], total: 0 }));
      
      const allVisits = allVisitsResponse.visits || [];
      const todayVisits = visitsResponse.visits || [];
      
      // Calculate statistics
      const completedVisits = allVisits.filter(visit => 
        visit.status === 'COMPLETED'
      ).length;
      
      // Estimate active agents based on recent activity (visits in last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const recentVisits = allVisits.filter(visit => 
        new Date(visit.createdAt) >= new Date(weekAgo)
      );
      const activeAgents = new Set(recentVisits.map(visit => visit.agentId)).size;
      
      setStats({
        activeAgents,
        visitsToday: todayVisits.length,
        totalVisits: allVisitsResponse.total,
        completedVisits,
        totalCustomers: customerStats.totalCustomers || 0,
        boardPlacements: boardStats.totalPlacements || 0,
        productDistributions: productStats.totalDistributions || 0,
        totalCommissions: commissionStats.totalAmount || 0
      });
      
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      error('Failed to load dashboard statistics');
      
      // Set default stats on error
      setStats({
        activeAgents: 0,
        visitsToday: 0,
        totalVisits: 0,
        completedVisits: 0,
        totalCustomers: 0,
        boardPlacements: 0,
        productDistributions: 0,
        totalCommissions: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    if (isLoading) {
      return (
        <ErrorBoundary>
          <MobileLayout title="Field Agents">
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          </MobileLayout>
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary>
        <MobileLayout title="Field Agents">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.activeAgents}</div>
                <div className="text-sm text-gray-600">Active Agents</div>
              </MobileCard>
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.visitsToday}</div>
                <div className="text-sm text-gray-600">Visits Today</div>
              </MobileCard>
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.totalCustomers}</div>
                <div className="text-sm text-gray-600">Total Customers</div>
              </MobileCard>
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-emerald-600">${stats.totalCommissions.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Commissions</div>
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
  if (isLoading) {
    return (
      <ErrorBoundary>
        <DashboardLayout>
          <div className="p-6">
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          </div>
        </DashboardLayout>
      </ErrorBoundary>
    );
  }

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Agents</h1>
          <p className="mt-2 text-gray-600">
            Monitor agent locations, performance, connectivity, and manage vouchers
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.activeAgents}</div>
                <div className="text-sm text-gray-600">Active Agents</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.visitsToday}</div>
                <div className="text-sm text-gray-600">Visits Today</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-50">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalCustomers.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Customers</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-50">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.boardPlacements}</div>
                <div className="text-sm text-gray-600">Board Placements</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-cyan-50">
                <Package className="h-6 w-6 text-cyan-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.productDistributions}</div>
                <div className="text-sm text-gray-600">Product Distributions</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-emerald-50">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">${stats.totalCommissions.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Commissions</div>
              </div>
            </div>
          </div>
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

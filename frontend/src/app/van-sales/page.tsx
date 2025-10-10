'use client'
import { useState } from 'react';

import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import vanSalesService from '@/services/van-sales.service';

import { 
  Truck, 
  DollarSign, 
  Package,
  FileText,
  ArrowRight
} from 'lucide-react'

export default function VanSalesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const router = useRouter()

  const sections = [
    {
      title: 'Routes Management',
      description: 'Plan and manage sales routes for field agents',
      icon: Truck,
      href: '/van-sales/routes',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Van Loading',
      description: 'Load vans with inventory before routes',
      icon: Package,
      href: '/van-sales/loading',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Cash Management',
      description: 'Track cash collections and payments',
      icon: DollarSign,
      href: '/van-sales/cash',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Reconciliation',
      description: 'Reconcile cash and inventory at end of day',
      icon: FileText,
      href: '/van-sales/reconciliation',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Van Sales</h1>
          <p className="mt-2 text-gray-600">
            Manage field sales operations, routes, inventory, and cash collection
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

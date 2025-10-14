'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Shield, 
  Building2,
  MapPin,
  Truck,
  Route,
  Package,
  Settings,
  UserSquare,
  ArrowRight
} from 'lucide-react'

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const router = useRouter()

  const sections = [
    {
      title: 'Users',
      description: 'Manage system users and accounts',
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Roles & Permissions',
      description: 'Configure user roles and access control',
      icon: Shield,
      href: '/admin/roles',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Tenants',
      description: 'Manage tenant organizations',
      icon: Building2,
      href: '/admin/tenants',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Field Agents',
      description: 'Manage field sales agents',
      icon: UserSquare,
      href: '/admin/agents',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Areas',
      description: 'Define operational areas',
      icon: MapPin,
      href: '/admin/areas',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Routes',
      description: 'Configure sales routes',
      icon: Route,
      href: '/admin/routes',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Warehouses',
      description: 'Manage warehouse locations',
      icon: Package,
      href: '/admin/warehouses',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    {
      title: 'Suppliers',
      description: 'Manage supplier information',
      icon: Truck,
      href: '/admin/suppliers',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'System Settings',
      description: 'Configure system parameters',
      icon: Settings,
      href: '/admin/system',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ]

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="mt-2 text-gray-600">
            Manage users, permissions, organizational settings, and system configuration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <div 
                key={section.href}
                className="cursor-pointer hover:shadow-lg transition-shadow bg-white rounded-lg shadow-sm border border-gray-200"
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

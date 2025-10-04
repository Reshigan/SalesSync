'use client'

import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'

import { 
  FileText, 
  DollarSign, 
  CreditCard,
  ShoppingCart,
  RotateCcw,
  Percent,
  UserCheck,
  ClipboardList,
  ArrowRight
} from 'lucide-react'

export default function BackOfficePage() {
  const router = useRouter()

  const sections = [
    {
      title: 'Orders',
      description: 'Manage customer orders',
      icon: ShoppingCart,
      href: '/back-office/orders',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Invoices',
      description: 'Generate and manage invoices',
      icon: FileText,
      href: '/back-office/invoices',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Payments',
      description: 'Track payments and collections',
      icon: CreditCard,
      href: '/back-office/payments',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Transactions',
      description: 'View all financial transactions',
      icon: DollarSign,
      href: '/back-office/transactions',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Returns',
      description: 'Process product returns',
      icon: RotateCcw,
      href: '/back-office/returns',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Commissions',
      description: 'Calculate agent commissions',
      icon: Percent,
      href: '/back-office/commissions',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    {
      title: 'KYC Management',
      description: 'Manage customer verification',
      icon: UserCheck,
      href: '/back-office/kyc-management',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Surveys',
      description: 'Customer survey management',
      icon: ClipboardList,
      href: '/back-office/surveys',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    }
  ]

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Back Office</h1>
          <p className="mt-2 text-gray-600">
            Manage orders, invoices, payments, returns, commissions, and customer verification
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  )
}

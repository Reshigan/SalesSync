'use client'

import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'

import { 
  BarChart3, 
  Brain, 
  TrendingUp,
  PieChart,
  ArrowRight
} from 'lucide-react'

export default function AnalyticsPage() {
  const router = useRouter()

  const sections = [
    {
      title: 'Sales Analytics',
      description: 'Analyze sales performance and trends',
      icon: BarChart3,
      href: '/analytics/sales',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'AI Insights',
      description: 'Get AI-powered business insights',
      icon: Brain,
      href: '/analytics/ai-insights',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Predictions',
      description: 'View forecasts and predictions',
      icon: TrendingUp,
      href: '/analytics/predictions',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Custom Reports',
      description: 'Create and view custom analytics',
      icon: PieChart,
      href: '/analytics/custom',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ]

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">
            Access sales analytics, AI insights, predictions, and custom reports
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
  )
}

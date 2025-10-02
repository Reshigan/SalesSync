'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ImageAnalysis } from '@/components/ai/ImageAnalysis'
import { OfflineIndicator } from '@/components/offline/OfflineIndicator'
import { 
  Zap, 
  Users, 
  Package, 
  BarChart3,
  Smartphone,
  Eye,
  ShoppingBag,
  Settings,
  Star,
  Camera,
  Wifi,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Play,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default function DemoPage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null)

  const demoSections = [
    {
      id: 'van-sales',
      title: 'Van Sales Management',
      description: 'Mobile sales operations with route planning and cash reconciliation',
      icon: <Package className="w-8 h-8" />,
      color: 'bg-blue-500',
      features: ['Route Planning', 'Load Management', 'Cash Reconciliation', 'Customer Orders'],
      link: '/van-sales/loading'
    },
    {
      id: 'promotions',
      title: 'Promoter Activities',
      description: 'Brand activation campaigns with AI-powered verification',
      icon: <Star className="w-8 h-8" />,
      color: 'bg-purple-500',
      features: ['Campaign Tracking', 'Sample Distribution', 'Survey Collection', 'Photo Verification'],
      link: '/promotions/activities'
    },
    {
      id: 'merchandising',
      title: 'Merchandising Audits',
      description: 'Shelf compliance and competitor intelligence gathering',
      icon: <Eye className="w-8 h-8" />,
      color: 'bg-green-500',
      features: ['Store Visits', 'Shelf Share Analysis', 'Planogram Compliance', 'AI Image Analysis'],
      link: '/merchandising/visits'
    },
    {
      id: 'field-agents',
      title: 'Field Agent Operations',
      description: 'Digital distribution and SIM card management',
      icon: <Smartphone className="w-8 h-8" />,
      color: 'bg-orange-500',
      features: ['SIM Distribution', 'KYC Verification', 'Digital Vouchers', 'Board Placement'],
      link: '/field-agents/sims'
    }
  ]

  const keyFeatures = [
    {
      title: 'AI-Powered Image Analysis',
      description: 'Automatic shelf analysis, product recognition, and compliance checking',
      icon: <Camera className="w-6 h-6 text-blue-600" />,
      demo: 'ai-analysis'
    },
    {
      title: 'Offline-First Architecture',
      description: 'Works seamlessly without internet, syncs when connection is restored',
      icon: <Wifi className="w-6 h-6 text-green-600" />,
      demo: 'offline-mode'
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center py-12 bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl text-white">
          <h1 className="text-4xl font-bold mb-4">SalesSync Demo</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Experience the complete field force management platform with AI-powered analytics, 
            offline-first architecture, and comprehensive role-based interfaces.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
              <Play className="w-5 h-5 mr-2" />
              Start Interactive Demo
            </Button>
          </div>
        </div>

        {/* Key Features */}
        <Card>
          <Card.Header>
            <h2 className="text-2xl font-bold">Key Features</h2>
            <p className="text-gray-600">Explore the advanced capabilities that set SalesSync apart</p>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-2 gap-6">
              {keyFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                  <div className="flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setActiveDemo(feature.demo)}
                    >
                      Try Demo
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>

        {/* Module Demos */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Module Demonstrations</h2>
          <div className="grid grid-cols-2 gap-6">
            {demoSections.map((section) => (
              <Card key={section.id} className="hover:shadow-lg transition-shadow">
                <Card.Content className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`${section.color} text-white p-3 rounded-lg flex-shrink-0`}>
                      {section.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {section.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {section.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {section.features.map((feature, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                      <Link href={section.link}>
                        <Button size="sm" className="w-full">
                          Explore Module
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        </div>

        {/* Interactive Demos */}
        {activeDemo === 'ai-analysis' && (
          <Card>
            <Card.Header>
              <h3 className="text-xl font-semibold">AI Image Analysis Demo</h3>
              <p className="text-gray-600">Upload an image to see our AI-powered analysis in action</p>
            </Card.Header>
            <Card.Content>
              <ImageAnalysis analysisType="shelf" />
            </Card.Content>
          </Card>
        )}

        {activeDemo === 'offline-mode' && (
          <Card>
            <Card.Header>
              <h3 className="text-xl font-semibold">Offline Mode Demo</h3>
              <p className="text-gray-600">See how the system works without internet connection</p>
            </Card.Header>
            <Card.Content>
              <div className="flex justify-center">
                <OfflineIndicator />
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Offline Capabilities</h4>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1">
                      <li>• Data entry and form submission</li>
                      <li>• Photo capture and storage</li>
                      <li>• Route navigation and GPS tracking</li>
                      <li>• Automatic sync when connection restored</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
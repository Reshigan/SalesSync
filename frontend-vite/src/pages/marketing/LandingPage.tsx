import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  MapPin, 
  BarChart3,
  Zap,
  Shield,
  Globe,
  Smartphone,
  Clock,
  DollarSign
} from 'lucide-react'

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/salessync-logo.svg" alt="SalesSync" className="h-10" />
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Features</a>
              <a href="#benefits" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Benefits</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Pricing</a>
              <Link 
                to="/auth/login" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`pt-32 pb-20 px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                  Enterprise Field Force & Van Sales Platform
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Transform Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
                  Field Operations
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Empower your sales teams with real-time visibility, intelligent route optimization, 
                and seamless order management. Built for modern enterprises.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/auth/login"
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg transition-all font-semibold text-lg group"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a 
                  href="#features"
                  className="inline-flex items-center justify-center border-2 border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 px-8 py-4 rounded-lg transition-all font-semibold text-lg"
                >
                  Learn More
                </a>
              </div>
              <div className="flex items-center space-x-8 pt-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600">No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600">14-day free trial</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Sales Growth</p>
                        <p className="text-2xl font-bold text-gray-900">+42%</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Users className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Active Agents</p>
                        <p className="text-2xl font-bold text-gray-900">1,247</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Routes Optimized</p>
                        <p className="text-2xl font-bold text-gray-900">8,432</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools designed for enterprise field operations and van sales management
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: 'Route Optimization',
                description: 'AI-powered route planning that saves time and fuel costs while maximizing coverage',
                color: 'blue'
              },
              {
                icon: Smartphone,
                title: 'Mobile-First Design',
                description: 'Native mobile experience for field agents with offline capabilities',
                color: 'green'
              },
              {
                icon: BarChart3,
                title: 'Real-Time Analytics',
                description: 'Live dashboards with actionable insights into sales performance and KPIs',
                color: 'purple'
              },
              {
                icon: Users,
                title: 'Team Management',
                description: 'Efficiently manage field teams, territories, and commission structures',
                color: 'orange'
              },
              {
                icon: Zap,
                title: 'Instant Sync',
                description: 'Real-time data synchronization across all devices and locations',
                color: 'yellow'
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'Bank-level encryption and compliance with industry standards',
                color: 'red'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
              >
                <div className={`inline-flex p-3 bg-${feature.color}-100 rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-6 w-6 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose SalesSync?
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Join hundreds of enterprises transforming their field operations
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Clock, value: '40%', label: 'Time Saved' },
              { icon: DollarSign, value: '35%', label: 'Cost Reduction' },
              { icon: TrendingUp, value: '50%', label: 'Sales Increase' },
              { icon: Globe, value: '99.9%', label: 'Uptime SLA' }
            ].map((stat, index) => (
              <div key={index} className="text-center p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
                <stat.icon className="h-12 w-12 text-white mx-auto mb-4" />
                <div className="text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-blue-100 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your business needs
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '$49',
                period: 'per user/month',
                features: [
                  'Up to 10 field agents',
                  'Basic route optimization',
                  'Mobile app access',
                  'Email support',
                  'Standard analytics'
                ]
              },
              {
                name: 'Professional',
                price: '$99',
                period: 'per user/month',
                features: [
                  'Up to 50 field agents',
                  'Advanced route optimization',
                  'Offline mode',
                  'Priority support',
                  'Advanced analytics',
                  'Custom integrations'
                ],
                popular: true
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: 'contact sales',
                features: [
                  'Unlimited field agents',
                  'AI-powered optimization',
                  'Dedicated account manager',
                  '24/7 phone support',
                  'Custom development',
                  'SLA guarantee'
                ]
              }
            ].map((plan, index) => (
              <div 
                key={index}
                className={`relative p-8 rounded-2xl border-2 ${
                  plan.popular 
                    ? 'border-blue-600 shadow-2xl scale-105' 
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-1">{plan.price}</div>
                  <div className="text-gray-600">{plan.period}</div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth/login"
                  className={`block text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Field Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join leading enterprises using SalesSync to drive growth and efficiency
          </p>
          <Link
            to="/auth/login"
            className="inline-flex items-center bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-lg transition-all font-semibold text-lg group"
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <img src="/salessync-logo.svg" alt="SalesSync" className="h-10 mb-4 brightness-0 invert" />
              <p className="text-gray-400 mb-4">
                Enterprise Field Force & Van Sales Platform
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>A Product of</span>
                <img src="/gonxt-logo.svg" alt="GONXT" className="h-6" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="https://www.gonxt.tech" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">About GONXT</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 SalesSync by GONXT. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

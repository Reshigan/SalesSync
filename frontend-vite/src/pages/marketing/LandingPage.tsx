import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle } from 'lucide-react'

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
        <div className="max-w-7xl mx-auto text-center">
          <div className="space-y-8 max-w-4xl mx-auto">
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
          </div>
        </div>
      </section>

      {/* Features Section with Screenshots */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Major Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See SalesSync in action with real screenshots from our platform
            </p>
          </div>

          {/* Feature 1: Dashboard */}
          <div className="mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <img 
                  src="/dashboard-screenshot.png" 
                  alt="SalesSync Dashboard" 
                  className="rounded-xl shadow-2xl border border-gray-200"
                />
              </div>
              <div className="order-1 lg:order-2 space-y-4">
                <h3 className="text-3xl font-bold text-gray-900">Comprehensive Dashboard</h3>
                <p className="text-lg text-gray-600">
                  Get a complete overview of your field operations with real-time insights and analytics.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Real-time KPIs and performance metrics across all modules</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Interactive charts and visualizations for data-driven decisions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Customizable widgets to focus on what matters most</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature 2: Field Operations */}
          <div className="mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h3 className="text-3xl font-bold text-gray-900">Field Operations Management</h3>
                <p className="text-lg text-gray-600">
                  Empower your field agents with mobile-first tools for visits, surveys, and KYC.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">GPS-tracked visits with photo capture and geo-tagging</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Dynamic surveys and KYC forms with offline support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Board placement tracking and brand visibility monitoring</span>
                  </li>
                </ul>
              </div>
              <div>
                <img 
                  src="/field-ops-screenshot.png" 
                  alt="Field Operations" 
                  className="rounded-xl shadow-2xl border border-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Feature 3: Analytics */}
          <div className="mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <img 
                  src="/analytics-screenshot.png" 
                  alt="Advanced Analytics" 
                  className="rounded-xl shadow-2xl border border-gray-200"
                />
              </div>
              <div className="order-1 lg:order-2 space-y-4">
                <h3 className="text-3xl font-bold text-gray-900">Advanced Analytics & Reporting</h3>
                <p className="text-lg text-gray-600">
                  Make data-driven decisions with comprehensive analytics across all business functions.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Multi-dimensional analytics for sales, inventory, and commissions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Time-series tracking with daily, weekly, and monthly views</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Export reports in multiple formats for stakeholder sharing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature 4: Van Sales */}
          <div className="mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h3 className="text-3xl font-bold text-gray-900">Van Sales & Route Optimization</h3>
                <p className="text-lg text-gray-600">
                  Streamline van sales operations with intelligent routing and inventory management.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">AI-powered route planning to maximize coverage and minimize costs</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Real-time van inventory tracking with load management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Cash session management and payment collection tracking</span>
                  </li>
                </ul>
              </div>
              <div>
                <img 
                  src="/van-sales-screenshot.png" 
                  alt="Van Sales Management" 
                  className="rounded-xl shadow-2xl border border-gray-200"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Field Operations?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join leading enterprises using SalesSync to empower their field teams
          </p>
          <Link 
            to="/auth/login"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-lg transition-all font-semibold text-xl group shadow-xl"
          >
            Sign In to Get Started
            <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <img src="/gonxt-logo.svg" alt="GONXT" className="h-8" />
              <span className="text-gray-400">A GONXT Product</span>
            </div>
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} GONXT. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <a href="https://www.gonxt.tech" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                www.gonxt.tech
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

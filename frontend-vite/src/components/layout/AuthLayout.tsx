import { Outlet } from 'react-router-dom'
import { Building2 } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <Building2 className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SalesSync</h1>
              <p className="text-blue-100 text-sm">Enterprise Edition</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Complete Business
            <br />
            Management Platform
          </h2>
          <p className="text-blue-100 text-lg">
            Streamline your operations with 15+ enterprise modules, 
            real-time analytics, and powerful automation tools.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold text-white mb-1">15+</div>
              <div className="text-blue-100 text-sm">Enterprise Modules</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold text-white mb-1">99.9%</div>
              <div className="text-blue-100 text-sm">Uptime SLA</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold text-white mb-1">24/7</div>
              <div className="text-blue-100 text-sm">Support</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold text-white mb-1">SSL</div>
              <div className="text-blue-100 text-sm">Secured</div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-blue-100 text-sm">
            &copy; 2024 SalesSync. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-900">SalesSync</h1>
                <p className="text-gray-500 text-xs">Enterprise Edition</p>
              </div>
            </div>
          </div>

          {/* Form container */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <Outlet />
          </div>

          {/* Demo credentials hint - Mobile */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Demo: <span className="font-mono text-gray-700">admin@demo.com</span> / <span className="font-mono text-gray-700">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
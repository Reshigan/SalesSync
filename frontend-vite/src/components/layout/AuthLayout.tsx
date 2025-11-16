import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="relative z-10">
          <Link to="/" className="inline-block">
            <img src="/salessync-logo.svg" alt="SalesSync" className="h-12 brightness-0 invert" />
          </Link>
          <p className="text-blue-100 text-sm mt-2">Enterprise Field Force & Van Sales Platform</p>
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

        <div className="relative z-10 flex items-center space-x-2">
          <span className="text-blue-100 text-sm">A Product of</span>
          <img src="/gonxt-logo.svg" alt="GONXT" className="h-6" />
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-block">
              <img src="/salessync-logo.svg" alt="SalesSync" className="h-10" />
            </Link>
            <p className="text-gray-500 text-sm mt-2">Enterprise Field Force & Van Sales Platform</p>
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

          {/* GONXT branding - Mobile */}
          <div className="lg:hidden mt-8 text-center flex items-center justify-center space-x-2">
            <span className="text-gray-500 text-sm">A Product of</span>
            <img src="/gonxt-logo.svg" alt="GONXT" className="h-5" />
          </div>
        </div>
      </div>
    </div>
  )
}

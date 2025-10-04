'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Eye, EyeOff, Zap, TrendingUp, Users, Package } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* Floating Particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-purple-400 rounded-full animate-float"></div>
        <div className="absolute top-40 right-32 w-3 h-3 bg-blue-400 rounded-full animate-float animation-delay-1000"></div>
        <div className="absolute bottom-32 left-40 w-2 h-2 bg-pink-400 rounded-full animate-float animation-delay-2000"></div>
        <div className="absolute bottom-40 right-20 w-3 h-3 bg-purple-400 rounded-full animate-float animation-delay-3000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo & Branding */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mb-6 shadow-2xl shadow-purple-500/50 transform hover:scale-110 transition-transform duration-300">
              <Zap className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-2">
              SalesSync
            </h1>
            <p className="text-purple-300 text-lg font-medium">
              Next-Gen Field Force Platform
            </p>
          </div>

          {/* Login Card */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 animate-slide-up">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 text-red-200 px-4 py-3 rounded-xl animate-shake">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-purple-200">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@company.com"
                  required
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-purple-200">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/50 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          {/* Features */}
          <div className="mt-8 text-center animate-fade-in animation-delay-500">
            <div className="flex justify-center gap-8 text-purple-300">
              <div className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className="p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 group-hover:border-purple-500/50 transition-all">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Analytics</span>
              </div>
              <div className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className="p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 group-hover:border-purple-500/50 transition-all">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Field Force</span>
              </div>
              <div className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className="p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 group-hover:border-purple-500/50 transition-all">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Inventory</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.5; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 1; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
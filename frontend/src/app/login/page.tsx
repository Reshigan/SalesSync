'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AnimatedLogo } from '@/components/ui/AnimatedLogo'
import { Eye, EyeOff, Shield, TrendingUp, Users, Sparkles, Zap, Globe, Lock } from 'lucide-react'

import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading: authLoading } = useAuthStore()
  const [formData, setFormData] = useState({
    email: 'admin@demo.com',
    password: 'admin123',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [isFormFocused, setIsFormFocused] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      await login(formData.email, formData.password)
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed')
    }
  }

  if (!mounted) {
    return <LoadingPage />
  }

  return (
    <>
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-slate-50">
          {/* Floating Orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-emerald-200/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23334155' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Logo & Branding */}
            <div className={`text-center mb-8 transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="mb-6">
                <AnimatedLogo size="xl" showText={true} className="justify-center" />
              </div>
              <p className="text-slate-600 text-lg font-medium">Welcome back to the future of sales</p>
            </div>

            {/* Login Card */}
            <div className={`bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 p-8 transition-all duration-1000 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            } ${isFormFocused ? 'scale-105 shadow-3xl' : ''}`}
            style={{ animationDelay: '0.2s' }}>
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 backdrop-blur border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-shake">
                    <p className="text-sm font-medium flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      {error}
                    </p>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Email Address
                  </label>
                  <div className="relative group">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onFocus={() => setIsFormFocused(true)}
                      onBlur={() => setIsFormFocused(false)}
                      placeholder="you@company.com"
                      required
                      className="w-full px-4 py-4 bg-slate-50/80 backdrop-blur border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 group-hover:bg-slate-50"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700 flex items-center">
                      <Lock className="w-4 h-4 mr-2" />
                      Password
                    </label>
                    <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onFocus={() => setIsFormFocused(true)}
                      onBlur={() => setIsFormFocused(false)}
                      placeholder="Enter your password"
                      required
                      className="w-full px-4 py-4 bg-slate-50/80 backdrop-blur border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 group-hover:bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/0 via-purple-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-400/50 border-slate-300 rounded bg-slate-50"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                    Remember me for 30 days
                  </label>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-4 px-4 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  {authLoading ? (
                    <span className="flex items-center justify-center relative z-10">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                      Signing in...
                    </span>
                  ) : (
                    <span className="relative z-10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Sign In
                    </span>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="mt-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white backdrop-blur text-slate-500 rounded-full">Trusted by enterprises worldwide</span>
                </div>
              </div>

              {/* Features */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="text-center group cursor-pointer">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 backdrop-blur rounded-xl mb-3 group-hover:bg-blue-200 transition-all duration-300 group-hover:scale-110">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium">Bank-Grade Security</p>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 backdrop-blur rounded-xl mb-3 group-hover:bg-emerald-200 transition-all duration-300 group-hover:scale-110">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium">Real-time Analytics</p>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 backdrop-blur rounded-xl mb-3 group-hover:bg-purple-200 transition-all duration-300 group-hover:scale-110">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium">Global Scale</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`mt-8 text-center text-sm text-slate-500 transition-all duration-1000 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`} style={{ animationDelay: '0.4s' }}>
              <p>© 2025 SalesSync. Enterprise-grade field force management.</p>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-purple-500 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-10 right-10 w-1 h-1 bg-blue-600 rounded-full animate-ping" style={{ animationDelay: '3s' }}></div>
      </div>
    </>
  )
}
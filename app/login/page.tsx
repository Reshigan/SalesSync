'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Layers, TrendingUp, Shield, Users } from 'lucide-react'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    tenantCode: 'DEMO',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(formData.email, formData.password, formData.tenantCode)
      toast.success('Login successful!')
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const quickLogin = (email: string, password: string) => {
    setFormData(prev => ({ ...prev, email, password }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-between text-white">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold">SalesSync</h1>
          </div>
          <p className="text-xl text-blue-100 mb-12">
            Enterprise Field Force Platform
          </p>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Shield className="w-8 h-8 mb-4 text-blue-200" />
              <h3 className="font-semibold mb-2">Secure</h3>
              <p className="text-sm text-blue-100">Enterprise-grade security</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <TrendingUp className="w-8 h-8 mb-4 text-blue-200" />
              <h3 className="font-semibold mb-2">Analytics</h3>
              <p className="text-sm text-blue-100">Real-time insights</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <Users className="w-8 h-8 mb-4 text-blue-200" />
            <h3 className="font-semibold mb-2">Scalable</h3>
            <p className="text-sm text-blue-100">Built for enterprise teams</p>
          </div>
        </div>

        <div className="text-sm text-blue-200">
          © 2025 SalesSync. Enterprise-grade field force management.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">SalesSync</h1>
            </div>
            <p className="text-gray-600">Enterprise Field Force Platform</p>
          </div>

          <Card className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-600">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@company.com"
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-500"
                    onClick={() => router.push('/forgot-password')}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="tenantCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant Code
                </label>
                <Input
                  id="tenantCode"
                  name="tenantCode"
                  type="text"
                  value={formData.tenantCode}
                  onChange={handleInputChange}
                  placeholder="DEMO"
                  className="w-full"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Remember me for 30 days
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Quick Login Options */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">Quick login for demo:</p>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start"
                  onClick={() => quickLogin('admin@demo.com', 'admin123')}
                >
                  <span className="font-medium">Admin:</span>
                  <span className="ml-2 text-gray-600">admin@demo.com</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start"
                  onClick={() => quickLogin('agent@demo.com', 'agent123')}
                >
                  <span className="font-medium">Agent:</span>
                  <span className="ml-2 text-gray-600">agent@demo.com</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <Shield className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-xs text-gray-600">Secure</p>
            </div>
            <div className="p-4">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-xs text-gray-600">Analytics</p>
            </div>
            <div className="p-4">
              <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-xs text-gray-600">Scalable</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
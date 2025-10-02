'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Eye, EyeOff, Truck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()
  const [formData, setFormData] = useState({
    email: 'admin@demo.com',
    password: 'admin123',
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SalesSync</h1>
          <p className="text-gray-600 mt-2">Advanced Field Force Platform</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Email */}
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
              required
            />

            {/* Password */}
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter your password"
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Login Button */}
            <Button type="submit" fullWidth loading={isLoading}>
              Sign In
            </Button>

            {/* Demo Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Demo Credentials</h4>
              <p className="text-sm text-blue-700">
                Email: demo@salessync.com<br />
                Password: demo123
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Backend API integration with JWT authentication
              </p>
            </div>
          </form>
        </Card>

        {/* Features */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">Comprehensive Field Force Management</p>
          <div className="flex justify-center space-x-6 text-xs text-gray-500">
            <span>• Van Sales</span>
            <span>• Promotions</span>
            <span>• Merchandising</span>
            <span>• Analytics</span>
          </div>
        </div>
      </div>
    </div>
  )
}
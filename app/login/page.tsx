'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Simple login logic
    if (formData.email && formData.password) {
      alert('Login functionality will be implemented')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">SalesSync</h1>
          </div>
          <p className="text-gray-600">Enterprise Field Force Platform</p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@company.com"
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="form-input"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
            >
              Sign In
            </button>
          </form>

          {/* Quick Login Options */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-600 mb-4">Quick login for demo:</p>
            <div className="space-y-2">
              <button
                type="button"
                className="btn btn-outline btn-sm w-full text-left justify-start"
                onClick={() => setFormData({ email: 'admin@demo.com', password: 'admin123' })}
              >
                <span className="font-medium">Admin:</span>
                <span className="ml-2 text-gray-600">admin@demo.com</span>
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm w-full text-left justify-start"
                onClick={() => setFormData({ email: 'agent@demo.com', password: 'agent123' })}
              >
                <span className="font-medium">Agent:</span>
                <span className="ml-2 text-gray-600">agent@demo.com</span>
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="w-6 h-6 mx-auto mb-2 bg-blue-600 rounded"></div>
            <p className="text-xs text-gray-600">Secure</p>
          </div>
          <div className="p-4">
            <div className="w-6 h-6 mx-auto mb-2 bg-blue-600 rounded"></div>
            <p className="text-xs text-gray-600">Analytics</p>
          </div>
          <div className="p-4">
            <div className="w-6 h-6 mx-auto mb-2 bg-blue-600 rounded"></div>
            <p className="text-xs text-gray-600">Scalable</p>
          </div>
        </div>
      </div>
    </div>
  )
}

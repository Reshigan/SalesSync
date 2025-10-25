import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface LoginFormData {
  email: string
  password: string
  remember_me: boolean
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    setIsFormVisible(true)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      remember_me: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError()
      await login(data)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    }
  }

  return (
    <div className={`space-y-6 transition-all duration-500 ease-out ${isFormVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome Back
        </h2>
        <p className="mt-3 text-base text-gray-600">
          Sign in to your account
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              type={showPassword ? 'text' : 'password'}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Remember me and forgot password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              {...register('remember_me')}
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 hover:text-gray-900 transition-colors">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              to="/auth/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Submit button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Mobile Login Link */}
      <div className="mt-6 text-center">
        <Link
          to="/auth/mobile-login"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Agent? Login with mobile number →
        </Link>
      </div>
    </div>
  )
}
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
    <div className={`space-y-6 transition-all duration-700 ease-out ${isFormVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Welcome Back
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to continue to your dashboard
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Email field */}
        <div className="group">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
              <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" />
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white hover:bg-white"
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 animate-pulse">{errors.email.message}</p>
          )}
        </div>

        {/* Password field */}
        <div className="group">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
              <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" />
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
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white hover:bg-white"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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
            <p className="mt-2 text-sm text-red-600 animate-pulse">{errors.password.message}</p>
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
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 animate-pulse">
            <div className="text-sm text-red-700 font-medium">{error}</div>
          </div>
        )}

        {/* Submit button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex justify-center items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Demo credentials */}
      {import.meta.env.DEV && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Demo Credentials
          </h3>
          <div className="space-y-2 text-xs text-gray-700">
            <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
              <span><strong>Admin:</strong> admin@salessync.com</span>
              <span className="text-blue-600 font-mono">admin123</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
              <span><strong>Manager:</strong> manager@salessync.com</span>
              <span className="text-blue-600 font-mono">manager123</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
              <span><strong>Agent:</strong> agent@salessync.com</span>
              <span className="text-blue-600 font-mono">agent123</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Login Link */}
      <div className="mt-6 text-center">
        <Link
          to="/auth/mobile-login"
          className="inline-flex items-center justify-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
        >
          <span>Agent? Login with mobile number →</span>
        </Link>
      </div>
    </div>
  )
}
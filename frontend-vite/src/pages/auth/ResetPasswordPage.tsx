import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react'
import { authService } from '../../services/auth.service'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface ResetPasswordFormData {
  password: string
  password_confirmation: string
}

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>()

  const password = watch('password')

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Invalid reset token')
      return
    }

    setIsLoading(true)
    try {
      await authService.resetPassword({
        token,
        password: data.password,
        password_confirmation: data.password_confirmation,
      })
      toast.success('Password reset successfully!')
      navigate('/auth/login')
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Invalid Reset Link
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            This password reset link is invalid or has expired.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/auth/forgot-password"
            className="btn-primary w-full"
          >
            Request new reset link
          </Link>
          
          <Link
            to="/auth/login"
            className="flex items-center justify-center text-sm text-primary-600 hover:text-primary-500"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/auth/login"
          className="flex items-center text-sm text-primary-600 hover:text-primary-500 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to sign in
        </Link>
        
        <h2 className="text-2xl font-bold text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your new password below.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* New password field */}
        <div>
          <label htmlFor="password" className="form-label">
            New password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                },
              })}
              type={showPassword ? 'text' : 'password'}
              className="form-input pl-10 pr-10"
              placeholder="Enter new password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="form-error">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm password field */}
        <div>
          <label htmlFor="password_confirmation" className="form-label">
            Confirm new password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('password_confirmation', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
              type={showConfirmPassword ? 'text' : 'password'}
              className="form-input pl-10 pr-10"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password_confirmation && (
            <p className="form-error">{errors.password_confirmation.message}</p>
          )}
        </div>

        {/* Password requirements */}
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-1">Password requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>At least 8 characters long</li>
            <li>Contains at least one uppercase letter</li>
            <li>Contains at least one lowercase letter</li>
            <li>Contains at least one number</li>
          </ul>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary flex justify-center items-center"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Resetting...
              </>
            ) : (
              'Reset password'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
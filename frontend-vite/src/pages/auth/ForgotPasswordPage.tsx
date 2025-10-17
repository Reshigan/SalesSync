import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft } from 'lucide-react'
import { authService } from '../../services/auth.service'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface ForgotPasswordFormData {
  email: string
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>()

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      await authService.forgotPassword(data)
      setIsSubmitted(true)
      toast.success('Password reset email sent!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center">
        <div>
          <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a password reset link to{' '}
            <span className="font-medium">{getValues('email')}</span>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          
          <button
            onClick={() => setIsSubmitted(false)}
            className="btn-outline w-full"
          >
            Try again
          </button>
          
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
          Forgot your password?
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          No worries! Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="email" className="form-label">
            Email address
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
              className="form-input pl-10"
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="form-error">{errors.email.message}</p>
          )}
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
                Sending...
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
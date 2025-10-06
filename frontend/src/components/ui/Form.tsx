'use client'

import { ReactNode, forwardRef } from 'react'
import { FieldError } from 'react-hook-form'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

// Form Field Wrapper
interface FormFieldProps {
  label?: string
  error?: FieldError | string
  required?: boolean
  children: ReactNode
  className?: string
}

export function FormField({ label, error, required, children, className = '' }: FormFieldProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {errorMessage && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}

// Enhanced Input with validation states
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
  icon?: ReactNode
  rightIcon?: ReactNode
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className = '', error, success, icon, rightIcon, ...props }, ref) => {
    const baseClasses = 'block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors'
    
    let stateClasses = 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
    if (error) {
      stateClasses = 'border-red-300 focus:ring-red-500 focus:border-red-500'
    } else if (success) {
      stateClasses = 'border-green-300 focus:ring-green-500 focus:border-green-500'
    }

    const iconClasses = icon ? 'pl-10' : ''
    const rightIconClasses = rightIcon ? 'pr-10' : ''

    return (
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{icon}</div>
          </div>
        )}
        <input
          ref={ref}
          className={`${baseClasses} ${stateClasses} ${iconClasses} ${rightIconClasses} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="text-gray-400">{rightIcon}</div>
          </div>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

// Password Input with toggle visibility
interface PasswordInputProps extends Omit<FormInputProps, 'type' | 'rightIcon'> {
  showToggle?: boolean
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    const toggleIcon = showToggle ? (
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    ) : undefined

    return (
      <FormInput
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={toggleIcon}
        {...props}
      />
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

// Select Input
interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  success?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className = '', error, success, options, placeholder, ...props }, ref) => {
    const baseClasses = 'block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors bg-white'
    
    let stateClasses = 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
    if (error) {
      stateClasses = 'border-red-300 focus:ring-red-500 focus:border-red-500'
    } else if (success) {
      stateClasses = 'border-green-300 focus:ring-green-500 focus:border-green-500'
    }

    return (
      <select
        ref={ref}
        className={`${baseClasses} ${stateClasses} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }
)

FormSelect.displayName = 'FormSelect'

// Textarea
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  success?: boolean
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className = '', error, success, ...props }, ref) => {
    const baseClasses = 'block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors resize-vertical'
    
    let stateClasses = 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
    if (error) {
      stateClasses = 'border-red-300 focus:ring-red-500 focus:border-red-500'
    } else if (success) {
      stateClasses = 'border-green-300 focus:ring-green-500 focus:border-green-500'
    }

    return (
      <textarea
        ref={ref}
        className={`${baseClasses} ${stateClasses} ${className}`}
        {...props}
      />
    )
  }
)

FormTextarea.displayName = 'FormTextarea'

// Checkbox
interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ className = '', label, description, ...props }, ref) => {
    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            className={`w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 ${className}`}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="ml-3 text-sm">
            {label && (
              <label className="font-medium text-gray-700">
                {label}
              </label>
            )}
            {description && (
              <p className="text-gray-500">{description}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)

FormCheckbox.displayName = 'FormCheckbox'

// Radio Group
interface RadioOption {
  value: string
  label: string
  description?: string
}

interface FormRadioGroupProps {
  name: string
  options: RadioOption[]
  value?: string
  onChange?: (value: string) => void
  error?: boolean
}

export function FormRadioGroup({ name, options, value, onChange, error }: FormRadioGroupProps) {
  const stateClasses = error 
    ? 'text-red-600 border-red-300 focus:ring-red-500' 
    : 'text-primary-600 border-gray-300 focus:ring-primary-500'

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <div key={option.value} className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              className={`w-4 h-4 border-2 focus:ring-2 ${stateClasses}`}
            />
          </div>
          <div className="ml-3 text-sm">
            <label className="font-medium text-gray-700">
              {option.label}
            </label>
            {option.description && (
              <p className="text-gray-500">{option.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// File Upload
interface FormFileUploadProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  error?: boolean
}

export const FormFileUpload = forwardRef<HTMLInputElement, FormFileUploadProps>(
  ({ className = '', label, description, error, ...props }, ref) => {
    const stateClasses = error 
      ? 'border-red-300 focus:ring-red-500' 
      : 'border-gray-300 focus:ring-primary-500'

    return (
      <div className={`border-2 border-dashed rounded-lg p-6 text-center ${stateClasses} ${className}`}>
        <input
          ref={ref}
          type="file"
          className="sr-only"
          {...props}
        />
        <div className="space-y-2">
          {label && (
            <p className="text-sm font-medium text-gray-700">{label}</p>
          )}
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={() => ref && 'current' in ref && ref.current?.click()}
          >
            Choose File
          </button>
        </div>
      </div>
    )
  }
)

FormFileUpload.displayName = 'FormFileUpload'
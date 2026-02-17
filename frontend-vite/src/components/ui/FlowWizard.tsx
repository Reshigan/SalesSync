import { useState, useCallback } from 'react'
import { ArrowLeft, ArrowRight, Check, X, AlertCircle, Loader2 } from 'lucide-react'

export interface WizardStep {
  id: string
  title: string
  description?: string
  fields: WizardField[]
  validate?: (data: Record<string, any>) => Record<string, string>
}

export interface WizardField {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox' | 'email' | 'tel' | 'search-select'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  defaultValue?: any
  helpText?: string
  disabled?: boolean
  colSpan?: 1 | 2
  min?: number
  max?: number
  step?: string
  validation?: (value: any) => string | null
  autoFocus?: boolean
  searchable?: boolean
  onChange?: (value: any, formData: Record<string, any>) => Record<string, any> | void
}

interface FlowWizardProps {
  title: string
  subtitle?: string
  steps: WizardStep[]
  onSubmit: (data: Record<string, any>) => Promise<void>
  onCancel: () => void
  submitLabel?: string
  initialData?: Record<string, any>
  icon?: React.ReactNode
}

export default function FlowWizard({
  title,
  subtitle,
  steps,
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  initialData = {},
  icon,
}: FlowWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const progress = ((currentStep + 1) / steps.length) * 100

  const handleChange = useCallback((name: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      const field = step.fields.find(f => f.name === name)
      if (field?.onChange) {
        const extra = field.onChange(value, updated)
        if (extra) return { ...updated, ...extra }
      }
      return updated
    })
    setTouched(prev => ({ ...prev, [name]: true }))
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }, [step, errors])

  const validateStep = useCallback(() => {
    const newErrors: Record<string, string> = {}

    step.fields.forEach(field => {
      const value = formData[field.name]
      if (field.required && (value === undefined || value === null || value === '')) {
        newErrors[field.name] = `${field.label} is required`
      }
      if (field.validation && value !== undefined && value !== null && value !== '') {
        const error = field.validation(value)
        if (error) newErrors[field.name] = error
      }
    })

    if (step.validate) {
      const stepErrors = step.validate(formData)
      Object.assign(newErrors, stepErrors)
    }

    setErrors(newErrors)
    const allTouched: Record<string, boolean> = {}
    step.fields.forEach(f => { allTouched[f.name] = true })
    setTouched(prev => ({ ...prev, ...allTouched }))

    return Object.keys(newErrors).length === 0
  }, [step, formData])

  const handleNext = useCallback(() => {
    if (!validateStep()) return
    if (isLastStep) {
      handleSubmit()
    } else {
      setCurrentStep(prev => prev + 1)
      setErrors({})
    }
  }, [validateStep, isLastStep])

  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
      setErrors({})
    }
  }, [isFirstStep])

  const handleSubmit = async () => {
    if (!validateStep()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit(formData)
    } catch (error: any) {
      setSubmitError(error.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault()
      handleNext()
    }
  }

  const renderField = (field: WizardField) => {
    const value = formData[field.name] ?? field.defaultValue ?? ''
    const error = touched[field.name] ? errors[field.name] : undefined
    const inputClass = `w-full px-4 py-3 border rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
      error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
    } ${field.disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled || submitting}
            className={inputClass}
            rows={3}
            autoFocus={field.autoFocus}
          />
        )

      case 'select':
      case 'search-select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={field.disabled || submitting}
            className={inputClass}
            autoFocus={field.autoFocus}
          >
            <option value="">Select {field.label.toLowerCase()}...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              disabled={field.disabled || submitting}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{field.placeholder || field.label}</span>
          </label>
        )

      default:
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleChange(field.name, field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled || submitting}
            className={inputClass}
            min={field.min}
            max={field.max}
            step={field.step}
            autoFocus={field.autoFocus}
          />
        )
    }
  }

  return (
    <div className="max-w-3xl mx-auto" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {icon && <div className="p-2 bg-blue-50 rounded-xl text-blue-600">{icon}</div>}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
                i < currentStep ? 'bg-green-500 text-white' :
                i === currentStep ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                'bg-gray-200 text-gray-500'
              }`}>
                {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                  i < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {steps.map((s, i) => (
            <span key={s.id} className={`text-xs font-medium ${
              i === currentStep ? 'text-blue-600' : i < currentStep ? 'text-green-600' : 'text-gray-400'
            }`} style={{ width: `${100 / steps.length}%`, textAlign: i === 0 ? 'left' : i === steps.length - 1 ? 'right' : 'center' }}>
              {s.title}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="w-full bg-gray-100 h-1">
          <div className="bg-blue-600 h-1 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{step.title}</h2>
            {step.description && <p className="text-sm text-gray-500 mt-1">{step.description}</p>}
          </div>

          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600 mt-0.5">{submitError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {step.fields.map(field => (
              <div key={field.name} className={field.colSpan === 2 || field.type === 'textarea' ? 'md:col-span-2' : ''}>
                {field.type !== 'checkbox' && (
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                )}
                {renderField(field)}
                {field.helpText && !errors[field.name] && (
                  <p className="mt-1 text-xs text-gray-400">{field.helpText}</p>
                )}
                {touched[field.name] && errors[field.name] && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors[field.name]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div>
            {!isFirstStep && (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                isLastStep
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              }`}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : isLastStep ? (
                <><Check className="w-4 h-4" /> {submitLabel}</>
              ) : (
                <>Next <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">Press Enter to continue to the next step</p>
      </div>
    </div>
  )
}

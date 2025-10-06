'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2, ListChecks } from 'lucide-react'
import toast from 'react-hot-toast'

export interface SurveyQuestion {
  id?: string
  question: string
  type: 'text' | 'number' | 'boolean' | 'single_choice' | 'multiple_choice' | 'rating'
  required: boolean
  options?: string[]
  min?: number
  max?: number
}

export interface Survey {
  id?: string
  title: string
  description?: string
  targetAudience: 'shop_owner' | 'consumer' | 'both'
  category: 'brand_awareness' | 'product_feedback' | 'customer_satisfaction' | 'market_research' | 'other'
  
  // Admin Assignment Settings
  assignedBrands: string[] // Can be assigned to specific brands
  assignedAgentTypes: string[] // Can be assigned to agent types (field_agent, supervisor, etc)
  isMandatory: boolean // Is this survey mandatory or optional
  
  brandName?: string
  questions: SurveyQuestion[]
  active: boolean
  startDate?: string
  endDate?: string
  createdAt?: string
}

interface SurveyFormProps {
  initialData?: Survey
  onSubmit: (data: Survey) => Promise<void>
  onCancel: () => void
  brands?: Array<{ id: string; name: string }>
  agentTypes?: Array<{ id: string; name: string }>
}

export function SurveyForm({ initialData, onSubmit, onCancel, brands = [], agentTypes = [] }: SurveyFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Survey>({
    title: '',
    targetAudience: 'shop_owner',
    category: 'brand_awareness',
    questions: [],
    assignedBrands: [],
    assignedAgentTypes: [],
    isMandatory: false,
    active: true,
    ...initialData
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title?.trim()) newErrors.title = 'Survey title is required'
    if (formData.questions.length === 0) newErrors.questions = 'At least one question is required'
    
    formData.questions.forEach((q, index) => {
      if (!q.question.trim()) {
        newErrors[`question_${index}`] = 'Question text is required'
      }
      if (['single_choice', 'multiple_choice'].includes(q.type) && (!q.options || q.options.length < 2)) {
        newErrors[`options_${index}`] = 'At least 2 options are required'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
      toast.success(initialData ? 'Survey updated successfully' : 'Survey created successfully')
      onCancel()
    } catch (error: any) {
      console.error('Error submitting survey:', error)
      toast.error(error.message || 'Failed to save survey')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Survey, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          type: 'text',
          required: false
        }
      ]
    }))
  }

  const updateQuestion = (index: number, field: keyof SurveyQuestion, value: any) => {
    const updated = [...formData.questions]
    updated[index] = { ...updated[index], [field]: value }
    setFormData(prev => ({ ...prev, questions: updated }))
    
    if (errors[`question_${index}`]) {
      setErrors(prev => ({ ...prev, [`question_${index}`]: '' }))
    }
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const addOption = (questionIndex: number) => {
    const updated = [...formData.questions]
    if (!updated[questionIndex].options) {
      updated[questionIndex].options = []
    }
    updated[questionIndex].options!.push('')
    setFormData(prev => ({ ...prev, questions: updated }))
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...formData.questions]
    updated[questionIndex].options![optionIndex] = value
    setFormData(prev => ({ ...prev, questions: updated }))
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...formData.questions]
    updated[questionIndex].options = updated[questionIndex].options!.filter((_, i) => i !== optionIndex)
    setFormData(prev => ({ ...prev, questions: updated }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Survey Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Survey Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Survey Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Brand Awareness Survey"
              error={errors.title}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the survey purpose..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <select
              value={formData.targetAudience}
              onChange={(e) => handleChange('targetAudience', e.target.value as Survey['targetAudience'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="shop_owner">Shop Owners</option>
              <option value="consumer">Consumers</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value as Survey['category'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="brand_awareness">Brand Awareness</option>
              <option value="product_feedback">Product Feedback</option>
              <option value="customer_satisfaction">Customer Satisfaction</option>
              <option value="market_research">Market Research</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Brands (Optional - leave empty for all brands)
            </label>
            <div className="border border-gray-300 rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
              {brands.length > 0 ? brands.map(brand => (
                <label key={brand.id} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.assignedBrands.includes(brand.id)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...formData.assignedBrands, brand.id]
                        : formData.assignedBrands.filter(id => id !== brand.id)
                      handleChange('assignedBrands', updated)
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{brand.name}</span>
                </label>
              )) : (
                <p className="text-sm text-gray-500">No brands available</p>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Agent Types (Optional - leave empty for all agents)
            </label>
            <div className="border border-gray-300 rounded-md p-3 space-y-2">
              {agentTypes.length > 0 ? agentTypes.map(type => (
                <label key={type.id} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.assignedAgentTypes.includes(type.id)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...formData.assignedAgentTypes, type.id]
                        : formData.assignedAgentTypes.filter(id => id !== type.id)
                      handleChange('assignedAgentTypes', updated)
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{type.name}</span>
                </label>
              )) : (
                <p className="text-sm text-gray-500">No agent types available</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <Input
              type="date"
              value={formData.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <Input
              type="date"
              value={formData.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isMandatory}
                onChange={(e) => handleChange('isMandatory', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Mandatory Survey</span>
            </label>
            <p className="text-xs text-gray-500 ml-6">If checked, agents must complete this survey</p>
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => handleChange('active', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Active Survey</span>
            </label>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ListChecks className="w-5 h-5 mr-2" />
            Questions <span className="text-red-500 ml-1">*</span>
          </h3>
          <Button type="button" onClick={addQuestion} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>

        {errors.questions && <p className="text-sm text-red-500">{errors.questions}</p>}

        <div className="space-y-4">
          {formData.questions.map((question, qIndex) => (
            <div key={qIndex} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-gray-700">Question {qIndex + 1}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeQuestion(qIndex)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>

              <div>
                <Input
                  value={question.question}
                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                  placeholder="Enter your question..."
                  error={errors[`question_${qIndex}`]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Question Type</label>
                  <select
                    value={question.type}
                    onChange={(e) => updateQuestion(qIndex, 'type', e.target.value as SurveyQuestion['type'])}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Yes/No</option>
                    <option value="single_choice">Single Choice</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="rating">Rating (1-5)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) => updateQuestion(qIndex, 'required', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-xs text-gray-700">Required</span>
                  </label>
                </div>
              </div>

              {/* Options for choice questions */}
              {['single_choice', 'multiple_choice'].includes(question.type) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-600">Options</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(qIndex)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  {errors[`options_${qIndex}`] && (
                    <p className="text-xs text-red-500">{errors[`options_${qIndex}`]}</p>
                  )}
                  <div className="space-y-2">
                    {(question.options || []).map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          className="text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(qIndex, oIndex)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Survey' : 'Create Survey'}
        </Button>
      </div>
    </form>
  )
}

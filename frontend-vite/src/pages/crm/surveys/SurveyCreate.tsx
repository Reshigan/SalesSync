import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { crmService } from '../../../services/crm.service'

export default function SurveyCreate() {
  const navigate = useNavigate()

  const fields = [
    {
      name: 'survey_code',
      label: 'Survey Code',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., SURV2025Q1'
    },
    {
      name: 'survey_name',
      label: 'Survey Name',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., Customer Satisfaction Survey'
    },
    {
      name: 'survey_type',
      label: 'Survey Type',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'customer_satisfaction', label: 'Customer Satisfaction' },
        { value: 'product_feedback', label: 'Product Feedback' },
        { value: 'market_research', label: 'Market Research' },
        { value: 'brand_awareness', label: 'Brand Awareness' },
        { value: 'nps', label: 'Net Promoter Score (NPS)' }
      ]
    },
    {
      name: 'start_date',
      label: 'Start Date',
      type: 'date' as const,
      required: true
    },
    {
      name: 'end_date',
      label: 'End Date',
      type: 'date' as const,
      required: true
    },
    {
      name: 'target_audience',
      label: 'Target Audience',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'all_customers', label: 'All Customers' },
        { value: 'retailers', label: 'Retailers Only' },
        { value: 'wholesalers', label: 'Wholesalers Only' },
        { value: 'distributors', label: 'Distributors Only' },
        { value: 'specific_segment', label: 'Specific Segment' }
      ]
    },
    {
      name: 'description',
      label: 'Survey Description',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Describe the survey purpose and objectives...'
    },
    {
      name: 'questions_json',
      label: 'Survey Questions (JSON)',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Enter survey questions in JSON format'
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Add survey notes...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await crmService.createSurvey(data)
      navigate('/crm/surveys')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create survey')
    }
  }

  return (
    <TransactionForm
      title="Create Survey"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/crm/surveys')}
      submitLabel="Create Survey"
    />
  )
}

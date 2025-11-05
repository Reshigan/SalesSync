import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { marketingService } from '../../../services/marketing.service'

export default function CampaignCreate() {
  const navigate = useNavigate()

  const fields = [
    {
      name: 'campaign_code',
      label: 'Campaign Code',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., CAMP2025Q1'
    },
    {
      name: 'campaign_name',
      label: 'Campaign Name',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., Summer Promotion 2025'
    },
    {
      name: 'campaign_type',
      label: 'Campaign Type',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'brand_awareness', label: 'Brand Awareness' },
        { value: 'product_launch', label: 'Product Launch' },
        { value: 'seasonal', label: 'Seasonal' },
        { value: 'promotional', label: 'Promotional' },
        { value: 'loyalty', label: 'Loyalty' }
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
      name: 'budget',
      label: 'Budget (R)',
      type: 'number' as const,
      required: true,
      validation: (value: number) => value <= 0 ? 'Budget must be greater than 0' : null
    },
    {
      name: 'target_audience',
      label: 'Target Audience',
      type: 'text' as const,
      placeholder: 'e.g., Retailers, Distributors'
    },
    {
      name: 'objectives',
      label: 'Campaign Objectives',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Describe the campaign objectives...'
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Add campaign notes...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await marketingService.createCampaign(data)
      navigate('/marketing/campaigns')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create campaign')
    }
  }

  return (
    <TransactionForm
      title="Create Marketing Campaign"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/marketing/campaigns')}
      submitLabel="Create Campaign"
    />
  )
}

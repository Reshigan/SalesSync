import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { marketingService } from '../../../services/marketing.service'

export default function EventCreate() {
  const navigate = useNavigate()

  const fields = [
    {
      name: 'event_code',
      label: 'Event Code',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., EVT2025001'
    },
    {
      name: 'event_name',
      label: 'Event Name',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., Product Launch Event'
    },
    {
      name: 'event_type',
      label: 'Event Type',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'product_launch', label: 'Product Launch' },
        { value: 'trade_show', label: 'Trade Show' },
        { value: 'conference', label: 'Conference' },
        { value: 'workshop', label: 'Workshop' },
        { value: 'roadshow', label: 'Roadshow' },
        { value: 'activation', label: 'Activation' }
      ]
    },
    {
      name: 'event_date',
      label: 'Event Date',
      type: 'date' as const,
      required: true
    },
    {
      name: 'location',
      label: 'Location',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., Convention Center, Johannesburg'
    },
    {
      name: 'budget',
      label: 'Budget (R)',
      type: 'number' as const,
      required: true,
      validation: (value: number) => value <= 0 ? 'Budget must be greater than 0' : null
    },
    {
      name: 'expected_attendees',
      label: 'Expected Attendees',
      type: 'number' as const,
      required: true
    },
    {
      name: 'description',
      label: 'Event Description',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Describe the event...'
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Add event notes...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await marketingService.createEvent(data)
      navigate('/marketing/events')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create event')
    }
  }

  return (
    <TransactionForm
      title="Create Marketing Event"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/marketing/events')}
      submitLabel="Create Event"
    />
  )
}

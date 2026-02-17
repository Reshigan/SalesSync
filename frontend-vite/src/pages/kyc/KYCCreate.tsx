import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { customersService } from '../../services/customers.service'

export default function KYCCreate() {
  const navigate = useNavigate()

  const steps: WizardStep[] = [
    {
      id: 'business',
      title: 'Business Information',
      description: 'Enter the business details',
      fields: [
        { name: 'business_name', label: 'Business Name', type: 'text', required: true, autoFocus: true },
        { name: 'registration_number', label: 'Registration Number', type: 'text', required: true },
        { name: 'tax_number', label: 'Tax Number', type: 'text', required: true },
        { name: 'address', label: 'Address', type: 'text', required: true, colSpan: 2 },
      ],
    },
    {
      id: 'owner',
      title: 'Owner Information',
      description: 'Enter the owner contact details',
      fields: [
        { name: 'owner_name', label: 'Owner Name', type: 'text', required: true },
        { name: 'owner_id', label: 'ID Number', type: 'text', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
      ],
    },
    {
      id: 'notes',
      title: 'Additional Notes',
      description: 'Add any notes for this KYC record',
      fields: [
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Enter any notes', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const result = await customersService.createCustomer({ ...data, status: 'pending' })
      toast.success('KYC created successfully')
      navigate(`/kyc/${result.id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create KYC')
    }
  }

  return (
    <FlowWizard
      title="Create KYC Record"
      subtitle="Verify a new business"
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/kyc')}
      submitLabel="Create KYC"
      icon={<Shield className="w-5 h-5" />}
    />
  )
}

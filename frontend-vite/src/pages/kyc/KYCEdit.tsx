import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Shield, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { customersService } from '../../services/customers.service'

export default function KYCEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: kyc, isLoading } = useQuery({
    queryKey: ['kyc', id],
    queryFn: () => customersService.getCustomer(id!),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  if (!kyc) {
    return <div className="p-6 text-center text-gray-500">KYC record not found</div>
  }

  const steps: WizardStep[] = [
    {
      id: 'business',
      title: 'Business Information',
      description: 'Update the business details',
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
      description: 'Update the owner contact details',
      fields: [
        { name: 'owner_name', label: 'Owner Name', type: 'text', required: true },
        { name: 'owner_id', label: 'ID Number', type: 'text', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
      ],
    },
    {
      id: 'verification',
      title: 'Verification',
      description: 'Update verification status',
      fields: [
        { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }] },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Enter verification notes', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await customersService.updateCustomer(id!, data)
      toast.success('KYC updated successfully')
      navigate(`/kyc/${id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update KYC')
    }
  }

  return (
    <FlowWizard
      title="Edit KYC"
      subtitle={kyc.business_name || `KYC #${id}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/kyc/${id}`)}
      submitLabel="Save Changes"
      initialData={kyc}
      icon={<Shield className="w-5 h-5" />}
    />
  )
}

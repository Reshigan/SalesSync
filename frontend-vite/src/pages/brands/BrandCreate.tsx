import { useNavigate } from 'react-router-dom'
import { Tag } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { brandService } from '../../services/brand.service'

export default function BrandCreate() {
  const navigate = useNavigate()

  const steps: WizardStep[] = [
    {
      id: 'details',
      title: 'Brand Details',
      description: 'Enter the brand name and code',
      fields: [
        { name: 'name', label: 'Brand Name', type: 'text', required: true, placeholder: 'e.g., Coca-Cola', autoFocus: true },
        { name: 'code', label: 'Brand Code', type: 'text', placeholder: 'e.g., CC' },
        { name: 'status', label: 'Status', type: 'select', defaultValue: 'active', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
      ],
    },
    {
      id: 'description',
      title: 'Description',
      description: 'Add a description for this brand',
      fields: [
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe this brand...', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const result = await brandService.createBrand(data)
      toast.success('Brand created successfully')
      navigate(`/brands/${result.id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create brand')
    }
  }

  return (
    <FlowWizard
      title="Create Brand"
      subtitle="Add a new brand to the system"
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/brands')}
      submitLabel="Create Brand"
      icon={<Tag className="w-5 h-5" />}
    />
  )
}

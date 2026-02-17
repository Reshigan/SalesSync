import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Tag, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { brandService } from '../../services/brand.service'

export default function BrandEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: brand, isLoading } = useQuery({
    queryKey: ['brand', id],
    queryFn: () => brandService.getBrand(id!),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  if (!brand) {
    return <div className="p-6 text-center text-gray-500">Brand not found</div>
  }

  const steps: WizardStep[] = [
    {
      id: 'details',
      title: 'Brand Details',
      description: 'Update the brand name and code',
      fields: [
        { name: 'name', label: 'Brand Name', type: 'text', required: true, autoFocus: true },
        { name: 'code', label: 'Brand Code', type: 'text' },
        { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
      ],
    },
    {
      id: 'description',
      title: 'Description',
      description: 'Update the brand description',
      fields: [
        { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await brandService.updateBrand(id!, data)
      toast.success('Brand updated successfully')
      navigate(`/brands/${id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update brand')
    }
  }

  return (
    <FlowWizard
      title="Edit Brand"
      subtitle={brand.name}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/brands/${id}`)}
      submitLabel="Save Changes"
      initialData={brand}
      icon={<Tag className="w-5 h-5" />}
    />
  )
}

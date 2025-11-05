import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { crmService } from '../../../services/crm.service'

export default function KYCCaseCreate() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [users, setUsers] = useState([])

  useEffect(() => {
    loadCustomers()
    loadUsers()
  }, [])

  const loadCustomers = async () => {
    try {
      const response = await crmService.getCustomers()
      setCustomers(response.data || [])
    } catch (error) {
      console.error('Failed to load customers:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await crmService.getUsers()
      setUsers(response.data || [])
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const fields = [
    {
      name: 'customer_id',
      label: 'Customer',
      type: 'select' as const,
      required: true,
      options: customers.map((c: any) => ({
        value: c.id.toString(),
        label: `${c.customer_code} - ${c.customer_name}`
      }))
    },
    {
      name: 'case_type',
      label: 'Case Type',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'new_customer', label: 'New Customer Verification' },
        { value: 'credit_review', label: 'Credit Review' },
        { value: 'document_update', label: 'Document Update' },
        { value: 'compliance_check', label: 'Compliance Check' },
        { value: 'risk_assessment', label: 'Risk Assessment' }
      ]
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
      ]
    },
    {
      name: 'assigned_to',
      label: 'Assign To',
      type: 'select' as const,
      required: true,
      options: users.map((u: any) => ({
        value: u.id.toString(),
        label: u.name
      }))
    },
    {
      name: 'description',
      label: 'Case Description',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Describe the KYC case details...'
    },
    {
      name: 'required_documents',
      label: 'Required Documents',
      type: 'textarea' as const,
      placeholder: 'List required documents (one per line)'
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Add case notes...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await crmService.createKYCCase(data)
      navigate('/crm/kyc-cases')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create KYC case')
    }
  }

  return (
    <TransactionForm
      title="Create KYC Case"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/crm/kyc-cases')}
      submitLabel="Create Case"
    />
  )
}

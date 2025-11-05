import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import TransactionDetail from '../../../components/transactions/TransactionDetail'
import { crmService } from '../../../services/crm.service'
import { formatDate } from '../../../utils/format'

export default function KYCCaseDetail() {
  const { id } = useParams()
  const [kycCase, setKYCCase] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadKYCCase()
  }, [id])

  const loadKYCCase = async () => {
    setLoading(true)
    try {
      const response = await crmService.getKYCCase(Number(id))
      setKYCCase(response.data)
    } catch (error) {
      console.error('Failed to load KYC case:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!kycCase) {
    return <div className="flex items-center justify-center h-64">KYC case not found</div>
  }

  const fields = [
    { label: 'Case Number', value: kycCase.case_number },
    { label: 'Customer', value: kycCase.customer_name },
    { label: 'Case Type', value: kycCase.case_type },
    { label: 'Priority', value: kycCase.priority },
    { label: 'Created Date', value: formatDate(kycCase.created_date) },
    { label: 'Assigned To', value: kycCase.assigned_to },
    { label: 'Status', value: kycCase.status.replace('_', ' ') },
    { label: 'Description', value: kycCase.description },
    { label: 'Required Documents', value: kycCase.required_documents },
    { label: 'Submitted Documents', value: kycCase.submitted_documents || '-' },
    { label: 'Approval Date', value: kycCase.approval_date ? formatDate(kycCase.approval_date) : '-' },
    { label: 'Approved By', value: kycCase.approved_by || '-' },
    { label: 'Rejection Reason', value: kycCase.rejection_reason || '-' },
    { label: 'Notes', value: kycCase.notes },
    { label: 'Created By', value: kycCase.created_by },
    { label: 'Created At', value: formatDate(kycCase.created_at) }
  ]

  const statusColor = {
    open: 'blue',
    in_progress: 'yellow',
    pending_docs: 'yellow',
    approved: 'green',
    rejected: 'red',
    closed: 'gray'
  }[kycCase.status] as 'green' | 'yellow' | 'red' | 'gray'

  return (
    <TransactionDetail
      title={`KYC Case ${kycCase.case_number}`}
      fields={fields}
      auditTrail={kycCase.audit_trail || []}
      backPath="/crm/kyc-cases"
      status={kycCase.status.replace('_', ' ')}
      statusColor={statusColor}
    />
  )
}

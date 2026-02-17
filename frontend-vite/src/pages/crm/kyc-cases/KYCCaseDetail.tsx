import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Shield, User, Calendar, FileText, CheckCircle, AlertTriangle } from 'lucide-react'
import { crmService } from '../../../services/crm.service'
import { formatDate } from '../../../utils/format'

export default function KYCCaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [kycCase, setKycCase] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [id])
  const load = async () => {
    setLoading(true)
    try { const r = await crmService.getKYCCase(Number(id)); setKycCase(r.data?.data || r.data) } catch (err: any) { setError(err.message || 'Failed to load') } finally { setLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div></div>
  if (!kycCase) return <div className="p-6"><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">KYC case not found</div></div>

  const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', in_review: 'bg-blue-100 text-blue-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', expired: 'bg-gray-100 text-gray-800' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/crm/kyc-cases')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <div><h1 className="text-xl sm:text-2xl font-bold text-gray-900">KYC Case {kycCase.case_number || `#${id}`}</h1>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[kycCase.status] || 'bg-gray-100 text-gray-800'}`}>{kycCase.status || 'N/A'}</span></div>
        </div>
        <button onClick={() => navigate(`/crm/kyc-cases/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Edit className="h-4 w-4" />Edit</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><Shield className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-gray-500">Risk Level</p><p className="text-xl font-bold">{kycCase.risk_level || 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-purple-500" /><div><p className="text-sm text-gray-500">Submitted</p><p className="text-xl font-bold">{formatDate(kycCase.submitted_date || kycCase.created_at) || 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3">{kycCase.status === 'approved' ? <CheckCircle className="h-8 w-8 text-green-500" /> : <AlertTriangle className="h-8 w-8 text-yellow-500" />}<div><p className="text-sm text-gray-500">Verification</p><p className="text-xl font-bold">{kycCase.verification_status || kycCase.status || 'N/A'}</p></div></div></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5" />Case Details</h2>
          <dl className="grid grid-cols-2 gap-4">
            {[['Case Number', kycCase.case_number], ['Case Type', kycCase.case_type || kycCase.kyc_type], ['Risk Level', kycCase.risk_level], ['Submitted Date', formatDate(kycCase.submitted_date)], ['Review Date', formatDate(kycCase.review_date)], ['Expiry Date', formatDate(kycCase.expiry_date)], ['Reviewer', kycCase.reviewer || kycCase.reviewed_by], ['Created At', formatDate(kycCase.created_at)]].map(([l, v]) => (
              <div key={l as string}><dt className="text-sm text-gray-500">{l}</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{v || '-'}</dd></div>
            ))}
          </dl>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><User className="h-5 w-5" />Customer</h2>
          <dl className="grid grid-cols-2 gap-4">
            {[['Customer', kycCase.customer_name], ['Customer Code', kycCase.customer_code], ['ID Number', kycCase.id_number], ['ID Type', kycCase.id_type], ['Date of Birth', formatDate(kycCase.date_of_birth)], ['Nationality', kycCase.nationality]].map(([l, v]) => (
              <div key={l as string}><dt className="text-sm text-gray-500">{l}</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{v || '-'}</dd></div>
            ))}
          </dl>
        </div>
      </div>
      {(kycCase.documents || []).length > 0 && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Documents</h2>
        <div className="space-y-2">{(kycCase.documents || []).map((doc: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="text-sm font-medium">{doc.document_type || doc.name}</span><span className="text-xs text-gray-500">{doc.status || 'uploaded'}</span></div>
        ))}</div>
      </div>}
      {kycCase.notes && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-lg font-semibold mb-2">Notes</h2><p className="text-gray-700">{kycCase.notes}</p></div>}
    </div>
  )
}

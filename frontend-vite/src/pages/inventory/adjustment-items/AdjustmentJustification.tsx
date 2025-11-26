import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, FileText, User, Clock } from 'lucide-react'

export default function AdjustmentJustification() {
  const { adjustmentId, itemId } = useParams<{ adjustmentId: string; itemId: string }>()
  const navigate = useNavigate()

  const { data: item, isLoading } = useQuery({
    queryKey: ['adjustment-item', adjustmentId, itemId],
    queryFn: async () => {
      return null
    }),
  })

  if (isLoading) {
    return <div className="p-6">Loading justification...</div>
  }

  if (!item) {
    return <div className="p-6">Adjustment item not found</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/inventory/adjustments/${adjustmentId}/items/${itemId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Item
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Adjustment Justification</h1>
        <p className="text-gray-600">{item.product_name} ({item.product_sku})</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Adjustment Summary</h2>
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Quantity Adjusted</dt>
            <dd className="mt-1 text-lg font-bold text-red-600">
              {item.quantity > 0 ? '+' : ''}{item.quantity}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Reason</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">
              {item.reason.replace('_', ' ')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Date</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(item.created_at).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Justification</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.justification}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Created By</h2>
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">{item.created_by}</p>
            <p className="text-sm text-gray-600">{item.created_by_role}</p>
            <p className="text-xs text-gray-500 mt-1">{item.created_by_email}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{new Date(item.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {item.approved_by && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-green-900 mb-4">Approval</h2>
          <div className="flex items-start gap-3 mb-4">
            <User className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">{item.approved_by}</p>
              <p className="text-sm text-green-700">{item.approved_by_role}</p>
              <p className="text-xs text-green-600 mt-1">{item.approved_by_email}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                <Clock className="h-3 w-3" />
                <span>{new Date(item.approved_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
          {item.approval_notes && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-sm font-medium text-green-900 mb-1">Approval Notes:</p>
              <p className="text-sm text-green-700">{item.approval_notes}</p>
            </div>
          )}
        </div>
      )}

      {item.supporting_documents && item.supporting_documents.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documents</h2>
          <div className="space-y-3">
            {item.supporting_documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <FileText className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    Uploaded {new Date(doc.uploaded_at).toLocaleString()}
                  </p>
                </div>
                <button className="text-primary-600 hover:text-primary-900 text-sm font-medium">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

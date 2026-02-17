import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, ClipboardList, Calendar, User, BarChart3, FileText } from 'lucide-react'
import { crmService } from '../../../services/crm.service'
import { formatDate } from '../../../utils/format'

export default function SurveyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { load() }, [id])
  const load = async () => { setLoading(true); try { const r = await crmService.getSurvey(Number(id)); setSurvey(r.data?.data || r.data) } catch (e: any) { setError(e.message || 'Failed to load') } finally { setLoading(false) } }
  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div></div>
  if (!survey) return <div className="p-6"><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">Survey not found</div></div>
  const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-800', draft: 'bg-gray-100 text-gray-800', closed: 'bg-red-100 text-red-800', completed: 'bg-green-100 text-green-800' }
  const questions = survey.questions || []
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4"><button onClick={() => navigate('/crm/surveys')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <div><h1 className="text-xl sm:text-2xl font-bold text-gray-900">{survey.survey_name || survey.title || `Survey #${id}`}</h1><span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[survey.status] || 'bg-gray-100 text-gray-800'}`}>{survey.status || 'N/A'}</span></div></div>
        <button onClick={() => navigate(`/surveys/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Edit className="h-4 w-4" />Edit</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><ClipboardList className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-gray-500">Questions</p><p className="text-xl font-bold">{questions.length}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><BarChart3 className="h-8 w-8 text-green-500" /><div><p className="text-sm text-gray-500">Responses</p><p className="text-xl font-bold">{survey.response_count || survey.total_responses || 0}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-purple-500" /><div><p className="text-sm text-gray-500">Created</p><p className="text-xl font-bold">{formatDate(survey.created_at) || 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><FileText className="h-8 w-8 text-orange-500" /><div><p className="text-sm text-gray-500">Type</p><p className="text-xl font-bold">{survey.survey_type || survey.type || 'N/A'}</p></div></div></div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Survey Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[['Survey Name', survey.survey_name || survey.title], ['Type', survey.survey_type || survey.type], ['Scope', survey.survey_scope || survey.scope], ['Brand', survey.brand_name], ['Start Date', formatDate(survey.start_date)], ['End Date', formatDate(survey.end_date)], ['Created By', survey.created_by], ['Created At', formatDate(survey.created_at)]].map(([l, v]) => (
            <div key={l as string}><dt className="text-sm text-gray-500">{l}</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{v || '-'}</dd></div>
          ))}
        </dl>
      </div>
      {questions.length > 0 && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Questions</h2>
        <div className="space-y-3">{questions.map((q: any, i: number) => (
          <div key={q.id || i} className="p-4 bg-gray-50 rounded-lg"><div className="flex items-start gap-3"><span className="flex-shrink-0 w-7 h-7 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">{i + 1}</span><div><p className="font-medium text-gray-900">{q.question_text || q.question}</p><p className="text-sm text-gray-500 mt-1">Type: {q.question_type || q.type || 'text'} {q.required ? '(Required)' : ''}</p></div></div></div>
        ))}</div>
      </div>}
      {survey.description && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-lg font-semibold mb-2">Description</h2><p className="text-gray-700">{survey.description}</p></div>}
    </div>
  )
}

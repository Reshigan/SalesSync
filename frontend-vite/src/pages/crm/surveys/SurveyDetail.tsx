import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import TransactionDetail from '../../../components/transactions/TransactionDetail'
import { crmService } from '../../../services/crm.service'
import { formatDate } from '../../../utils/format'

export default function SurveyDetail() {
  const { id } = useParams()
  const [survey, setSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSurvey()
  }, [id])

  const loadSurvey = async () => {
    setLoading(true)
    try {
      const response = await crmService.getSurvey(Number(id))
      setSurvey(response.data)
    } catch (error) {
      console.error('Failed to load survey:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!survey) {
    return <div className="flex items-center justify-center h-64">Survey not found</div>
  }

  const fields = [
    { label: 'Survey Code', value: survey.survey_code },
    { label: 'Survey Name', value: survey.survey_name },
    { label: 'Survey Type', value: survey.survey_type },
    { label: 'Start Date', value: formatDate(survey.start_date) },
    { label: 'End Date', value: formatDate(survey.end_date) },
    { label: 'Target Audience', value: survey.target_audience },
    { label: 'Description', value: survey.description },
    { label: 'Total Responses', value: survey.responses_count || 0 },
    { label: 'Completion Rate', value: survey.completion_rate ? `${survey.completion_rate}%` : '-' },
    { label: 'Average Score', value: survey.average_score || '-' },
    { label: 'Status', value: survey.status },
    { label: 'Notes', value: survey.notes },
    { label: 'Created By', value: survey.created_by },
    { label: 'Created At', value: formatDate(survey.created_at) }
  ]

  const statusColor = {
    draft: 'gray',
    active: 'green',
    closed: 'gray'
  }[survey.status] as 'green' | 'yellow' | 'red' | 'gray'

  return (
    <TransactionDetail
      title={`Survey ${survey.survey_code}`}
      fields={fields}
      auditTrail={survey.audit_trail || []}
      backPath="/crm/surveys"
      status={survey.status}
      statusColor={statusColor}
    />
  )
}

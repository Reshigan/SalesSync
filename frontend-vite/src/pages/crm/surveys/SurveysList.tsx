import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import TransactionList from '../../../components/transactions/TransactionList'
import { crmService } from '../../../services/crm.service'
import { formatDate } from '../../../utils/format'

export default function SurveysList() {
  const navigate = useNavigate()
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSurveys()
  }, [])

  const loadSurveys = async () => {
    setLoading(true)
    try {
      const response = await crmService.getSurveys()
      setSurveys(response.data || [])
    } catch (error) {
      console.error('Failed to load surveys:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'survey_code',
      label: 'Survey Code',
      sortable: true,
      render: (value: string, row: any) => (
        <button
          onClick={() => navigate(`/crm/surveys/${row.id}`)}
          className="text-primary-600 hover:text-primary-800 font-medium"
        >
          {value}
        </button>
      )
    },
    {
      key: 'survey_name',
      label: 'Survey Name',
      sortable: true
    },
    {
      key: 'survey_type',
      label: 'Type',
      sortable: true
    },
    {
      key: 'start_date',
      label: 'Start Date',
      sortable: true,
      render: (value: string) => formatDate(value)
    },
    {
      key: 'end_date',
      label: 'End Date',
      sortable: true,
      render: (value: string) => formatDate(value)
    },
    {
      key: 'responses_count',
      label: 'Responses',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => {
        const colors: Record<string, string> = {
          draft: 'bg-gray-100 text-gray-800',
          active: 'bg-green-100 text-green-800',
          closed: 'bg-gray-100 text-gray-800'
        }
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[value] || colors.draft}`}>
            {value}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <button
          onClick={() => navigate(`/crm/surveys/${row.id}`)}
          className="p-1 text-gray-600 hover:text-primary-600"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ]

  return (
    <TransactionList
      title="Surveys"
      columns={columns}
      data={surveys}
      loading={loading}
      onRefresh={loadSurveys}
      onExport={() => console.log('Export surveys')}
      createPath="/crm/surveys/create"
      createLabel="Create Survey"
    />
  )
}

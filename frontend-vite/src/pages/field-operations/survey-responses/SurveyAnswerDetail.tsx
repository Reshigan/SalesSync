import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, FileText, BarChart } from 'lucide-react'

export default function SurveyAnswerDetail() {
  const { surveyId, questionId } = useParams<{ surveyId: string; questionId: string }>()
  const navigate = useNavigate()

  const { data: question, isLoading } = useQuery({
    queryKey: ['survey-question-answers', surveyId, questionId],
    queryFn: async () => {
      return null
    }),
  })

  if (isLoading) {
    return <div className="p-6">Loading answer details...</div>
  }

  if (!question) {
    return <div className="p-6">Question not found</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/field-operations/surveys/${surveyId}/analysis`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Analysis
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Answer Detail</h1>
        <p className="text-gray-600">{question.question_text}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Total Responses</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{question.total_responses}</p>
        </div>

        {question.question_type === 'rating' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Average Rating</h3>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-gray-900">{question.average_rating.toFixed(1)}</p>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xl ${
                    i < Math.round(question.average_rating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}>
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Answer Distribution</h2>
        <div className="space-y-4">
          {question.answers.map((answer) => (
            <div key={answer.value} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{answer.label}</span>
                <span className="text-gray-600">{answer.count} ({answer.percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${answer.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Brain, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { aiService } from '../../services/ai.service'

interface AIModelStatusProps {
  module?: string
}

export default function AIModelStatus({ module = 'general' }: AIModelStatusProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [config, setConfig] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAIStatus()
  }, [])

  const checkAIStatus = async () => {
    try {
      setStatus('loading')
      const aiConfig = await aiService.getAIConfig()
      setConfig(aiConfig)
      setStatus('ready')
      setError(null)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'AI service unavailable')
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className="h-4 w-4 animate-spin text-blue-500" />
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return 'Loading AI model...'
      case 'ready':
        return 'AI analysis ready'
      case 'error':
        return 'AI service unavailable'
    }
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <Brain className="h-4 w-4 text-gray-400" />
      {getStatusIcon()}
      <span className={`${
        status === 'ready' ? 'text-green-700' : 
        status === 'error' ? 'text-red-700' : 
        'text-gray-700'
      }`}>
        {getStatusText()}
      </span>
      {config && status === 'ready' && (
        <span className="text-xs text-gray-500">
          ({config.model_path})
        </span>
      )}
      {error && (
        <span className="text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  )
}

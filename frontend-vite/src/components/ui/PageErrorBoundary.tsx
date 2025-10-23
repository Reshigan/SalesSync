import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Props {
  children: ReactNode
  pageName?: string
}

interface State {
  hasError: boolean
  error?: Error
}

class PageErrorBoundaryClass extends Component<Props & { navigate: (path: string) => void }, State> {
  constructor(props: Props & { navigate: (path: string) => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.pageName || 'Page'}:`, error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h2>
            
            <p className="text-gray-600 mb-6">
              {this.props.pageName ? `There was an error loading ${this.props.pageName}. ` : ''}
              Don't worry, your data is safe.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              
              <button
                onClick={() => this.props.navigate('/dashboard')}
                className="btn-outline flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded text-left text-sm">
                <div className="font-semibold text-red-800 mb-2">Development Error:</div>
                <div className="text-red-700 font-mono text-xs break-all">
                  {this.state.error.toString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function PageErrorBoundary(props: Props) {
  const navigate = useNavigate()
  return <PageErrorBoundaryClass {...props} navigate={navigate} />
}

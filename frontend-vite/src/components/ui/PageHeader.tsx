import { ChevronRight, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: Breadcrumb[]
  backTo?: string
  actions?: React.ReactNode
}

export default function PageHeader({ title, subtitle, breadcrumbs, backTo, actions }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-3" aria-label="Breadcrumb">
          <Link to="/dashboard" className="hover:text-gray-700 transition-colors">Home</Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              {crumb.href ? (
                <Link to={crumb.href} className="hover:text-gray-700 transition-colors">{crumb.label}</Link>
              ) : (
                <span className="text-gray-900 font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          {backTo && (
            <button
              onClick={() => navigate(backTo)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  )
}

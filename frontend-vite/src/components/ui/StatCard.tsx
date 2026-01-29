import React from 'react'
import { cn } from '../../utils/cn'
import { LucideIcon } from 'lucide-react'

type GradientVariant = 'blue' | 'purple' | 'green' | 'orange'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  variant?: GradientVariant
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

const gradientClasses: Record<GradientVariant, string> = {
  blue: 'bg-gradient-blue',
  purple: 'bg-gradient-purple',
  green: 'bg-gradient-green',
  orange: 'bg-gradient-orange',
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6 text-white shadow-stat relative overflow-hidden',
        gradientClasses[variant],
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subtitle && (
              <p className="text-sm text-white/70 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center mt-2">
                <span className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-green-200' : 'text-red-200'
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-white/60 ml-1">vs last month</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="p-3 bg-white/20 rounded-xl">
              <Icon className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface StatCardGridProps {
  children: React.ReactNode
  className?: string
}

export function StatCardGrid({ children, className }: StatCardGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {children}
    </div>
  )
}

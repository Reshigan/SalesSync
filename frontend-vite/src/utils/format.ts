import { formatCurrency as formatCurrencyUtil } from './currency'

// Re-export currency formatting
export const formatCurrency = formatCurrencyUtil

// Date formatting utilities
export const formatDate = (date: string | Date, options?: {
  format?: 'short' | 'medium' | 'long' | 'full'
  includeTime?: boolean
  locale?: string
}): string => {
  const { format = 'medium', includeTime = false, locale = 'en-GB' } = options || {}
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }
  
  const formatOptions: Intl.DateTimeFormatOptions = {}
  
  switch (format) {
    case 'short':
      formatOptions.dateStyle = 'short'
      break
    case 'medium':
      formatOptions.dateStyle = 'medium'
      break
    case 'long':
      formatOptions.dateStyle = 'long'
      break
    case 'full':
      formatOptions.dateStyle = 'full'
      break
  }
  
  if (includeTime) {
    formatOptions.timeStyle = 'short'
  }
  
  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj)
}

// Format date for display in tables
export const formatDateShort = (date: string | Date): string => {
  return formatDate(date, { format: 'short' })
}

// Format date with time
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, { format: 'medium', includeTime: true })
}

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`
  }
  
  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`
}

// Number formatting utilities
export const formatNumber = (num: number, options?: {
  decimals?: number
  compact?: boolean
  locale?: string
}): string => {
  const { decimals = 0, compact = false, locale = 'en-GB' } = options || {}
  
  if (compact) {
    if (Math.abs(num) >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (Math.abs(num) >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
}

// Percentage formatting
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`
}

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Phone number formatting (basic)
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Format based on length
  if (cleaned.length === 10) {
    // UK mobile: 07123 456789
    return cleaned.replace(/(\d{5})(\d{3})(\d{3})/, '$1 $2 $3')
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('44')) {
    // UK with country code: +44 7123 456789
    return `+${cleaned.replace(/(\d{2})(\d{4})(\d{3})(\d{3})/, '$1 $2 $3 $4')}`
  }
  
  // Return as-is if no pattern matches
  return phone
}

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

// Capitalize first letter
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// Format status for display
export const formatStatus = (status: string): string => {
  return status
    .split('_')
    .map(word => capitalize(word))
    .join(' ')
}
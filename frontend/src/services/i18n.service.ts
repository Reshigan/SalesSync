// Comprehensive Internationalization Service
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
  rtl: boolean
  enabled: boolean
}

export interface Translation {
  [key: string]: string | Translation
}

export interface Locale {
  language: string
  country: string
  currency: string
  dateFormat: string
  timeFormat: string
  numberFormat: {
    decimal: string
    thousands: string
    precision: number
  }
  timezone: string
}

interface I18nStore {
  currentLanguage: string
  currentLocale: Locale
  availableLanguages: Language[]
  translations: Record<string, Translation>
  isLoading: boolean
  fallbackLanguage: string
  
  // Actions
  setLanguage: (languageCode: string) => Promise<void>
  setLocale: (locale: Partial<Locale>) => void
  loadTranslations: (languageCode: string) => Promise<void>
  addTranslations: (languageCode: string, translations: Translation) => void
  
  // Translation functions
  t: (key: string, params?: Record<string, any>) => string
  formatDate: (date: Date | string, format?: string) => string
  formatTime: (date: Date | string, format?: string) => string
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string
  formatCurrency: (amount: number, currency?: string) => string
  
  // Pluralization
  plural: (key: string, count: number, params?: Record<string, any>) => string
  
  // Language detection
  detectLanguage: () => string
  getBrowserLanguages: () => string[]
}

// Supported languages
const supportedLanguages: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
    enabled: true
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    rtl: false,
    enabled: true
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    rtl: false,
    enabled: true
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    rtl: false,
    enabled: true
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    rtl: false,
    enabled: true
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    rtl: false,
    enabled: true
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    rtl: false,
    enabled: true
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    rtl: false,
    enabled: true
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    rtl: false,
    enabled: true
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    rtl: true,
    enabled: true
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    rtl: false,
    enabled: true
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    rtl: false,
    enabled: true
  }
]

// Default locale configurations
const defaultLocales: Record<string, Locale> = {
  en: {
    language: 'en',
    country: 'US',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      precision: 2
    },
    timezone: 'America/New_York'
  },
  es: {
    language: 'es',
    country: 'ES',
    currency: 'EUR',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: '.',
      precision: 2
    },
    timezone: 'Europe/Madrid'
  },
  fr: {
    language: 'fr',
    country: 'FR',
    currency: 'EUR',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: ' ',
      precision: 2
    },
    timezone: 'Europe/Paris'
  },
  de: {
    language: 'de',
    country: 'DE',
    currency: 'EUR',
    dateFormat: 'dd.MM.yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: '.',
      precision: 2
    },
    timezone: 'Europe/Berlin'
  }
}

// Base translations for English
const baseTranslations: Translation = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    reset: 'Reset',
    clear: 'Clear',
    select: 'Select',
    upload: 'Upload',
    download: 'Download',
    export: 'Export',
    import: 'Import',
    print: 'Print',
    share: 'Share',
    copy: 'Copy',
    paste: 'Paste',
    cut: 'Cut',
    undo: 'Undo',
    redo: 'Redo'
  },
  navigation: {
    dashboard: 'Dashboard',
    customers: 'Customers',
    visits: 'Visits',
    boards: 'Boards',
    products: 'Products',
    commissions: 'Commissions',
    reports: 'Reports',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    admin: 'Administration',
    help: 'Help'
  },
  auth: {
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    forgotPassword: 'Forgot Password',
    resetPassword: 'Reset Password',
    changePassword: 'Change Password',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    rememberMe: 'Remember Me',
    loginFailed: 'Login failed. Please check your credentials.',
    passwordTooWeak: 'Password is too weak',
    emailInvalid: 'Please enter a valid email address',
    passwordMismatch: 'Passwords do not match'
  },
  dashboard: {
    welcome: 'Welcome back, {{name}}!',
    totalCustomers: 'Total Customers',
    activeVisits: 'Active Visits',
    completedVisits: 'Completed Visits',
    totalCommissions: 'Total Commissions',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    performance: 'Performance',
    analytics: 'Analytics'
  },
  customers: {
    title: 'Customers',
    addCustomer: 'Add Customer',
    editCustomer: 'Edit Customer',
    customerDetails: 'Customer Details',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    state: 'State',
    zipCode: 'ZIP Code',
    customerType: 'Customer Type',
    status: 'Status',
    createdAt: 'Created At',
    lastVisit: 'Last Visit',
    totalVisits: 'Total Visits',
    searchCustomers: 'Search customers...',
    noCustomersFound: 'No customers found',
    customerCreated: 'Customer created successfully',
    customerUpdated: 'Customer updated successfully',
    customerDeleted: 'Customer deleted successfully'
  },
  visits: {
    title: 'Visits',
    scheduleVisit: 'Schedule Visit',
    visitDetails: 'Visit Details',
    customer: 'Customer',
    date: 'Date',
    time: 'Time',
    purpose: 'Purpose',
    notes: 'Notes',
    status: 'Status',
    checkIn: 'Check In',
    checkOut: 'Check Out',
    duration: 'Duration',
    location: 'Location',
    scheduled: 'Scheduled',
    inProgress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    visitScheduled: 'Visit scheduled successfully',
    visitUpdated: 'Visit updated successfully',
    visitCompleted: 'Visit completed successfully'
  },
  forms: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    minLength: 'Must be at least {{min}} characters',
    maxLength: 'Must be no more than {{max}} characters',
    invalidFormat: 'Invalid format',
    selectOption: 'Please select an option',
    uploadFile: 'Please upload a file',
    fileTooLarge: 'File size must be less than {{size}}MB',
    invalidFileType: 'Invalid file type. Allowed types: {{types}}'
  },
  errors: {
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    unauthorized: 'You are not authorized to perform this action.',
    forbidden: 'Access denied.',
    notFound: 'The requested resource was not found.',
    validationError: 'Please correct the errors and try again.',
    unknownError: 'An unknown error occurred.'
  },
  success: {
    saved: 'Changes saved successfully',
    deleted: 'Item deleted successfully',
    uploaded: 'File uploaded successfully',
    sent: 'Message sent successfully',
    updated: 'Updated successfully',
    created: 'Created successfully'
  },
  time: {
    now: 'now',
    minuteAgo: '1 minute ago',
    minutesAgo: '{{count}} minutes ago',
    hourAgo: '1 hour ago',
    hoursAgo: '{{count}} hours ago',
    dayAgo: '1 day ago',
    daysAgo: '{{count}} days ago',
    weekAgo: '1 week ago',
    weeksAgo: '{{count}} weeks ago',
    monthAgo: '1 month ago',
    monthsAgo: '{{count}} months ago',
    yearAgo: '1 year ago',
    yearsAgo: '{{count}} years ago'
  }
}

// Create i18n store
export const useI18nStore = create<I18nStore>()(
  persist(
    (set, get) => ({
      currentLanguage: 'en',
      currentLocale: defaultLocales.en,
      availableLanguages: supportedLanguages,
      translations: { en: baseTranslations },
      isLoading: false,
      fallbackLanguage: 'en',

      setLanguage: async (languageCode: string) => {
        const { availableLanguages, loadTranslations } = get()
        const language = availableLanguages.find(lang => lang.code === languageCode)
        
        if (!language || !language.enabled) {
          console.warn(`Language ${languageCode} is not available`)
          return
        }

        set({ currentLanguage: languageCode })
        
        // Update locale
        const locale = defaultLocales[languageCode] || defaultLocales.en
        set({ currentLocale: locale })
        
        // Load translations if not already loaded
        await loadTranslations(languageCode)
        
        // Update document language and direction
        if (typeof document !== 'undefined') {
          document.documentElement.lang = languageCode
          document.documentElement.dir = language.rtl ? 'rtl' : 'ltr'
        }
      },

      setLocale: (locale) => {
        set((state) => ({
          currentLocale: { ...state.currentLocale, ...locale }
        }))
      },

      loadTranslations: async (languageCode: string) => {
        const { translations } = get()
        
        if (translations[languageCode]) {
          return // Already loaded
        }

        set({ isLoading: true })
        
        try {
          // Try to load from API first
          const response = await fetch(`/api/translations/${languageCode}`)
          if (response.ok) {
            const translationData = await response.json()
            set((state) => ({
              translations: {
                ...state.translations,
                [languageCode]: translationData
              }
            }))
          } else {
            // Fallback to static files
            const module = await import(`../locales/${languageCode}.json`)
            set((state) => ({
              translations: {
                ...state.translations,
                [languageCode]: module.default
              }
            }))
          }
        } catch (error) {
          console.error(`Failed to load translations for ${languageCode}:`, error)
          // Use fallback language
          if (languageCode !== get().fallbackLanguage) {
            await get().loadTranslations(get().fallbackLanguage)
          }
        } finally {
          set({ isLoading: false })
        }
      },

      addTranslations: (languageCode, translations) => {
        set((state) => ({
          translations: {
            ...state.translations,
            [languageCode]: {
              ...state.translations[languageCode],
              ...translations
            }
          }
        }))
      },

      t: (key: string, params?: Record<string, any>) => {
        const { currentLanguage, translations, fallbackLanguage } = get()
        
        const getNestedValue = (obj: any, path: string): string | undefined => {
          return path.split('.').reduce((current, key) => current?.[key], obj)
        }
        
        let translation = getNestedValue(translations[currentLanguage], key)
        
        // Fallback to default language
        if (!translation && currentLanguage !== fallbackLanguage) {
          translation = getNestedValue(translations[fallbackLanguage], key)
        }
        
        // Fallback to key if no translation found
        if (!translation) {
          console.warn(`Translation missing for key: ${key}`)
          return key
        }
        
        // Replace parameters
        if (params) {
          Object.entries(params).forEach(([param, value]) => {
            translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), String(value))
          })
        }
        
        return translation
      },

      formatDate: (date: Date | string, format?: string) => {
        const { currentLocale } = get()
        const dateObj = typeof date === 'string' ? new Date(date) : date
        
        const formatStr = format || currentLocale.dateFormat
        
        try {
          return new Intl.DateTimeFormat(
            `${currentLocale.language}-${currentLocale.country}`,
            {
              year: formatStr.includes('yyyy') ? 'numeric' : undefined,
              month: formatStr.includes('MM') ? '2-digit' : formatStr.includes('M') ? 'numeric' : undefined,
              day: formatStr.includes('dd') ? '2-digit' : formatStr.includes('d') ? 'numeric' : undefined
            }
          ).format(dateObj)
        } catch (error) {
          return dateObj.toLocaleDateString()
        }
      },

      formatTime: (date: Date | string, format?: string) => {
        const { currentLocale } = get()
        const dateObj = typeof date === 'string' ? new Date(date) : date
        
        const formatStr = format || currentLocale.timeFormat
        const is24Hour = formatStr.includes('HH')
        
        try {
          return new Intl.DateTimeFormat(
            `${currentLocale.language}-${currentLocale.country}`,
            {
              hour: '2-digit',
              minute: '2-digit',
              hour12: !is24Hour
            }
          ).format(dateObj)
        } catch (error) {
          return dateObj.toLocaleTimeString()
        }
      },

      formatNumber: (number: number, options?: Intl.NumberFormatOptions) => {
        const { currentLocale } = get()
        
        try {
          return new Intl.NumberFormat(
            `${currentLocale.language}-${currentLocale.country}`,
            {
              minimumFractionDigits: currentLocale.numberFormat.precision,
              maximumFractionDigits: currentLocale.numberFormat.precision,
              ...options
            }
          ).format(number)
        } catch (error) {
          return number.toString()
        }
      },

      formatCurrency: (amount: number, currency?: string) => {
        const { currentLocale } = get()
        const currencyCode = currency || currentLocale.currency
        
        try {
          return new Intl.NumberFormat(
            `${currentLocale.language}-${currentLocale.country}`,
            {
              style: 'currency',
              currency: currencyCode
            }
          ).format(amount)
        } catch (error) {
          return `${currencyCode} ${amount.toFixed(2)}`
        }
      },

      plural: (key: string, count: number, params?: Record<string, any>) => {
        const { t } = get()
        
        // Simple pluralization rules
        const pluralKey = count === 1 ? `${key}.one` : `${key}.other`
        
        return t(pluralKey, { count, ...params })
      },

      detectLanguage: () => {
        if (typeof navigator !== 'undefined') {
          const browserLang = navigator.language.split('-')[0]
          const { availableLanguages } = get()
          
          return availableLanguages.find(lang => lang.code === browserLang)?.code || 'en'
        }
        return 'en'
      },

      getBrowserLanguages: () => {
        if (typeof navigator !== 'undefined') {
          return Array.from(new Set([
            navigator.language,
            ...(navigator.languages || [])
          ])).map(lang => lang.split('-')[0])
        }
        return ['en']
      }
    }),
    {
      name: 'i18n-store',
      partialize: (state) => ({
        currentLanguage: state.currentLanguage,
        currentLocale: state.currentLocale
      })
    }
  )
)

// I18n service class
class I18nService {
  private store = useI18nStore

  // Initialize i18n system
  async init() {
    const { detectLanguage, setLanguage } = this.store.getState()
    
    // Detect and set initial language
    const detectedLanguage = detectLanguage()
    await setLanguage(detectedLanguage)
  }

  // Get translation function
  get t() {
    return this.store.getState().t
  }

  // Get formatting functions
  get formatDate() {
    return this.store.getState().formatDate
  }

  get formatTime() {
    return this.store.getState().formatTime
  }

  get formatNumber() {
    return this.store.getState().formatNumber
  }

  get formatCurrency() {
    return this.store.getState().formatCurrency
  }

  // Language management
  async changeLanguage(languageCode: string) {
    await this.store.getState().setLanguage(languageCode)
  }

  getCurrentLanguage() {
    return this.store.getState().currentLanguage
  }

  getAvailableLanguages() {
    return this.store.getState().availableLanguages.filter(lang => lang.enabled)
  }

  // Translation management
  addTranslations(languageCode: string, translations: Translation) {
    this.store.getState().addTranslations(languageCode, translations)
  }

  // Locale management
  updateLocale(locale: Partial<Locale>) {
    this.store.getState().setLocale(locale)
  }

  getCurrentLocale() {
    return this.store.getState().currentLocale
  }

  // Utility functions
  isRTL(languageCode?: string) {
    const lang = languageCode || this.getCurrentLanguage()
    const language = this.store.getState().availableLanguages.find(l => l.code === lang)
    return language?.rtl || false
  }

  getLanguageName(languageCode: string, native = false) {
    const language = this.store.getState().availableLanguages.find(l => l.code === languageCode)
    return language ? (native ? language.nativeName : language.name) : languageCode
  }
}

const i18nService = new I18nService()
export default i18nService
export { I18nService }
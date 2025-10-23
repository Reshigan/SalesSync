import { useState } from 'react'
import { Settings, DollarSign, Bell, Lock, Mail, FileText, Globe, Zap, Save, AlertCircle, Upload, CheckCircle } from 'lucide-react'
import CurrencySettings from '../../components/settings/CurrencySettings'
import { Currency } from '../../utils/currency'

interface CompanySettings {
  companyName: string
  companyEmail: string
  companyPhone: string
  companyAddress: string
  city: string
  state: string
  country: string
  zipCode: string
  website: string
  logo?: string
  taxId: string
}

interface TaxSettings {
  defaultTaxRate: number
  taxName: string
  taxNumber: string
  enableTax: boolean
  inclusiveTax: boolean
  taxRates: Array<{ name: string; rate: number; default: boolean }>
}

interface EmailSettings {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  fromEmail: string
  fromName: string
  enableSsl: boolean
  replyTo: string
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  orderNotifications: boolean
  paymentNotifications: boolean
  lowStockNotifications: boolean
  agentNotifications: boolean
}

interface SecuritySettings {
  sessionTimeout: number
  twoFactorAuth: boolean
  passwordComplexity: boolean
  passwordExpiry: number
  maxLoginAttempts: number
  ipWhitelist: string[]
}

interface IntegrationSettings {
  googleMaps: { enabled: boolean; apiKey: string }
  stripe: { enabled: boolean; publicKey: string; secretKey: string }
  paypal: { enabled: boolean; clientId: string }
  twilioSms: { enabled: boolean; accountSid: string; authToken: string; phoneNumber: string }
  sendgrid: { enabled: boolean; apiKey: string }
}

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: 'Demo Company Ltd',
    companyEmail: 'info@demo.com',
    companyPhone: '+27 11 123 4567',
    companyAddress: '123 Business Avenue',
    city: 'Johannesburg',
    state: 'Gauteng',
    country: 'South Africa',
    zipCode: '2000',
    website: 'https://demo.com',
    taxId: 'VAT4012345678'
  })

  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    defaultTaxRate: 15,
    taxName: 'VAT',
    taxNumber: 'VAT4012345678',
    enableTax: true,
    inclusiveTax: false,
    taxRates: [
      { name: 'Standard VAT', rate: 15, default: true },
      { name: 'Zero Rated', rate: 0, default: false },
      { name: 'Exempt', rate: 0, default: false }
    ]
  })

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@demo.com',
    smtpPassword: '',
    fromEmail: 'noreply@demo.com',
    fromName: 'SalesSync System',
    enableSsl: true,
    replyTo: 'support@demo.com'
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    paymentNotifications: true,
    lowStockNotifications: true,
    agentNotifications: true
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    sessionTimeout: 30,
    twoFactorAuth: false,
    passwordComplexity: true,
    passwordExpiry: 90,
    maxLoginAttempts: 5,
    ipWhitelist: []
  })

  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
    googleMaps: { enabled: false, apiKey: '' },
    stripe: { enabled: false, publicKey: '', secretKey: '' },
    paypal: { enabled: false, clientId: '' },
    twilioSms: { enabled: false, accountSid: '', authToken: '', phoneNumber: '' },
    sendgrid: { enabled: false, apiKey: '' }
  })

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'company', name: 'Company Info', icon: Globe },
    { id: 'tax', name: 'Tax Settings', icon: FileText },
    { id: 'currency', name: 'Currency', icon: DollarSign },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'integrations', name: 'Integrations', icon: Zap }
  ]

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSaving(false)
    alert('Settings saved successfully!')
  }

  const handleTestEmail = async () => {
    setTestingEmail(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setTestingEmail(false)
    alert('Test email sent!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure system-wide settings and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {/* Alert Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900">Configuration Notice</h3>
          <p className="text-sm text-blue-700 mt-1">
            Changes to these settings will affect all users. Make sure to test thoroughly before saving.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application Name
                    </label>
                    <input
                      type="text"
                      defaultValue="SalesSync"
                      className="input w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Zone
                    </label>
                    <select className="input w-full">
                      <option value="UTC">UTC</option>
                      <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Format
                    </label>
                    <select className="input w-full">
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Format
                    </label>
                    <select className="input w-full">
                      <option value="12h">12 Hour (AM/PM)</option>
                      <option value="24h">24 Hour</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select className="input w-full">
                      <option value="en">English</option>
                      <option value="af">Afrikaans</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Records Per Page
                    </label>
                    <select className="input w-full">
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Company Info Tab */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Logo
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                        <span className="text-gray-400 text-sm">No Logo</span>
                      </div>
                      <button className="btn btn-secondary flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Logo
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={companySettings.companyName}
                      onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax ID / VAT Number *
                    </label>
                    <input
                      type="text"
                      value={companySettings.taxId}
                      onChange={(e) => setCompanySettings({ ...companySettings, taxId: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Email *
                    </label>
                    <input
                      type="email"
                      value={companySettings.companyEmail}
                      onChange={(e) => setCompanySettings({ ...companySettings, companyEmail: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={companySettings.companyPhone}
                      onChange={(e) => setCompanySettings({ ...companySettings, companyPhone: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={companySettings.website}
                      onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={companySettings.companyAddress}
                      onChange={(e) => setCompanySettings({ ...companySettings, companyAddress: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={companySettings.city}
                      onChange={(e) => setCompanySettings({ ...companySettings, city: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={companySettings.state}
                      onChange={(e) => setCompanySettings({ ...companySettings, state: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <select
                      value={companySettings.country}
                      onChange={(e) => setCompanySettings({ ...companySettings, country: e.target.value })}
                      className="input w-full"
                    >
                      <option value="South Africa">South Africa</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Ghana">Ghana</option>
                      <option value="Zimbabwe">Zimbabwe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zip / Postal Code
                    </label>
                    <input
                      type="text"
                      value={companySettings.zipCode}
                      onChange={(e) => setCompanySettings({ ...companySettings, zipCode: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tax Settings Tab */}
          {activeTab === 'tax' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Configuration</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Enable Tax Calculations</h4>
                      <p className="text-sm text-gray-500">Apply taxes to all transactions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={taxSettings.enableTax}
                        onChange={(e) => setTaxSettings({ ...taxSettings, enableTax: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Name
                      </label>
                      <input
                        type="text"
                        value={taxSettings.taxName}
                        onChange={(e) => setTaxSettings({ ...taxSettings, taxName: e.target.value })}
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        value={taxSettings.defaultTaxRate}
                        onChange={(e) => setTaxSettings({ ...taxSettings, defaultTaxRate: parseFloat(e.target.value) })}
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Registration Number
                      </label>
                      <input
                        type="text"
                        value={taxSettings.taxNumber}
                        onChange={(e) => setTaxSettings({ ...taxSettings, taxNumber: e.target.value })}
                        className="input w-full"
                      />
                    </div>

                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taxSettings.inclusiveTax}
                          onChange={(e) => setTaxSettings({ ...taxSettings, inclusiveTax: e.target.checked })}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Tax Inclusive Pricing</span>
                          <p className="text-sm text-gray-500">Prices include tax</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Tax Rates</h4>
                    <div className="space-y-2">
                      {taxSettings.taxRates.map((rate, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="radio"
                            name="defaultTax"
                            checked={rate.default}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{rate.name}</span>
                          </div>
                          <div className="text-sm font-semibold text-gray-900">{rate.rate}%</div>
                          <button className="text-red-600 hover:text-red-700 text-sm">Remove</button>
                        </div>
                      ))}
                      <button className="btn btn-secondary w-full">+ Add Tax Rate</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Currency Tab */}
          {activeTab === 'currency' && (
            <CurrencySettings onCurrencyChange={(currency: Currency) => console.log('Currency:', currency)} />
          )}

          {/* Email Settings Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Host *
                    </label>
                    <input
                      type="text"
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                      className="input w-full"
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Port *
                    </label>
                    <input
                      type="number"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })}
                      className="input w-full"
                      placeholder="587"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Username *
                    </label>
                    <input
                      type="text"
                      value={emailSettings.smtpUser}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Password *
                    </label>
                    <input
                      type="password"
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                      className="input w-full"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Email *
                    </label>
                    <input
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Name *
                    </label>
                    <input
                      type="text"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reply-To Email
                    </label>
                    <input
                      type="email"
                      value={emailSettings.replyTo}
                      onChange={(e) => setEmailSettings({ ...emailSettings, replyTo: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailSettings.enableSsl}
                        onChange={(e) => setEmailSettings({ ...emailSettings, enableSsl: e.target.checked })}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Enable SSL/TLS</span>
                        <p className="text-sm text-gray-500">Use secure connection</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-900">Test Your Configuration</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Send a test email to verify your SMTP settings are correct
                      </p>
                      <button
                        onClick={handleTestEmail}
                        disabled={testingEmail}
                        className="mt-3 btn btn-secondary text-sm"
                      >
                        {testingEmail ? 'Sending...' : 'Send Test Email'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                      <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
                      <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Notification Types</h4>
                    
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.orderNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, orderNotifications: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">New Orders</span>
                          <p className="text-sm text-gray-500">Get notified when new orders are placed</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.paymentNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, paymentNotifications: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">Payment Received</span>
                          <p className="text-sm text-gray-500">Get notified when payments are received</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.lowStockNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, lowStockNotifications: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">Low Stock Alerts</span>
                          <p className="text-sm text-gray-500">Get notified when products are low in stock</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.agentNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, agentNotifications: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">Agent Activities</span>
                          <p className="text-sm text-gray-500">Get notified about field agent activities</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                      min="5"
                      max="480"
                      className="input w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-logout after inactivity</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Login Attempts
                    </label>
                    <input
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                      min="3"
                      max="10"
                      className="input w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lock account after failed attempts</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Expiry (days)
                    </label>
                    <input
                      type="number"
                      value={securitySettings.passwordExpiry}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, passwordExpiry: parseInt(e.target.value) })}
                      min="0"
                      max="365"
                      className="input w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Set to 0 to disable</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-500">Require 2FA for all users</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.twoFactorAuth}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorAuth: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Password Complexity</h4>
                      <p className="text-sm text-gray-500">Enforce strong password requirements</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.passwordComplexity}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, passwordComplexity: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {securitySettings.passwordComplexity && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Password Requirements</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Minimum 8 characters
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        At least one uppercase letter
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        At least one lowercase letter
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        At least one number
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        At least one special character
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Third-Party Integrations</h3>
                
                <div className="space-y-6">
                  {/* Google Maps */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <Globe className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Google Maps</h4>
                          <p className="text-sm text-gray-500">Route planning and location services</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={integrationSettings.googleMaps.enabled}
                          onChange={(e) => setIntegrationSettings({
                            ...integrationSettings,
                            googleMaps: { ...integrationSettings.googleMaps, enabled: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {integrationSettings.googleMaps.enabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          API Key
                        </label>
                        <input
                          type="text"
                          value={integrationSettings.googleMaps.apiKey}
                          onChange={(e) => setIntegrationSettings({
                            ...integrationSettings,
                            googleMaps: { ...integrationSettings.googleMaps, apiKey: e.target.value }
                          })}
                          className="input w-full"
                          placeholder="Enter your Google Maps API key"
                        />
                      </div>
                    )}
                  </div>

                  {/* Stripe */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Stripe</h4>
                          <p className="text-sm text-gray-500">Online payment processing</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={integrationSettings.stripe.enabled}
                          onChange={(e) => setIntegrationSettings({
                            ...integrationSettings,
                            stripe: { ...integrationSettings.stripe, enabled: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {integrationSettings.stripe.enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Publishable Key
                          </label>
                          <input
                            type="text"
                            value={integrationSettings.stripe.publicKey}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              stripe: { ...integrationSettings.stripe, publicKey: e.target.value }
                            })}
                            className="input w-full"
                            placeholder="pk_test_..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Secret Key
                          </label>
                          <input
                            type="password"
                            value={integrationSettings.stripe.secretKey}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              stripe: { ...integrationSettings.stripe, secretKey: e.target.value }
                            })}
                            className="input w-full"
                            placeholder="sk_test_..."
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Twilio SMS */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Bell className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Twilio SMS</h4>
                          <p className="text-sm text-gray-500">SMS notifications and alerts</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={integrationSettings.twilioSms.enabled}
                          onChange={(e) => setIntegrationSettings({
                            ...integrationSettings,
                            twilioSms: { ...integrationSettings.twilioSms, enabled: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {integrationSettings.twilioSms.enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account SID
                          </label>
                          <input
                            type="text"
                            value={integrationSettings.twilioSms.accountSid}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              twilioSms: { ...integrationSettings.twilioSms, accountSid: e.target.value }
                            })}
                            className="input w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Auth Token
                          </label>
                          <input
                            type="password"
                            value={integrationSettings.twilioSms.authToken}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              twilioSms: { ...integrationSettings.twilioSms, authToken: e.target.value }
                            })}
                            className="input w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={integrationSettings.twilioSms.phoneNumber}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              twilioSms: { ...integrationSettings.twilioSms, phoneNumber: e.target.value }
                            })}
                            className="input w-full"
                            placeholder="+1234567890"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SendGrid */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">SendGrid</h4>
                          <p className="text-sm text-gray-500">Transactional email service</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={integrationSettings.sendgrid.enabled}
                          onChange={(e) => setIntegrationSettings({
                            ...integrationSettings,
                            sendgrid: { ...integrationSettings.sendgrid, enabled: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {integrationSettings.sendgrid.enabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={integrationSettings.sendgrid.apiKey}
                          onChange={(e) => setIntegrationSettings({
                            ...integrationSettings,
                            sendgrid: { ...integrationSettings.sendgrid, apiKey: e.target.value }
                          })}
                          className="input w-full"
                          placeholder="SG...."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Save Button */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            * Changes will take effect immediately after saving
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Changes...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

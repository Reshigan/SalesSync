'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Save, Bell } from 'lucide-react'

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      setTimeout(() => {
        setSettings({
          setting1: 'value1',
          setting2: true,
          setting3: 'option1'
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching settings:', error)
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      // TODO: Replace with actual API call
      console.log('Saving settings:', settings)
      setTimeout(() => {
        setSaving(false)
      }, 1000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
            <p className="text-gray-600">Notification configuration</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Settings Form */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Setting 1
            </label>
            <input
              type="text"
              value={settings.setting1 || ''}
              onChange={(e) => setSettings({ ...settings, setting1: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="setting2"
              checked={settings.setting2 || false}
              onChange={(e) => setSettings({ ...settings, setting2: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="setting2" className="ml-2 block text-sm text-gray-700">
              Enable Setting 2
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Setting 3
            </label>
            <select
              value={settings.setting3 || ''}
              onChange={(e) => setSettings({ ...settings, setting3: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  )
}
'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Database, Server, Activity, HardDrive, Cpu, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { getCurrencyOptions } from '@/utils/currencySettings';

export default function SystemPage() {
  const { success, error } = useToast();
  const {
    currencySettings,
    loading: currencyLoading,
    error: currencyError,
    updateCurrencySettings
  } = useCurrency();

  const [localCurrency, setLocalCurrency] = useState(currencySettings.currency);
  const [localCurrencySymbol, setLocalCurrencySymbol] = useState(currencySettings.currencySymbol);
  const [isLoading, setIsLoading] = useState(false);

  const currencyOptions = getCurrencyOptions();

  // Update local state when currency settings change
  useEffect(() => {
    setLocalCurrency(currencySettings.currency);
    setLocalCurrencySymbol(currencySettings.currencySymbol);
  }, [currencySettings]);

  const handleCurrencyChange = (currencyCode: string) => {
    const selectedCurrency = currencyOptions.find(c => c.code === currencyCode);
    if (selectedCurrency) {
      setLocalCurrency(currencyCode);
      setLocalCurrencySymbol(selectedCurrency.symbol);
    }
  };

  const saveCurrencySettings = async () => {
    setIsLoading(true);
    try {
      const success_result = await updateCurrencySettings(localCurrency, localCurrencySymbol);
      if (success_result) {
        success('Currency settings saved successfully');
      } else {
        error('Failed to save currency settings');
      }
    } catch (err) {
      error('Failed to save currency settings');
    } finally {
      setIsLoading(false);
    }
  };
  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Monitor and configure system-wide settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">CPU Usage</p>
                <p className="text-2xl font-bold">45%</p>
              </div>
              <Cpu className="h-8 w-8 text-blue-600" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Memory Usage</p>
                <p className="text-2xl font-bold">62%</p>
              </div>
              <HardDrive className="h-8 w-8 text-green-600" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '62%' }}></div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Database Size</p>
                <p className="text-2xl font-bold">2.4 GB</p>
              </div>
              <Database className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">of 100 GB limit</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Server className="h-5 w-5 mr-2" />
              System Health
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">API Server</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Healthy</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Database</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Healthy</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cache Server</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Healthy</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Queue Service</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Degraded</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <Clock className="h-4 w-4 mr-2 mt-1 text-gray-400" />
                <div>
                  <p className="text-sm">System backup completed</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="h-4 w-4 mr-2 mt-1 text-gray-400" />
                <div>
                  <p className="text-sm">Database optimized</p>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 mr-2 mt-1 text-yellow-500" />
                <div>
                  <p className="text-sm">High memory usage detected</p>
                  <p className="text-xs text-gray-500">6 hours ago</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">System Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                defaultValue="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Upload Size (MB)
              </label>
              <input
                type="number"
                defaultValue="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Frequency
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Log Retention (days)
              </label>
              <input
                type="number"
                defaultValue="90"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="mt-6">
            <Button>Save Configuration</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Currency Settings
          </h3>
          <p className="text-gray-600 mb-6">Configure the default currency for the system</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency
              </label>
              <select 
                value={localCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {currencyOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.code} - {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency Symbol
              </label>
              <input
                type="text"
                value={localCurrencySymbol}
                onChange={(e) => setLocalCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="$"
              />
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Preview:</strong> Prices will be displayed as: {localCurrencySymbol}99.99
            </p>
          </div>
          
          <div className="mt-6">
            <Button 
              onClick={saveCurrencySettings}
              disabled={isLoading || currencyLoading}
              className="flex items-center"
            >
              {(isLoading || currencyLoading) && <LoadingSpinner className="mr-2" />}
              Save Currency Settings
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>);
}

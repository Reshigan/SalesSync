'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Package,
  MapPin,
  Calendar,
  Sparkles
} from 'lucide-react';

// Enhanced Dashboard with Tier 1 Features Toggle
function DashboardContent() {
  const [enhancedMode, setEnhancedMode] = useState(false);

  // Mock data for enhanced features
  const enhancedStats = {
    totalSales: 125000,
    salesChange: 12.5,
    activeCustomers: 1250,
    customerChange: 8.3,
    totalOrders: 450,
    orderChange: 15.2,
    inventoryValue: 85000,
    inventoryChange: -2.1,
    fieldMarketing: {
      activeCampaigns: 8,
      scheduledEvents: 15,
      visitsCompleted: 42,
      visitChange: 18.7,
      performanceScore: 87
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  if (enhancedMode) {
    return (
      <div className="p-6 space-y-6">
        {/* Header with Enhanced Mode Toggle */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enhanced Dashboard</h1>
            <p className="text-gray-600 mt-1">Tier 1 Analytics & Real-time Insights</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <Sparkles className="w-4 h-4 mr-1" />
              Tier 1 Active
            </span>
            <button 
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => setEnhancedMode(false)}
            >
              Switch to Basic
            </button>
          </div>
        </div>

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow border-l-4 border-l-blue-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(enhancedStats.totalSales)}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{enhancedStats.salesChange}% from last month
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border-l-4 border-l-green-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(enhancedStats.activeCustomers)}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{enhancedStats.customerChange}% from last month
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border-l-4 border-l-purple-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(enhancedStats.totalOrders)}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{enhancedStats.orderChange}% from last month
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border-l-4 border-l-orange-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(enhancedStats.inventoryValue)}</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                  {enhancedStats.inventoryChange}% from last month
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Field Marketing Enhanced KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-blue-700">{enhancedStats.fieldMarketing.activeCampaigns}</p>
                <p className="text-xs text-blue-600 mt-1">Marketing campaigns running</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Scheduled Events</p>
                <p className="text-2xl font-bold text-green-700">{enhancedStats.fieldMarketing.scheduledEvents}</p>
                <p className="text-xs text-green-600 mt-1">Events this month</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Visits Completed</p>
                <p className="text-2xl font-bold text-purple-700">{enhancedStats.fieldMarketing.visitsCompleted}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{enhancedStats.fieldMarketing.visitChange}% this week
                </p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Performance Score</p>
                <p className="text-2xl font-bold text-orange-700">{enhancedStats.fieldMarketing.performanceScore}%</p>
                <p className="text-xs text-orange-600 mt-1">Overall team performance</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Enhanced Features Notice */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-indigo-700">
              <Sparkles className="w-5 h-5" />
              Tier 1 Enhanced Features Active
            </h3>
            <p className="text-indigo-600 mt-1">
              You're now using the enhanced Tier 1 dashboard with advanced analytics, real-time data, and field marketing insights.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Real-time Analytics
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Field Marketing Insights
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Advanced KPI Tracking
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              GPS Integration Ready
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Material-UI Components
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Enhanced Charting
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Original Basic Dashboard
  return (
    <div className="p-6 space-y-6">
      {/* Header with Enhanced Mode Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to your SalesSync dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border">
            Basic Mode
          </span>
          <button 
            onClick={() => setEnhancedMode(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md text-sm font-medium"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Enable Tier 1
          </button>
        </div>
      </div>

      {/* Basic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">₦125,000</p>
              <p className="text-xs text-gray-500 mt-1">+12.5% from last month</p>
            </div>
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">1,250</p>
              <p className="text-xs text-gray-500 mt-1">+8.3% from last month</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">450</p>
              <p className="text-xs text-gray-500 mt-1">+15.2% from last month</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">₦85,000</p>
              <p className="text-xs text-gray-500 mt-1">-2.1% from last month</p>
            </div>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Upgrade Notice */}
      <div className="border-dashed border-2 border-blue-200 bg-blue-50 rounded-lg p-6">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-700">
            <Sparkles className="w-5 h-5" />
            Upgrade to Tier 1 Enhanced Dashboard
          </h3>
          <p className="text-blue-600 mt-1">
            Unlock advanced analytics, real-time insights, field marketing tools, and enhanced visualizations.
          </p>
        </div>
        <button 
          onClick={() => setEnhancedMode(true)}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md text-sm font-medium"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Activate Tier 1 Features
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

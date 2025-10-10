'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { MapPin, Navigation, Clock, User, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'offline';
  location: string;
  lat: number;
  lng: number;
  lastUpdate: string;
  currentActivity?: string;
  todayVisits: number;
  todaySales: number;
}

export default function TrackingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [agents, setAgents] = useState<Agent[]>([
    { id: '1', name: 'John Doe', role: 'Van Sales', status: 'active', location: 'Zone A - Downtown', lat: 40.7128, lng: -74.0060, lastUpdate: '2 mins ago', currentActivity: 'At customer ABC Store', todayVisits: 12, todaySales: 4250 },
    { id: '2', name: 'Sarah Wilson', role: 'Promoter', status: 'active', location: 'Zone B - Uptown', lat: 40.7589, lng: -73.9851, lastUpdate: '5 mins ago', currentActivity: 'Campaign activity', todayVisits: 8, todaySales: 0 },
    { id: '3', name: 'Mike Johnson', role: 'Merchandiser', status: 'idle', location: 'Zone C - Midtown', lat: 40.7549, lng: -73.9840, lastUpdate: '12 mins ago', currentActivity: 'Break', todayVisits: 6, todaySales: 0 },
  ]);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        lat: agent.lat + (Math.random() - 0.5) * 0.01,
        lng: agent.lng + (Math.random() - 0.5) * 0.01,
        lastUpdate: 'Just now'
      })));
    }, 5000);

    return (<ErrorBoundary>

</ErrorBoundary>) => clearInterval(interval);
  }, [autoRefresh]);

  const onlineAgents = agents.filter(a => a.status !== 'offline').length;
  const activeVisits = agents.filter(a => a.status === 'active' && a.currentActivity).length;
  const avgVisitTime = 18;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Real-Time Tracking</h1>
            <p className="text-gray-600 mt-1">Monitor field agent locations and activities</p>
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-refresh</span>
            {autoRefresh && (
              <span className="ml-2 h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
            )}
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Agents Online</p>
                <p className="text-2xl font-bold">{onlineAgents}</p>
                <p className="text-xs text-green-600 mt-1">● Live tracking</p>
              </div>
              <Navigation className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Visits</p>
                <p className="text-2xl font-bold">{activeVisits}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Visit Time</p>
                <p className="text-2xl font-bold">{avgVisitTime}m</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Visits</p>
                <p className="text-2xl font-bold">{agents.reduce((sum, a) => sum + a.todayVisits, 0)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6 h-[500px] flex items-center justify-center bg-gray-50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50"></div>
              <div className="relative z-10 text-center">
                <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-bounce" />
                <p className="text-gray-900 text-lg font-semibold">Real-Time Map View</p>
                <p className="text-gray-600 text-sm mt-2">Live tracking of {onlineAgents} field agents</p>
                <div className="mt-6 flex gap-4 justify-center">
                  {agents.filter(a => a.status !== 'offline').map((agent, idx) => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedAgent?.id === agent.id
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          agent.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                        } animate-pulse`}></div>
                        <span className="text-sm font-medium">{agent.name}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{agent.location}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulated map markers */}
              {agents.filter(a => a.status !== 'offline').map((agent, idx) => (
                <div
                  key={agent.id}
                  className="absolute"
                  style={{
                    left: `${30 + idx * 25}%`,
                    top: `${40 + idx * 10}%`,
                    animation: 'pulse 2s infinite'
                  }}
                >
                  <MapPin
                    className={`h-8 w-8 ${
                      agent.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                    } drop-shadow-lg cursor-pointer hover:scale-110 transition-transform`}
                    onClick={() => setSelectedAgent(agent)}
                  />
                </div>
              ))}
            </Card>
          </div>

          <div>
            <Card>
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Agent Details</h3>
              </div>
              {selectedAgent ? (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-10 w-10 text-gray-400" />
                    <div>
                      <p className="font-semibold">{selectedAgent.name}</p>
                      <p className="text-sm text-gray-600">{selectedAgent.role}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedAgent.status === 'active' ? 'bg-green-100 text-green-800' :
                        selectedAgent.status === 'idle' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedAgent.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Location</span>
                      <span className="text-sm font-medium">{selectedAgent.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Update</span>
                      <span className="text-sm">{selectedAgent.lastUpdate}</span>
                    </div>
                    {selectedAgent.currentActivity && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Activity</span>
                        <span className="text-sm font-medium">{selectedAgent.currentActivity}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Today's Visits</span>
                      <span className="text-sm font-medium">{selectedAgent.todayVisits}</span>
                    </div>
                    {selectedAgent.todaySales > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Today's Sales</span>
                        <span className="text-sm font-medium text-green-600">
                          ${selectedAgent.todaySales.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                    <Phone className="h-4 w-4" />
                    Call Agent
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">Select an agent to view details</p>
                </div>
              )}
            </Card>

            <Card className="mt-6">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                  Alerts
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900">Idle Warning</p>
                  <p className="text-xs text-yellow-700 mt-1">Mike Johnson idle for 12 mins</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900">High Performance</p>
                  <p className="text-xs text-green-700 mt-1">John Doe: 12 visits completed</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

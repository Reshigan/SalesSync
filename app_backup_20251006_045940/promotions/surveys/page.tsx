'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { ClipboardList, Plus, Camera, MapPin, CheckCircle, Clock } from 'lucide-react';

interface Survey {
  id: string;
  title: string;
  campaign: string;
  responses: number;
  target: number;
  hasPhotos: boolean;
  hasGeoValidation: boolean;
  status: 'active' | 'completed' | 'draft';
  createdAt: string;
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([
    { id: '1', title: 'Product Feedback Q3', campaign: 'Summer Launch', responses: 245, target: 300, hasPhotos: true, hasGeoValidation: true, status: 'active', createdAt: '2024-09-01' },
    { id: '2', title: 'Brand Awareness', campaign: 'Market Expansion', responses: 189, target: 200, hasPhotos: true, hasGeoValidation: true, status: 'active', createdAt: '2024-09-10' },
    { id: '3', title: 'Customer Satisfaction', campaign: 'Loyalty Program', responses: 450, target: 450, hasPhotos: false, hasGeoValidation: true, status: 'completed', createdAt: '2024-08-15' },
  ]);
  
  const [showModal, setShowModal] = useState(false);

  const columns = [
    { accessor: 'title', header: 'Survey Title', sortable: true },
    { accessor: 'campaign', header: 'Campaign' },
    {
      accessor: 'responses',
      header: 'Progress',
      cell: ({ row }: { row: Survey }) => (
        <div className="flex items-center gap-2">
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${(row.responses / row.target) * 100}%` }}
            ></div>
          </div>
          <span className="text-sm">{row.responses}/{row.target}</span>
        </div>
      )
    },
    {
      accessor: 'features',
      header: 'Features',
      cell: ({ row }: { row: Survey }) => (
        <div className="flex gap-2">
          {row.hasPhotos && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs flex items-center gap-1">
              <Camera className="h-3 w-3" /> Photos
            </span>
          )}
          {row.hasGeoValidation && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Geo
            </span>
          )}
        </div>
      )
    },
    {
      accessor: 'status',
      header: 'Status',
      cell: ({ row }: { row: Survey }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.status === 'active' ? 'bg-green-100 text-green-800' :
          row.status === 'completed' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      )
    },
    { accessor: 'createdAt', header: 'Created', sortable: true },
  ];

  const totalResponses = surveys.reduce((sum, s) => sum + s.responses, 0);
  const avgCompletion = surveys.reduce((sum, s) => sum + (s.responses / s.target * 100), 0) / surveys.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Surveys</h1>
            <p className="text-gray-600">Customer surveys with photo and geolocation validation</p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Survey
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Surveys</p>
                <p className="text-2xl font-bold">{surveys.length}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold">{totalResponses}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Completion</p>
                <p className="text-2xl font-bold">{avgCompletion.toFixed(0)}%</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Photos</p>
                <p className="text-2xl font-bold">{surveys.filter(s => s.hasPhotos).length}</p>
              </div>
              <Camera className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        <Card>
          <DataTable
            data={surveys}
            columns={columns}
          />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Camera className="h-5 w-5 mr-2 text-purple-600" />
              Photo Verification Features
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Mandatory Photo Capture</p>
                  <p>Require photos for specific survey questions</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">AI Image Analysis</p>
                  <p>Automated verification of product presence and placement</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Timestamp & Watermark</p>
                  <p>Automatic date/time stamping of all photos</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-600" />
              Geolocation Validation
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">GPS Validation</p>
                  <p>Verify surveys are completed at designated locations</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Geofencing</p>
                  <p>Set location boundaries for survey completion</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Route Tracking</p>
                  <p>Monitor field agent movement and coverage</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Survey"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
          <div>
            <label className="block text-sm font-medium mb-2">Survey Title</label>
            <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Campaign</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option>Summer Launch</option>
              <option>Market Expansion</option>
              <option>Loyalty Program</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Target Responses</label>
            <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md" defaultValue="100" required />
          </div>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <Camera className="h-4 w-4 mr-1" />
              Require Photo Capture
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <MapPin className="h-4 w-4 mr-1" />
              Enable Geolocation Validation
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Survey
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Grid3x3, Camera, Brain, CheckCircle, AlertTriangle, Upload } from 'lucide-react';

export default function ShelfPage() {
  const [showUpload, setShowUpload] = useState(false);
  
  const audits = [
    { store: 'Store A', compliance: 92, facings: 45, shelfShare: 38, date: '2024-09-28', status: 'good' },
    { store: 'Store B', compliance: 78, facings: 32, shelfShare: 28, date: '2024-09-28', status: 'fair' },
    { store: 'Store C', compliance: 65, facings: 28, shelfShare: 22, date: '2024-09-27', status: 'poor' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Shelf Analysis</h1>
            <p className="text-gray-600">AI-powered shelf audit and compliance tracking</p>
          </div>
          <Button onClick={() => setShowUpload(true)}>
            <Camera className="h-4 w-4 mr-2" />
            Upload Shelf Photo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Shelf Share</p>
                <p className="text-2xl font-bold">42%</p>
              </div>
              <Grid3x3 className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold">85%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Facings</p>
                <p className="text-2xl font-bold">1,248</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Photos Analyzed</p>
                <p className="text-2xl font-bold">342</p>
              </div>
              <Camera className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              AI Image Analysis Features
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Automated Product Recognition</p>
                  <p className="text-sm text-gray-600">Identify products and brands from shelf photos</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Shelf Share Calculation</p>
                  <p className="text-sm text-gray-600">Calculate share of shelf space automatically</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Planogram Compliance</p>
                  <p className="text-sm text-gray-600">Compare actual placement vs planned layout</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Out-of-Stock Detection</p>
                  <p className="text-sm text-gray-600">Identify empty slots and gaps on shelves</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Audits</h3>
            <div className="space-y-3">
              {audits.map((audit, idx) => (
                <div key={idx} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{audit.store}</p>
                      <p className="text-sm text-gray-600">{audit.date}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      audit.status === 'good' ? 'bg-green-100 text-green-800' :
                      audit.status === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {audit.compliance}% compliance
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                    <div>
                      <span className="text-gray-600">Facings:</span>
                      <span className="font-semibold ml-1">{audit.facings}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Share:</span>
                      <span className="font-semibold ml-1">{audit.shelfShare}%</span>
                    </div>
                    <div>
                      {audit.status === 'good' ? (
                        <CheckCircle className="h-4 w-4 text-green-600 inline" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600 inline" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {showUpload && (
          <Card className="p-6 bg-blue-50 border-2 border-blue-200">
            <div className="text-center">
              <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Shelf Photo for Analysis</h3>
              <p className="text-gray-600 mb-4">AI will analyze product placement, facings, and compliance</p>
              <div className="flex gap-3 justify-center">
                <Button>
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                <Button variant="outline" onClick={() => setShowUpload(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

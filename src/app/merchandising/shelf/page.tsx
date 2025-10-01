'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Grid3x3 } from 'lucide-react';

export default function ShelfAnalysisPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Shelf Analysis</h1>
        <p className="text-gray-600">Analyze shelf share and compliance</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Avg Shelf Share</p>
            <p className="text-2xl font-bold">42%</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Compliance</p>
            <p className="text-2xl font-bold">85%</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Facings</p>
            <p className="text-2xl font-bold">1,248</p>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

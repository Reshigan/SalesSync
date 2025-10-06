'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Map } from 'lucide-react';

export default function TerritoryMappingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Territory Mapping</h1>
        <p className="text-gray-600">Manage territory assignments</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Coming Soon</p>
            <p className="text-2xl font-bold">-</p>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

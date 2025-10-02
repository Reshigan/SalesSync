'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Route } from 'lucide-react';

export default function RoutesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Routes</h1>
        <p className="text-gray-600">Manage sales routes</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Active Routes</p>
            <p className="text-2xl font-bold">24</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Customers</p>
            <p className="text-2xl font-bold">342</p>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

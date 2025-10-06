'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { MapPin } from 'lucide-react';

export default function BoardPlacementsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Board Placements</h1>
        <p className="text-gray-600">Manage advertising board placements</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Active Boards</p>
            <p className="text-2xl font-bold">142</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-2xl font-bold">12</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Monthly Cost</p>
            <p className="text-2xl font-bold">$8,500</p>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

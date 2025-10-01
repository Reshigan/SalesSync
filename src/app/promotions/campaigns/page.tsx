'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { TrendingUp } from 'lucide-react';

export default function CampaignsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <p className="text-gray-600">Manage promotional campaigns</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Active Campaigns</p>
            <p className="text-2xl font-bold">8</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Total Reach</p>
            <p className="text-2xl font-bold">12,450</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Engagement</p>
            <p className="text-2xl font-bold">68%</p>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

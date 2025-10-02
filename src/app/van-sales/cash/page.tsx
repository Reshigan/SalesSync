'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { DollarSign } from 'lucide-react';

export default function CashManagementPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Cash Management</h1>
        <p className="text-gray-600">Track cash collections and deposits</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Today's Collection</p>
            <p className="text-2xl font-bold">$8,450</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Pending Deposits</p>
            <p className="text-2xl font-bold">$2,100</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Float Variance</p>
            <p className="text-2xl font-bold">$0</p>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

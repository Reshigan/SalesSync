'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { FileText } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="text-gray-600">Manage customer invoices</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold">15</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-2xl font-bold">$125,000</p>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

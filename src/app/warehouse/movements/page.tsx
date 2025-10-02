'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { ArrowRightLeft } from 'lucide-react';

export default function StockMovementsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Stock Movements</h1>
        <p className="text-gray-600">Track inventory movements</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Today's Movements</p>
            <p className="text-2xl font-bold">48</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Transfers</p>
            <p className="text-2xl font-bold">12</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Adjustments</p>
            <p className="text-2xl font-bold">5</p>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

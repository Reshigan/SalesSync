'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { ShoppingCart } from 'lucide-react';

export default function PurchaseOrdersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <p className="text-gray-600">Manage purchase orders</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Pending POs</p>
            <p className="text-2xl font-bold">7</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-2xl font-bold">$45,200</p>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

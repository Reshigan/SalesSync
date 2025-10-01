'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Ticket } from 'lucide-react';

export default function VoucherSalesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Voucher Sales</h1>
        <p className="text-gray-600">Track voucher and airtime sales</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Vouchers Sold</p>
            <p className="text-2xl font-bold">1,245</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Revenue</p>
            <p className="text-2xl font-bold">$12,450</p>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

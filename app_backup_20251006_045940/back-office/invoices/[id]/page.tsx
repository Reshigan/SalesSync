'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { 
  FileText, 
  Download, 
  Printer, 
  Mail,
  MessageSquare,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Calendar,
  CreditCard,
  Send,
  Edit
} from 'lucide-react';

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // Mock invoice data
  const invoice = {
    id: invoiceId,
    invoiceNumber: 'INV-2024-001',
    date: '2024-10-01',
    dueDate: '2024-10-31',
    status: 'pending',
    customer: {
      name: 'Shoprite Lagos Mall',
      code: 'CUST-001',
      email: 'finance@shoprite-lagos.com',
      phone: '+234-800-123-4567',
      address: '123 Mall Road, Victoria Island, Lagos',
      taxId: 'TIN-12345678',
    },
    company: {
      name: 'VanTax Distribution Ltd.',
      address: 'Plot 45, Industrial Road, Ikeja, Lagos',
      phone: '+234-800-VANTAX',
      email: 'invoices@vantax.com',
      taxId: 'TIN-87654321',
    },
    items: [
      { id: '1', description: 'Coca Cola 500ml - 100 units', quantity: 100, price: 250, tax: 8, total: 27000 },
      { id: '2', description: 'Pepsi 500ml - 80 units', quantity: 80, price: 240, tax: 8, total: 20736 },
      { id: '3', description: 'Sprite 500ml - 60 units', quantity: 60, price: 230, tax: 8, total: 14904 },
      { id: '4', description: 'Fanta 500ml - 50 units', quantity: 50, price: 230, tax: 8, total: 12420 },
      { id: '5', description: 'Bottled Water 1L - 200 units', quantity: 200, price: 100, tax: 8, total: 21600 },
    ],
    subtotal: 89000,
    taxAmount: 7120,
    discount: 5340,
    total: 90780,
    amountPaid: 0,
    amountDue: 90780,
    paymentTerms: 'Net 30',
    notes: 'Payment due within 30 days. Late payment subject to 2% monthly interest.',
    orderReference: 'ORD-2024-001',
  };

  const paymentHistory: Array<{ id: string; date: string; amount: number; method: string; reference: string }> = [
    // { id: '1', date: '2024-10-10', amount: 50000, method: 'Bank Transfer', reference: 'TXN-001' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
            <p className="text-gray-600 mt-1">Date: {invoice.date} | Due: {invoice.dueDate}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSendModal(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button variant="outline" onClick={() => setShowSendModal(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={() => setShowPaymentModal(true)}>
              <DollarSign className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Invoice Preview Card */}
        <Card className="p-8">
          {/* Company Header */}
          <div className="flex justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{invoice.company.name}</h2>
              <p className="text-sm text-gray-600 mt-1">{invoice.company.address}</p>
              <p className="text-sm text-gray-600">{invoice.company.phone}</p>
              <p className="text-sm text-gray-600">{invoice.company.email}</p>
              <p className="text-sm text-gray-600">Tax ID: {invoice.company.taxId}</p>
            </div>
            <div className="text-right">
              <h3 className="text-3xl font-bold text-blue-600">INVOICE</h3>
              <p className="text-lg font-semibold mt-2">{invoice.invoiceNumber}</p>
              <p className="text-sm text-gray-600 mt-4">Date: {invoice.date}</p>
              <p className="text-sm text-gray-600">Due Date: {invoice.dueDate}</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-bold text-lg">{invoice.customer.name}</p>
              <p className="text-sm text-gray-600">Customer Code: {invoice.customer.code}</p>
              <p className="text-sm text-gray-600 mt-2">{invoice.customer.address}</p>
              <p className="text-sm text-gray-600">{invoice.customer.phone}</p>
              <p className="text-sm text-gray-600">{invoice.customer.email}</p>
              <p className="text-sm text-gray-600">Tax ID: {invoice.customer.taxId}</p>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Qty</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Price</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Tax %</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">₦{item.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{item.tax}%</td>
                    <td className="px-4 py-3 text-right font-semibold">₦{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">₦{invoice.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Discount:</span>
                <span className="text-green-600">-₦{invoice.discount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Tax (8% VAT):</span>
                <span className="font-semibold">₦{invoice.taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-800">
                <span className="text-lg font-bold">Total Amount:</span>
                <span className="text-lg font-bold text-blue-600">₦{invoice.total.toLocaleString()}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="text-green-600">₦{invoice.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-gray-800">
                    <span className="text-lg font-bold">Amount Due:</span>
                    <span className="text-lg font-bold text-orange-600">₦{invoice.amountDue.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Terms & Notes */}
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Payment Terms:</h4>
                <p className="text-sm text-gray-600">{invoice.paymentTerms}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Order Reference:</h4>
                <p className="text-sm text-gray-600">{invoice.orderReference}</p>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Notes:</h4>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">Thank you for your business!</p>
            <p className="text-xs text-gray-500 mt-2">
              This is a computer-generated invoice and does not require a physical signature.
            </p>
          </div>
        </Card>

        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Payment History</h2>
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Payment Received</div>
                      <div className="text-sm text-gray-600">
                        {payment.date} • {payment.method} • Ref: {payment.reference}
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-green-600">₦{payment.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Invoice Actions</h3>
              <p className="text-sm text-gray-600">Manage this invoice</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Invoice
              </Button>
              {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                <>
                  <Button onClick={() => setShowPaymentModal(true)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
                  <Button variant="outline">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Invoice
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowPaymentModal(false); }}>
          <Input
            label="Payment Amount"
            type="number"
            placeholder="0.00"
            defaultValue={invoice.amountDue}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option>Bank Transfer</option>
              <option>Cash</option>
              <option>Cheque</option>
              <option>Card</option>
              <option>Mobile Money</option>
            </select>
          </div>
          <Input
            label="Payment Date"
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            required
          />
          <Input
            label="Payment Reference"
            placeholder="Transaction reference number"
          />
          <Input
            label="Notes (Optional)"
            placeholder="Add any additional notes"
          />
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <CheckCircle className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Send Invoice Modal */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Send Invoice"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowSendModal(false); }}>
          <Input
            label="Recipient Email/Phone"
            placeholder="email@example.com or +234-800-000-0000"
            defaultValue={invoice.customer.email}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Send Via</label>
            <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option>Email</option>
              <option>WhatsApp</option>
              <option>Both</option>
            </select>
          </div>
          <Input
            label="Subject"
            defaultValue={`Invoice ${invoice.invoiceNumber} from ${invoice.company.name}`}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={4}
              defaultValue={`Dear ${invoice.customer.name},\n\nPlease find attached invoice ${invoice.invoiceNumber} for your recent order.\n\nThank you for your business!`}
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setShowSendModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Send className="h-4 w-4 mr-2" />
              Send Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

/**
 * Product Distribution Component
 * Handles distribution of SIM cards, phones, and other products to individuals
 */

import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Package, Plus, Trash2, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

interface Brand {
  id: string;
  brand_name: string;
}

interface Customer {
  id: string;
  store_name: string;
  owner_name: string;
}

interface Product {
  id: string;
  product_name: string;
  product_type: 'sim_card' | 'phone' | 'other';
  requires_id: boolean;
  requires_serial: boolean;
}

interface Distribution {
  id: string;
  product_id: string;
  product_name: string;
  recipient_name: string;
  recipient_id_number: string;
  recipient_phone: string;
  serial_number: string;
  quantity: number;
}

export default function ProductDistribution() {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const location = useLocation();
  const customer = location.state?.customer as Customer | undefined;
  const brands = location.state?.brands as Brand[] | undefined;
  const gpsVerified = location.state?.gpsVerified as boolean | undefined;

  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock products
  const products: Product[] = [
    {
      id: '1',
      product_name: 'MTN SIM Card',
      product_type: 'sim_card',
      requires_id: true,
      requires_serial: true,
    },
    {
      id: '2',
      product_name: 'Vodacom SIM Card',
      product_type: 'sim_card',
      requires_id: true,
      requires_serial: true,
    },
    {
      id: '3',
      product_name: 'Samsung A04 Phone',
      product_type: 'phone',
      requires_id: true,
      requires_serial: true,
    },
    {
      id: '4',
      product_name: 'Promotional Airtime',
      product_type: 'other',
      requires_id: false,
      requires_serial: false,
    },
  ];

  const [formData, setFormData] = useState({
    product_id: '',
    recipient_name: '',
    recipient_id_number: '',
    recipient_phone: '',
    serial_number: '',
    quantity: 1,
  });

  const handleAddDistribution = () => {
    const product = products.find((p) => p.id === formData.product_id);
    if (!product) {
      setError('Please select a product');
      return;
    }

    if (!formData.recipient_name.trim()) {
      setError('Please enter recipient name');
      return;
    }

    if (product.requires_id && !formData.recipient_id_number.trim()) {
      setError('ID number is required for this product');
      return;
    }

    if (product.requires_serial && !formData.serial_number.trim()) {
      setError('Serial number is required for this product');
      return;
    }

    const newDistribution: Distribution = {
      id: `dist-${Date.now()}`,
      product_id: formData.product_id,
      product_name: product.product_name,
      recipient_name: formData.recipient_name,
      recipient_id_number: formData.recipient_id_number,
      recipient_phone: formData.recipient_phone,
      serial_number: formData.serial_number,
      quantity: formData.quantity,
    };

    setDistributions((prev) => [...prev, newDistribution]);
    setFormData({
      product_id: '',
      recipient_name: '',
      recipient_id_number: '',
      recipient_phone: '',
      serial_number: '',
      quantity: 1,
    });
    setShowAddForm(false);
    setError(null);
  };

  const handleRemoveDistribution = (id: string) => {
    setDistributions((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = async () => {
    if (distributions.length === 0) {
      setError('Please add at least one product distribution');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // TODO: Submit to backend
      // await fieldMarketingService.submitProductDistributions(customerId, distributions);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Navigate back to visit list
      navigate(`/field-marketing/visit-list/${customerId}`, {
        state: { customer, brands, gpsVerified, productDistributionComplete: true },
      });
    } catch (err) {
      console.error('Error submitting distributions:', err);
      setError('Failed to submit product distributions. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate(`/field-marketing/visit-list/${customerId}`, {
      state: { customer, brands, gpsVerified },
    });
  };

  const selectedProduct = products.find((p) => p.id === formData.product_id);

  if (!customer || !brands) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Required information not found</p>
          <button
            onClick={() => navigate('/field-marketing/select-customer')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Customer Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Product Distribution
        </h1>
        <p className="text-gray-600">
          Distribute products at {customer.store_name}
        </p>
      </div>

      {/* Customer Info */}
      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-900">{customer.store_name}</h3>
        <p className="text-sm text-gray-600">{customer.owner_name}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Add Distribution Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full mb-4 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center font-semibold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Product Distribution
        </button>
      )}

      {/* Add Distribution Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-white border-2 border-blue-500 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4">New Distribution</h3>

          <div className="space-y-4">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product *
              </label>
              <select
                value={formData.product_id}
                onChange={(e) =>
                  setFormData({ ...formData, product_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.product_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Name *
              </label>
              <input
                type="text"
                value={formData.recipient_name}
                onChange={(e) =>
                  setFormData({ ...formData, recipient_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Full name"
              />
            </div>

            {/* ID Number (if required) */}
            {selectedProduct?.requires_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number *
                </label>
                <input
                  type="text"
                  value={formData.recipient_id_number}
                  onChange={(e) =>
                    setFormData({ ...formData, recipient_id_number: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ID number"
                />
              </div>
            )}

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.recipient_phone}
                onChange={(e) =>
                  setFormData({ ...formData, recipient_phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Phone number"
              />
            </div>

            {/* Serial Number (if required) */}
            {selectedProduct?.requires_serial && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial/ICCID Number *
                </label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) =>
                    setFormData({ ...formData, serial_number: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Serial or ICCID number"
                />
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddDistribution}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Add Distribution
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setError(null);
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Distributions List */}
      {distributions.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Distributions ({distributions.length})
          </h3>
          <div className="space-y-2">
            {distributions.map((dist) => (
              <div
                key={dist.id}
                className="p-4 bg-white border border-gray-200 rounded-lg flex items-start justify-between"
              >
                <div className="flex items-start flex-1">
                  <Package className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{dist.product_name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Recipient: {dist.recipient_name}
                    </p>
                    {dist.recipient_id_number && (
                      <p className="text-sm text-gray-600">
                        ID: {dist.recipient_id_number}
                      </p>
                    )}
                    {dist.serial_number && (
                      <p className="text-sm text-gray-600">
                        Serial: {dist.serial_number}
                      </p>
                    )}
                    {dist.quantity > 1 && (
                      <p className="text-sm text-gray-600">Qty: {dist.quantity}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveDistribution(dist.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg ml-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {distributions.length === 0 && !showAddForm && (
        <div className="mb-6 text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No products distributed yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Click "Add Product Distribution" to start
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleSubmit}
          disabled={distributions.length === 0 || submitting}
          className={`w-full px-6 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors ${
            distributions.length === 0 || submitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {submitting ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Submit Distributions
            </>
          )}
        </button>

        <button
          onClick={handleSkip}
          disabled={submitting}
          className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
}

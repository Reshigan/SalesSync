/**
 * Brand Selection Component
 * Allows field agent to select brands for the visit
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Check, ArrowRight, Package, AlertCircle } from 'lucide-react';
import { apiClient } from '../../services/api.service';

interface Brand {
  id: string;
  brand_name: string;
  logo_url: string | null;
  description: string | null;
  status: string;
}

interface Customer {
  id: string;
  store_name: string;
  owner_name: string;
  brands?: Brand[];
}

export default function BrandSelection() {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const location = useLocation();
  const customer = location.state?.customer as Customer | undefined;
  const gpsVerified = location.state?.gpsVerified as boolean | undefined;

  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) {
      console.error('Customer data not provided');
      navigate('/field-marketing/select-customer');
      return;
    }
    fetchBrands();
  }, [customer, navigate]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/brands?status=active');
      const brandsData = response.data.data || [];
      
      setBrands(brandsData.map((b: any) => ({
        id: b.id,
        brand_name: b.brand_name || b.name,
        logo_url: b.logo_url || b.logo,
        description: b.description,
        status: b.status
      })));

      if (customer?.brands) {
        const existingBrandIds = new Set(customer.brands.map((b) => b.id));
        setSelectedBrands(existingBrandIds);
      }
    } catch (err) {
      setError('Failed to load brands. Please try again.');
      console.error('Error fetching brands:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBrand = (brandId: string) => {
    const newSelected = new Set(selectedBrands);
    if (newSelected.has(brandId)) {
      newSelected.delete(brandId);
    } else {
      newSelected.add(brandId);
    }
    setSelectedBrands(newSelected);
  };

  const handleContinue = () => {
    if (selectedBrands.size === 0) {
      alert('Please select at least one brand');
      return;
    }

    const selectedBrandsList = brands.filter((b) => selectedBrands.has(b.id));

    navigate(`/field-marketing/visit-list/${customerId}`, {
      state: {
        customer,
        brands: selectedBrandsList,
        gpsVerified,
      },
    });
  };

  const handleCancel = () => {
    navigate('/field-marketing/select-customer');
  };

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Customer information not found</p>
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
          Select Brands
        </h1>
        <p className="text-gray-600">
          Choose the brands for this visit at {customer.store_name}
        </p>
      </div>

      {/* GPS Verification Status */}
      {gpsVerified === false && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Location Not Verified</p>
            <p className="text-xs text-yellow-700 mt-1">
              This visit will be flagged for review as you proceeded without GPS verification
            </p>
          </div>
        </div>
      )}

      {/* Customer Info */}
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-900">{customer.store_name}</h3>
        <p className="text-sm text-gray-600">{customer.owner_name}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchBrands}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 bg-gray-100 rounded-lg animate-pulse h-20"
            />
          ))}
        </div>
      )}

      {/* Brand List */}
      {!loading && brands.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Available Brands
          </h2>
          {brands.map((brand) => {
            const isSelected = selectedBrands.has(brand.id);
            return (
              <button
                key={brand.id}
                onClick={() => toggleBrand(brand.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={brand.brand_name}
                        className="w-12 h-12 object-contain rounded mr-3"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center mr-3">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {brand.brand_name}
                      </h3>
                      {brand.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {brand.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!loading && brands.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No brands available</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleContinue}
          disabled={selectedBrands.size === 0}
          className={`w-full px-6 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors ${
            selectedBrands.size === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Continue to Visit List ({selectedBrands.size} selected)
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>

        <button
          onClick={handleCancel}
          className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
        >
          Cancel Visit
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700 text-center">
          Select all brands you'll be working with during this visit
        </p>
      </div>
    </div>
  );
}

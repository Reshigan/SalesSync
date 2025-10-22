/**
 * Customer Selection Component
 * Allows field agent to select existing customer or register new customer
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, Users, PlusCircle, Navigation } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { haversineDistance, formatDistance } from '../../utils/gps.utils';

interface Customer {
  id: string;
  store_name: string;
  owner_name: string;
  phone: string;
  address: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  last_visit_date: string | null;
  status: string;
  brands?: Brand[];
}

interface Brand {
  id: string;
  brand_name: string;
  logo_url: string | null;
}

export default function CustomerSelection() {
  const navigate = useNavigate();
  const { position, loading: gpsLoading, getCurrentPosition } = useGeolocation();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'distance' | 'lastVisit'>('distance');

  useEffect(() => {
    fetchCustomers();
    getCurrentPosition();
  }, []);

  useEffect(() => {
    filterAndSortCustomers();
  }, [customers, searchQuery, sortBy, position]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await customerService.getMyCustomers();
      // setCustomers(response.data);

      // Mock data for demonstration
      const mockCustomers: Customer[] = [
        {
          id: '1',
          store_name: 'Mikes Spaza Shop',
          owner_name: 'Mike Mokoena',
          phone: '0823456789',
          address: '123 Main Street, Soweto',
          gps_latitude: -26.2041,
          gps_longitude: 28.0473,
          last_visit_date: '2025-10-15',
          status: 'active',
          brands: [
            { id: '1', brand_name: 'MTN', logo_url: null },
            { id: '2', brand_name: 'Vodacom', logo_url: null },
          ],
        },
        {
          id: '2',
          store_name: 'Thembis Corner Cafe',
          owner_name: 'Thembi Dlamini',
          phone: '0734567890',
          address: '456 Market Road, Alexandra',
          gps_latitude: -26.1076,
          gps_longitude: 28.0967,
          last_visit_date: null,
          status: 'active',
          brands: [{ id: '1', brand_name: 'MTN', logo_url: null }],
        },
      ];

      setCustomers(mockCustomers);
    } catch (err) {
      setError('Failed to load customers. Please try again.');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCustomers = () => {
    let filtered = customers;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = customers.filter(
        (customer) =>
          customer.store_name.toLowerCase().includes(query) ||
          customer.owner_name.toLowerCase().includes(query) ||
          customer.phone.includes(query) ||
          customer.address.toLowerCase().includes(query)
      );
    }

    // Calculate distances and sort
    const customersWithDistance = filtered.map((customer) => {
      let distance = Infinity;
      if (
        position &&
        customer.gps_latitude !== null &&
        customer.gps_longitude !== null
      ) {
        distance = haversineDistance(
          position.latitude,
          position.longitude,
          customer.gps_latitude,
          customer.gps_longitude
        );
      }
      return { ...customer, distance };
    });

    // Sort customers
    customersWithDistance.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance;
        case 'name':
          return a.store_name.localeCompare(b.store_name);
        case 'lastVisit':
          if (!a.last_visit_date) return 1;
          if (!b.last_visit_date) return -1;
          return (
            new Date(b.last_visit_date).getTime() -
            new Date(a.last_visit_date).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredCustomers(customersWithDistance);
  };

  const handleSelectCustomer = (customer: Customer) => {
    navigate(`/field-marketing/verify-location/${customer.id}`, {
      state: { customer },
    });
  };

  const handleNewCustomer = () => {
    navigate('/field-marketing/new-customer');
  };

  const formatLastVisit = (lastVisitDate: string | null): string => {
    if (!lastVisitDate) return 'Never visited';

    const date = new Date(lastVisitDate);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Customer</h1>
        <p className="text-gray-600">
          Choose an existing customer or register a new one
        </p>
      </div>

      {/* GPS Status */}
      {gpsLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
          <Navigation className="w-5 h-5 text-blue-600 mr-2 animate-pulse" />
          <span className="text-sm text-blue-700">Getting your location...</span>
        </div>
      )}

      {position && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <MapPin className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-sm text-green-700">
            Location acquired (Accuracy: {position.accuracy?.toFixed(0)}m)
          </span>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by store name, owner, phone, or address..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSortBy('distance')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              sortBy === 'distance'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-1" />
            Nearest
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              sortBy === 'name'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Name
          </button>
          <button
            onClick={() => setSortBy('lastVisit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              sortBy === 'lastVisit'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-1" />
            Last Visit
          </button>
        </div>
      </div>

      {/* New Customer Button */}
      <button
        onClick={handleNewCustomer}
        className="w-full mb-4 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
      >
        <PlusCircle className="w-5 h-5 mr-2" />
        <span className="font-semibold">Register New Customer</span>
      </button>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchCustomers}
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
              className="p-4 bg-gray-100 rounded-lg animate-pulse h-32"
            />
          ))}
        </div>
      )}

      {/* Customer List */}
      {!loading && filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            {searchQuery.trim()
              ? 'No customers match your search'
              : 'No customers assigned to you yet'}
          </p>
        </div>
      )}

      {!loading && filteredCustomers.length > 0 && (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => handleSelectCustomer(customer)}
              className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {customer.store_name}
                  </h3>
                  <p className="text-sm text-gray-600">{customer.owner_name}</p>
                </div>
                {position &&
                  customer.gps_latitude !== null &&
                  customer.gps_longitude !== null && (
                    <div className="ml-3 text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {formatDistance(
                          haversineDistance(
                            position.latitude,
                            position.longitude,
                            customer.gps_latitude,
                            customer.gps_longitude
                          )
                        )}
                      </div>
                      <div className="text-xs text-gray-500">away</div>
                    </div>
                  )}
              </div>

              <div className="flex items-center text-sm text-gray-500 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                {customer.address}
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatLastVisit(customer.last_visit_date)}
                </div>

                {customer.brands && customer.brands.length > 0 && (
                  <div className="flex gap-1">
                    {customer.brands.map((brand) => (
                      <span
                        key={brand.id}
                        className="px-2 py-1 bg-gray-100 text-xs rounded"
                      >
                        {brand.brand_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          {filteredCustomers.length} customer
          {filteredCustomers.length !== 1 ? 's' : ''} available
        </p>
      </div>
    </div>
  );
}

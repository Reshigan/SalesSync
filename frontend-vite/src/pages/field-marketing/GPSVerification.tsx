/**
 * GPS Verification Component
 * Verifies field agent is within 10 meters of customer location
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
  ArrowRight,
} from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { verifyLocation, formatDistance, formatCoordinates, getAccuracyLevel } from '../../utils/gps.utils';
import { apiClient } from '../../services/api.service';

interface Customer {
  id: string;
  store_name: string;
  owner_name: string;
  gps_latitude: number;
  gps_longitude: number;
  address: string;
}

export default function GPSVerification() {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const location = useLocation();
  const customer = location.state?.customer as Customer | undefined;

  const { position, loading: gpsLoading, getCurrentPosition, error: gpsError } = useGeolocation({
    enableHighAccuracy: true,
    watch: false,
  });

  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<{
    isWithinRange: boolean;
    distance: number;
    accuracy: string;
  } | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (!customer) {
      // If customer data not passed, fetch from API
      // TODO: Fetch customer data
      console.error('Customer data not provided');
      navigate('/field-marketing/select-customer');
      return;
    }
  }, [customer, navigate]);

  useEffect(() => {
    if (position && customer) {
      verifyCurrentLocation();
    }
  }, [position, customer]);

  const verifyCurrentLocation = () => {
    if (!position || !customer) return;

    setVerifying(true);

    const result = verifyLocation(
      position.latitude,
      position.longitude,
      customer.gps_latitude,
      customer.gps_longitude,
      10 // 10 meters threshold
    );

    setVerification(result);
    setVerifying(false);

    if (!result.isWithinRange) {
      setShowOptions(true);
    }
  };

  const handleProceed = () => {
    if (!verification?.isWithinRange) {
      // Log that user proceeded despite being out of range
      console.warn('User proceeded despite being out of range:', verification);
    }
    navigate(`/field-marketing/select-brands/${customerId}`, {
      state: { customer, gpsVerified: verification?.isWithinRange },
    });
  };

  const handleUpdateCustomerLocation = async () => {
    if (!position || !customer) return;
    
    const justification = prompt('Please provide a reason for updating the customer location:');
    if (!justification) return;
    
    try {
      await apiClient.put(`/customers/${customer.id}/location`, {
        gps_latitude: position.latitude,
        gps_longitude: position.longitude,
        justification: justification
      });
      
      alert('Customer location updated successfully');
      window.location.reload();
    } catch (error) {
      console.error('Error updating customer location:', error);
      alert('Failed to update customer location. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate('/field-marketing/select-customer');
  };

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
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
          Verify Location
        </h1>
        <p className="text-gray-600">
          Confirm you're at {customer.store_name}
        </p>
      </div>

      {/* Customer Info Card */}
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-1">
          {customer.store_name}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{customer.owner_name}</p>
        <div className="flex items-start text-sm text-gray-500">
          <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>{customer.address}</span>
        </div>
      </div>

      {/* GPS Loading */}
      {gpsLoading && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <Navigation className="w-12 h-12 text-blue-600 mx-auto mb-3 animate-pulse" />
          <p className="text-blue-700 font-medium mb-2">
            Getting your current location...
          </p>
          <p className="text-sm text-blue-600">
            Please ensure GPS is enabled and you have a clear view of the sky
          </p>
        </div>
      )}

      {/* GPS Error */}
      {gpsError && (
        <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <p className="text-red-700 font-medium mb-2 text-center">
            Location Error
          </p>
          <p className="text-sm text-red-600 mb-4 text-center">
            {gpsError.message}
          </p>
          <button
            onClick={getCurrentPosition}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      )}

      {/* GPS Position Details */}
      {position && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">
            Location Information
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Your Location:</span>
              <span className="font-mono text-gray-900">
                {formatCoordinates(position.latitude, position.longitude)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer Location:</span>
              <span className="font-mono text-gray-900">
                {formatCoordinates(customer.gps_latitude, customer.gps_longitude)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">GPS Accuracy:</span>
              <span className={`font-medium ${
                position.accuracy && position.accuracy <= 10
                  ? 'text-green-600'
                  : position.accuracy && position.accuracy <= 50
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}>
                {position.accuracy ? `${position.accuracy.toFixed(0)}m (${getAccuracyLevel(position.accuracy)})` : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Verification Result */}
      {verification && !verifying && (
        <div
          className={`mb-6 p-6 rounded-lg border-2 ${
            verification.isWithinRange
              ? 'bg-green-50 border-green-500'
              : 'bg-yellow-50 border-yellow-500'
          }`}
        >
          {verification.isWithinRange ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-900 text-center mb-2">
                Location Verified ✓
              </h3>
              <p className="text-green-700 text-center mb-4">
                You are within {formatDistance(verification.distance)} of the
                customer location
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-yellow-900 text-center mb-2">
                Location Mismatch
              </h3>
              <p className="text-yellow-700 text-center mb-2">
                You are {formatDistance(verification.distance)} away from the
                registered customer location
              </p>
              <p className="text-sm text-yellow-600 text-center">
                You must be within 10 meters to verify
              </p>
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {verification?.isWithinRange && (
          <button
            onClick={handleProceed}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center"
          >
            Continue to Brand Selection
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        )}

        {!verification?.isWithinRange && showOptions && (
          <>
            <button
              onClick={handleUpdateCustomerLocation}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Update Customer Location
            </button>

            <button
              onClick={handleProceed}
              className="w-full px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold flex items-center justify-center"
            >
              Proceed Anyway (Will be flagged)
              <AlertTriangle className="w-5 h-5 ml-2" />
            </button>
          </>
        )}

        {position && (
          <button
            onClick={getCurrentPosition}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold flex items-center justify-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh Location
          </button>
        )}

        <button
          onClick={handleCancel}
          className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center"
        >
          <X className="w-5 h-5 mr-2" />
          Cancel Visit
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700 text-center">
          <strong>Tip:</strong> For best accuracy, ensure GPS is enabled and
          you're outdoors with a clear view of the sky
        </p>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Camera, Store, User, Phone, Mail, MapPinned, Building2, Users, Clock, CreditCard, ChevronRight, Save, AlertCircle } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import CameraCapture from '../../components/CameraCapture';

interface CustomerData {
  storeName: string;
  ownerName: string;
  phoneNumber: string;
  physicalAddress: string;
  storeType: string;
  email?: string;
  alternativePhone?: string;
  storeSize?: string;
  numberOfEmployees?: string;
  businessRegistration?: string;
  openingHours?: string;
  paymentTerms?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface Brand {
  id: string;
  name: string;
  stockLevel?: string;
  competitorPresent?: string;
  interestLevel: 'high' | 'medium' | 'low' | '';
}

const STORE_TYPES = [
  'Spaza Shop',
  'Mini Market',
  'Supermarket',
  'Restaurant',
  'Tavern',
  'Pharmacy',
  'Hardware Store',
  'Other'
];

const INTEREST_LEVELS = [
  { value: 'high', label: 'High Interest', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium Interest', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low Interest', color: 'bg-red-500' }
];

export default function NewCustomerRegistration() {
  const navigate = useNavigate();
  const { position, error: gpsError, loading: gpsLoading, getCurrentPosition } = useGeolocation();

  const [step, setStep] = useState<'gps' | 'details' | 'photos' | 'brands' | 'review'>('gps');
  const [customerData, setCustomerData] = useState<CustomerData>({
    storeName: '',
    ownerName: '',
    phoneNumber: '',
    physicalAddress: '',
    storeType: '',
    latitude: 0,
    longitude: 0
  });

  const [storefrontPhoto, setStorefrontPhoto] = useState<File | null>(null);
  const [storefrontPhotoPreview, setStorefrontPhotoPreview] = useState<string>('');
  const [interiorPhoto, setInteriorPhoto] = useState<File | null>(null);
  const [interiorPhotoPreview, setInteriorPhotoPreview] = useState<string>('');
  const [idDocumentPhoto, setIdDocumentPhoto] = useState<File | null>(null);
  const [idDocumentPhotoPreview, setIdDocumentPhotoPreview] = useState<string>('');

  const [showStorefrontCamera, setShowStorefrontCamera] = useState(false);
  const [showInteriorCamera, setShowInteriorCamera] = useState(false);
  const [showIdCamera, setShowIdCamera] = useState(false);

  const [selectedBrands, setSelectedBrands] = useState<Brand[]>([]);
  const [availableBrands] = useState([
    { id: '1', name: 'Coca-Cola' },
    { id: '2', name: 'MTN' },
    { id: '3', name: 'Vodacom' },
    { id: '4', name: 'Samsung' }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (step === 'gps' && !position) {
      getCurrentPosition();
    }
  }, [step]);

  useEffect(() => {
    if (position) {
      setCustomerData(prev => ({
        ...prev,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy
      }));
    }
  }, [position]);

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (currentStep: string): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'gps') {
      if (!position) {
        newErrors.gps = 'GPS location is required';
        return false;
      }
    }

    if (currentStep === 'details') {
      if (!customerData.storeName.trim()) newErrors.storeName = 'Store name is required';
      if (!customerData.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
      if (!customerData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
      else if (!/^\d{10}$/.test(customerData.phoneNumber.replace(/\s/g, ''))) {
        newErrors.phoneNumber = 'Phone number must be 10 digits';
      }
      if (!customerData.physicalAddress.trim()) newErrors.physicalAddress = 'Address is required';
      if (!customerData.storeType) newErrors.storeType = 'Store type is required';
    }

    if (currentStep === 'photos') {
      if (!storefrontPhoto) newErrors.storefrontPhoto = 'Storefront photo is required';
      if (!idDocumentPhoto) newErrors.idDocumentPhoto = 'ID document photo is required';
    }

    if (currentStep === 'brands') {
      if (selectedBrands.length === 0) newErrors.brands = 'Select at least one brand';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;

    const steps: typeof step[] = ['gps', 'details', 'photos', 'brands', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: typeof step[] = ['gps', 'details', 'photos', 'brands', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    } else {
      navigate(-1);
    }
  };

  const handleStorefrontCapture = (imageData: string, file: File) => {
    setStorefrontPhoto(file);
    setStorefrontPhotoPreview(imageData);
    setShowStorefrontCamera(false);
    if (errors.storefrontPhoto) {
      setErrors(prev => ({ ...prev, storefrontPhoto: '' }));
    }
  };

  const handleInteriorCapture = (imageData: string, file: File) => {
    setInteriorPhoto(file);
    setInteriorPhotoPreview(imageData);
    setShowInteriorCamera(false);
  };

  const handleIdCapture = (imageData: string, file: File) => {
    setIdDocumentPhoto(file);
    setIdDocumentPhotoPreview(imageData);
    setShowIdCamera(false);
    if (errors.idDocumentPhoto) {
      setErrors(prev => ({ ...prev, idDocumentPhoto: '' }));
    }
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands(prev => {
      const existing = prev.find(b => b.id === brandId);
      if (existing) {
        return prev.filter(b => b.id !== brandId);
      } else {
        const brand = availableBrands.find(b => b.id === brandId);
        if (brand) {
          return [...prev, { ...brand, interestLevel: '' as const }];
        }
      }
      return prev;
    });
    if (errors.brands) {
      setErrors(prev => ({ ...prev, brands: '' }));
    }
  };

  const updateBrandDetail = (brandId: string, field: keyof Brand, value: string) => {
    setSelectedBrands(prev =>
      prev.map(b => b.id === brandId ? { ...b, [field]: value } : b)
    );
  };

  const handleSubmit = async () => {
    if (!validateStep('brands')) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Add customer data
      Object.entries(customerData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      // Add photos
      if (storefrontPhoto) formData.append('storefrontPhoto', storefrontPhoto);
      if (interiorPhoto) formData.append('interiorPhoto', interiorPhoto);
      if (idDocumentPhoto) formData.append('idDocumentPhoto', idDocumentPhoto);

      // Add brand data
      formData.append('brands', JSON.stringify(selectedBrands));

      // TODO: Make API call to register new customer
      // const response = await fetch('/api/customers/register', {
      //   method: 'POST',
      //   body: formData
      // });

      console.log('Registering new customer:', {
        customerData,
        brands: selectedBrands,
        photos: {
          storefront: storefrontPhoto?.name,
          interior: interiorPhoto?.name,
          idDocument: idDocumentPhoto?.name
        }
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Navigate to visit list or dashboard
      navigate('/field-marketing/visit-list', { 
        state: { 
          newCustomer: true,
          customerId: 'new-customer-id',
          customerName: customerData.storeName
        } 
      });
    } catch (error) {
      console.error('Error registering customer:', error);
      alert('Failed to register customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold text-gray-900">New Customer Registration</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {[
              { key: 'gps', label: 'GPS', icon: MapPin },
              { key: 'details', label: 'Details', icon: Store },
              { key: 'photos', label: 'Photos', icon: Camera },
              { key: 'brands', label: 'Brands', icon: Building2 },
              { key: 'review', label: 'Review', icon: ChevronRight }
            ].map((s, index, array) => (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step === s.key ? 'bg-blue-600 text-white' :
                    array.indexOf({ key: step } as any) > index ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs mt-1 text-gray-600">{s.label}</span>
                </div>
                {index < array.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    array.indexOf({ key: step } as any) > index ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* GPS Capture Step */}
        {step === 'gps' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              GPS Location Capture
            </h2>
            
            {gpsError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-medium">GPS Error</p>
                  <p className="text-sm text-red-700 mt-1">{gpsError.message}</p>
                </div>
              </div>
            )}

            {!position && !gpsError && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Acquiring GPS location...</p>
              </div>
            )}

            {position && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800 mb-2">Location Captured Successfully</p>
                  <div className="space-y-2 text-sm text-green-700">
                    <p><strong>Latitude:</strong> {position.latitude.toFixed(6)}</p>
                    <p><strong>Longitude:</strong> {position.longitude.toFixed(6)}</p>
                    <p><strong>Accuracy:</strong> ±{position.accuracy?.toFixed(0)}m</p>
                  </div>
                </div>

                {/* Simple Map Placeholder */}
                <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center">
                    <MapPinned className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">Map view would appear here</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={getCurrentPosition}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Refresh Location
                </button>
              </div>
            )}

            {errors.gps && (
              <p className="mt-2 text-sm text-red-600">{errors.gps}</p>
            )}
          </div>
        )}

        {/* Customer Details Step */}
        {step === 'details' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center">
              <Store className="w-5 h-5 mr-2" />
              Customer Details
            </h2>

            <div className="space-y-4">
              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerData.storeName}
                  onChange={(e) => handleInputChange('storeName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.storeName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ABC Spaza Shop"
                />
                {errors.storeName && <p className="mt-1 text-sm text-red-600">{errors.storeName}</p>}
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner/Contact Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={customerData.ownerName}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.ownerName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.ownerName && <p className="mt-1 text-sm text-red-600">{errors.ownerName}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={customerData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0821234567"
                  />
                </div>
                {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
              </div>

              {/* Physical Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Physical Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={customerData.physicalAddress}
                  onChange={(e) => handleInputChange('physicalAddress', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.physicalAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123 Main Street, Soweto, Johannesburg"
                />
                {errors.physicalAddress && <p className="mt-1 text-sm text-red-600">{errors.physicalAddress}</p>}
              </div>

              {/* Store Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={customerData.storeType}
                  onChange={(e) => handleInputChange('storeType', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.storeType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select store type...</option>
                  {STORE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.storeType && <p className="mt-1 text-sm text-red-600">{errors.storeType}</p>}
              </div>

              {/* Optional Fields */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Optional Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={customerData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Alternative Phone</label>
                    <input
                      type="tel"
                      value={customerData.alternativePhone || ''}
                      onChange={(e) => handleInputChange('alternativePhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0821234567"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Store Size (sq m)</label>
                      <input
                        type="number"
                        value={customerData.storeSize || ''}
                        onChange={(e) => handleInputChange('storeSize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        <Users className="inline w-4 h-4 mr-1" />
                        Employees
                      </label>
                      <input
                        type="number"
                        value={customerData.numberOfEmployees || ''}
                        onChange={(e) => handleInputChange('numberOfEmployees', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Business Registration Number</label>
                    <input
                      type="text"
                      value={customerData.businessRegistration || ''}
                      onChange={(e) => handleInputChange('businessRegistration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="2023/123456/07"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      <Clock className="inline w-4 h-4 mr-1" />
                      Opening Hours
                    </label>
                    <input
                      type="text"
                      value={customerData.openingHours || ''}
                      onChange={(e) => handleInputChange('openingHours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Mon-Sat: 8AM-6PM, Sun: 9AM-2PM"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      <CreditCard className="inline w-4 h-4 mr-1" />
                      Payment Terms Preference
                    </label>
                    <select
                      value={customerData.paymentTerms || ''}
                      onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select payment terms...</option>
                      <option value="cash">Cash Only</option>
                      <option value="credit_7">7 Days Credit</option>
                      <option value="credit_14">14 Days Credit</option>
                      <option value="credit_30">30 Days Credit</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photos Step */}
        {step === 'photos' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Photo Captures
            </h2>

            <div className="space-y-6">
              {/* Storefront Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storefront Photo <span className="text-red-500">*</span>
                </label>
                {storefrontPhotoPreview ? (
                  <div className="space-y-2">
                    <img src={storefrontPhotoPreview} alt="Storefront" className="w-full h-64 object-cover rounded-lg" />
                    <button
                      onClick={() => setShowStorefrontCamera(true)}
                      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Retake Photo
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowStorefrontCamera(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center"
                  >
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Capture Storefront Photo</span>
                  </button>
                )}
                {errors.storefrontPhoto && <p className="mt-1 text-sm text-red-600">{errors.storefrontPhoto}</p>}
              </div>

              {/* Interior Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Interior Photo (Optional)
                </label>
                {interiorPhotoPreview ? (
                  <div className="space-y-2">
                    <img src={interiorPhotoPreview} alt="Interior" className="w-full h-64 object-cover rounded-lg" />
                    <button
                      onClick={() => setShowInteriorCamera(true)}
                      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Retake Photo
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowInteriorCamera(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center"
                  >
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Capture Interior Photo</span>
                  </button>
                )}
              </div>

              {/* ID Document Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner ID Document Photo <span className="text-red-500">*</span>
                </label>
                {idDocumentPhotoPreview ? (
                  <div className="space-y-2">
                    <img src={idDocumentPhotoPreview} alt="ID Document" className="w-full h-64 object-cover rounded-lg" />
                    <button
                      onClick={() => setShowIdCamera(true)}
                      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Retake Photo
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowIdCamera(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center"
                  >
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Capture ID Document</span>
                  </button>
                )}
                {errors.idDocumentPhoto && <p className="mt-1 text-sm text-red-600">{errors.idDocumentPhoto}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Brands Step */}
        {step === 'brands' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Brand Association
            </h2>

            <div className="space-y-6">
              {/* Brand Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Brand(s) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {availableBrands.map(brand => (
                    <button
                      key={brand.id}
                      onClick={() => toggleBrand(brand.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        selectedBrands.some(b => b.id === brand.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{brand.name}</span>
                        {selectedBrands.some(b => b.id === brand.id) && (
                          <span className="text-blue-600">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {errors.brands && <p className="mt-2 text-sm text-red-600">{errors.brands}</p>}
              </div>

              {/* Brand Details */}
              {selectedBrands.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Brand Details</h3>
                  <div className="space-y-4">
                    {selectedBrands.map(brand => (
                      <div key={brand.id} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium mb-3">{brand.name}</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Current Stock Level
                            </label>
                            <input
                              type="text"
                              value={brand.stockLevel || ''}
                              onChange={(e) => updateBrandDetail(brand.id, 'stockLevel', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., High, Medium, Low, None"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Competitor Brands Present
                            </label>
                            <input
                              type="text"
                              value={brand.competitorPresent || ''}
                              onChange={(e) => updateBrandDetail(brand.id, 'competitorPresent', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., Pepsi, Castle Lite"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                              Interest Level
                            </label>
                            <div className="flex gap-2">
                              {INTEREST_LEVELS.map(level => (
                                <button
                                  key={level.value}
                                  onClick={() => updateBrandDetail(brand.id, 'interestLevel', level.value)}
                                  className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                                    brand.interestLevel === level.value
                                      ? `${level.color} text-white border-transparent`
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  {level.label.split(' ')[0]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-6">Review Registration</h2>

              {/* GPS */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  GPS Location
                </h3>
                <p className="text-sm text-gray-600">
                  {customerData.latitude.toFixed(6)}, {customerData.longitude.toFixed(6)}
                </p>
              </div>

              {/* Customer Details */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Store className="w-4 h-4 mr-2" />
                  Customer Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Store Name:</span>
                    <p className="font-medium">{customerData.storeName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Owner:</span>
                    <p className="font-medium">{customerData.ownerName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="font-medium">{customerData.phoneNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Store Type:</span>
                    <p className="font-medium">{customerData.storeType}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Address:</span>
                    <p className="font-medium">{customerData.physicalAddress}</p>
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Camera className="w-4 h-4 mr-2" />
                  Photos
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {storefrontPhotoPreview && (
                    <div>
                      <img src={storefrontPhotoPreview} alt="Storefront" className="w-full h-24 object-cover rounded" />
                      <p className="text-xs text-gray-500 mt-1">Storefront</p>
                    </div>
                  )}
                  {interiorPhotoPreview && (
                    <div>
                      <img src={interiorPhotoPreview} alt="Interior" className="w-full h-24 object-cover rounded" />
                      <p className="text-xs text-gray-500 mt-1">Interior</p>
                    </div>
                  )}
                  {idDocumentPhotoPreview && (
                    <div>
                      <img src={idDocumentPhotoPreview} alt="ID" className="w-full h-24 object-cover rounded" />
                      <p className="text-xs text-gray-500 mt-1">ID Document</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Brands */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Associated Brands ({selectedBrands.length})
                </h3>
                <div className="space-y-2">
                  {selectedBrands.map(brand => (
                    <div key={brand.id} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                      <span className="font-medium">{brand.name}</span>
                      {brand.interestLevel && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          brand.interestLevel === 'high' ? 'bg-green-100 text-green-800' :
                          brand.interestLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {brand.interestLevel.toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Registering Customer...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Complete Registration
                </>
              )}
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        {step !== 'review' && (
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Camera Modals */}
      {showStorefrontCamera && (
        <CameraCapture
          onCapture={handleStorefrontCapture}
          onCancel={() => setShowStorefrontCamera(false)}
          aspectRatio="landscape"
        />
      )}

      {showInteriorCamera && (
        <CameraCapture
          onCapture={handleInteriorCapture}
          onCancel={() => setShowInteriorCamera(false)}
          aspectRatio="landscape"
        />
      )}

      {showIdCamera && (
        <CameraCapture
          onCapture={handleIdCapture}
          onCancel={() => setShowIdCamera(false)}
          aspectRatio="landscape"
        />
      )}
    </div>
  );
}

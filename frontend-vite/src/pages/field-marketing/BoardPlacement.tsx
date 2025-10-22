/**
 * Board Placement Component
 * Handles board installation with photo capture and coverage analysis
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Camera,
  Image as ImageIcon,
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  X,
  Percent,
} from 'lucide-react';
import CameraCapture from '../../components/CameraCapture';

interface Brand {
  id: string;
  brand_name: string;
}

interface Customer {
  id: string;
  store_name: string;
  owner_name: string;
}

interface BoardPhoto {
  id: string;
  brand_id: string;
  brand_name: string;
  imageData: string;
  file: File;
  coverage: number | null;
  analyzing: boolean;
}

export default function BoardPlacement() {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const location = useLocation();
  const customer = location.state?.customer as Customer | undefined;
  const brands = location.state?.brands as Brand[] | undefined;
  const gpsVerified = location.state?.gpsVerified as boolean | undefined;

  const [photos, setPhotos] = useState<BoardPhoto[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer || !brands) {
      console.error('Required data not provided');
      navigate('/field-marketing/select-customer');
      return;
    }
  }, [customer, brands, navigate]);

  const openCamera = (brand: Brand) => {
    setCurrentBrand(brand);
    setShowCamera(true);
  };

  const handlePhotoCapture = async (imageData: string, file: File) => {
    if (!currentBrand) return;

    const newPhoto: BoardPhoto = {
      id: `${currentBrand.id}-${Date.now()}`,
      brand_id: currentBrand.id,
      brand_name: currentBrand.brand_name,
      imageData,
      file,
      coverage: null,
      analyzing: true,
    };

    setPhotos((prev) => [...prev, newPhoto]);
    setShowCamera(false);
    setCurrentBrand(null);

    // Simulate coverage analysis
    // TODO: Implement actual image analysis with TensorFlow.js or backend API
    setTimeout(() => {
      analyzeCoverage(newPhoto.id);
    }, 2000);
  };

  const analyzeCoverage = async (photoId: string) => {
    try {
      // TODO: Implement actual coverage analysis
      // This should use TensorFlow.js or send to backend for analysis
      // For now, generate random coverage percentage between 10-90%
      const coveragePercentage = Math.floor(Math.random() * 80) + 10;

      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId
            ? { ...photo, coverage: coveragePercentage, analyzing: false }
            : photo
        )
      );
    } catch (err) {
      console.error('Error analyzing coverage:', err);
      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId ? { ...photo, analyzing: false } : photo
        )
      );
    }
  };

  const handleFileUpload = (brand: Brand, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      const newPhoto: BoardPhoto = {
        id: `${brand.id}-${Date.now()}`,
        brand_id: brand.id,
        brand_name: brand.brand_name,
        imageData,
        file,
        coverage: null,
        analyzing: true,
      };

      setPhotos((prev) => [...prev, newPhoto]);
      setTimeout(() => {
        analyzeCoverage(newPhoto.id);
      }, 2000);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleSubmit = async () => {
    if (photos.length === 0) {
      alert('Please capture at least one board photo');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // TODO: Upload photos to backend
      // const formData = new FormData();
      // photos.forEach((photo, index) => {
      //   formData.append(`photos[${index}]`, photo.file);
      //   formData.append(`photos[${index}][brand_id]`, photo.brand_id);
      //   formData.append(`photos[${index}][coverage]`, photo.coverage?.toString() || '0');
      // });
      // await fieldMarketingService.submitBoardInstallation(customerId, formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Navigate back to visit list
      navigate(`/field-marketing/visit-list/${customerId}`, {
        state: { customer, brands, gpsVerified },
      });
    } catch (err) {
      console.error('Error submitting board photos:', err);
      setError('Failed to submit photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/field-marketing/visit-list/${customerId}`, {
      state: { customer, brands, gpsVerified },
    });
  };

  const getCoverageColor = (coverage: number | null) => {
    if (coverage === null) return 'gray';
    if (coverage >= 70) return 'green';
    if (coverage >= 40) return 'yellow';
    return 'red';
  };

  const getCoverageLabel = (coverage: number | null) => {
    if (coverage === null) return 'Unknown';
    if (coverage >= 70) return 'Excellent';
    if (coverage >= 40) return 'Good';
    return 'Poor';
  };

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

  if (showCamera && currentBrand) {
    return (
      <CameraCapture
        title={`${currentBrand.brand_name} Board Photo`}
        description="Capture the board installation at the storefront"
        aspectRatio="landscape"
        onCapture={handlePhotoCapture}
        onCancel={() => {
          setShowCamera(false);
          setCurrentBrand(null);
        }}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Board Placement</h1>
        <p className="text-gray-600">
          Photograph brand boards at {customer.store_name}
        </p>
      </div>

      {/* Customer Info */}
      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-900">{customer.store_name}</h3>
        <p className="text-sm text-gray-600">{customer.owner_name}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Brand Photo Capture */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Capture Board Photos
        </h2>
        <div className="space-y-3">
          {brands.map((brand) => {
            const brandPhotos = photos.filter((p) => p.brand_id === brand.id);
            return (
              <div
                key={brand.id}
                className="p-4 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{brand.brand_name}</h3>
                    <p className="text-sm text-gray-600">
                      {brandPhotos.length} photo{brandPhotos.length !== 1 ? 's' : ''}{' '}
                      captured
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openCamera(brand)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Camera
                    </button>
                    <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer flex items-center text-sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(brand, e)}
                      />
                    </label>
                  </div>
                </div>

                {/* Photos Grid */}
                {brandPhotos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {brandPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden"
                      >
                        <img
                          src={photo.imageData}
                          alt={`${photo.brand_name} board`}
                          className="w-full h-full object-cover"
                        />

                        {/* Coverage Badge */}
                        {photo.analyzing ? (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded flex items-center">
                            <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full mr-1" />
                            Analyzing...
                          </div>
                        ) : photo.coverage !== null ? (
                          <div
                            className={`absolute top-2 left-2 px-2 py-1 text-white text-xs rounded flex items-center ${
                              getCoverageColor(photo.coverage) === 'green'
                                ? 'bg-green-600'
                                : getCoverageColor(photo.coverage) === 'yellow'
                                ? 'bg-yellow-600'
                                : 'bg-red-600'
                            }`}
                          >
                            <Percent className="w-3 h-3 mr-1" />
                            {photo.coverage}% {getCoverageLabel(photo.coverage)}
                          </div>
                        ) : null}

                        {/* Remove Button */}
                        <button
                          onClick={() => removePhoto(photo.id)}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Tips:</strong> Capture clear photos showing the entire board
          and surrounding storefront. The system will calculate the coverage
          percentage automatically.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleSubmit}
          disabled={photos.length === 0 || uploading || photos.some((p) => p.analyzing)}
          className={`w-full px-6 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors ${
            photos.length === 0 || uploading || photos.some((p) => p.analyzing)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {uploading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Complete Board Placement
            </>
          )}
        </button>

        <button
          onClick={handleCancel}
          disabled={uploading}
          className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

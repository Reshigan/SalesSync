'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FormField, FormInput, FormSelect, FormTextarea, FormFileUpload } from '@/components/ui/Form'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera,
  Save,
  Edit,
  Shield,
  Calendar,
  Globe,
  Building,
  Award,
  Clock
} from 'lucide-react'

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+234-801-234-5678',
    location: 'Lagos, Nigeria',
    department: 'Van Sales',
    role: 'Senior Sales Agent',
    manager: 'Sarah Wilson',
    employeeId: 'EMP-001',
    joinDate: '2024-01-15',
    bio: 'Experienced sales professional with 5+ years in field operations. Specializes in route optimization and customer relationship management.',
    timezone: 'Africa/Lagos',
    language: 'English',
    avatar: null,
  })

  const departments = [
    { value: 'van_sales', label: 'Van Sales' },
    { value: 'promotions', label: 'Promotions' },
    { value: 'merchandising', label: 'Merchandising' },
    { value: 'field_agents', label: 'Field Agents' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'back_office', label: 'Back Office' },
    { value: 'management', label: 'Management' },
  ]

  const timezones = [
    { value: 'Africa/Lagos', label: 'West Africa Time (WAT)' },
    { value: 'Africa/Cairo', label: 'Egypt Standard Time (EET)' },
    { value: 'Africa/Johannesburg', label: 'South Africa Standard Time (SAST)' },
    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
  ]

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'French' },
    { value: 'ar', label: 'Arabic' },
    { value: 'sw', label: 'Swahili' },
    { value: 'ha', label: 'Hausa' },
    { value: 'yo', label: 'Yoruba' },
    { value: 'ig', label: 'Igbo' },
  ]

  const handleSave = () => {
    // Save profile data
    setIsEditing(false)
    // Show success message
  }

  const handleCancel = () => {
    // Reset form data
    setIsEditing(false)
  }

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600">Manage your personal information and preferences</p>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="col-span-1">
            <Card>
              <Card.Content className="p-6">
                <div className="text-center">
                  {/* Avatar */}
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-primary-600">
                        {profileData.firstName[0]}{profileData.lastName[0]}
                      </span>
                    </div>
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700">
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-gray-900">
                    {profileData.firstName} {profileData.lastName}
                  </h2>
                  <p className="text-gray-600 mb-2">{profileData.role}</p>
                  <p className="text-sm text-gray-500 mb-4">{profileData.department}</p>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">Joined</p>
                      <p className="text-xs text-gray-500">{profileData.joinDate}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Award className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">Level</p>
                      <p className="text-xs text-gray-500">Senior</p>
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Quick Info */}
            <Card className="mt-6">
              <Card.Header>
                <h3 className="text-lg font-semibold">Quick Info</h3>
              </Card.Header>
              <Card.Content className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-500">{profileData.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-500">{profileData.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Location</p>
                    <p className="text-sm text-gray-500">{profileData.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Employee ID</p>
                    <p className="text-sm text-gray-500">{profileData.employeeId}</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Profile Form */}
          <div className="col-span-2">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold">Personal Information</h3>
              </Card.Header>
              <Card.Content>
                <form className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="First Name" required>
                        <FormInput
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                          disabled={!isEditing}
                        />
                      </FormField>
                      <FormField label="Last Name" required>
                        <FormInput
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                          disabled={!isEditing}
                        />
                      </FormField>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <FormField label="Email Address" required>
                        <FormInput
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          disabled={!isEditing}
                          icon={<Mail className="w-4 h-4" />}
                        />
                      </FormField>
                      <FormField label="Phone Number" required>
                        <FormInput
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          disabled={!isEditing}
                          icon={<Phone className="w-4 h-4" />}
                        />
                      </FormField>
                    </div>

                    <div className="mt-4">
                      <FormField label="Location">
                        <FormInput
                          value={profileData.location}
                          onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                          disabled={!isEditing}
                          icon={<MapPin className="w-4 h-4" />}
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Work Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Work Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Department">
                        <FormSelect
                          options={departments}
                          value={profileData.department.toLowerCase().replace(' ', '_')}
                          onChange={(e) => setProfileData({...profileData, department: e.target.value})}
                          disabled={!isEditing}
                        />
                      </FormField>
                      <FormField label="Role">
                        <FormInput
                          value={profileData.role}
                          onChange={(e) => setProfileData({...profileData, role: e.target.value})}
                          disabled={!isEditing}
                          icon={<Shield className="w-4 h-4" />}
                        />
                      </FormField>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <FormField label="Manager">
                        <FormInput
                          value={profileData.manager}
                          onChange={(e) => setProfileData({...profileData, manager: e.target.value})}
                          disabled={!isEditing}
                          icon={<User className="w-4 h-4" />}
                        />
                      </FormField>
                      <FormField label="Employee ID">
                        <FormInput
                          value={profileData.employeeId}
                          disabled={true}
                          icon={<Building className="w-4 h-4" />}
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Preferences</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Timezone">
                        <FormSelect
                          options={timezones}
                          value={profileData.timezone}
                          onChange={(e) => setProfileData({...profileData, timezone: e.target.value})}
                          disabled={!isEditing}
                        />
                      </FormField>
                      <FormField label="Language">
                        <FormSelect
                          options={languages}
                          value={profileData.language.toLowerCase()}
                          onChange={(e) => setProfileData({...profileData, language: e.target.value})}
                          disabled={!isEditing}
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <FormField label="Bio">
                      <FormTextarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        disabled={!isEditing}
                        rows={4}
                        placeholder="Tell us about yourself..."
                      />
                    </FormField>
                  </div>

                  {/* Profile Picture Upload */}
                  {isEditing && (
                    <div>
                      <FormField label="Profile Picture">
                        <FormFileUpload
                          accept="image/*"
                          label="Upload new profile picture"
                          description="JPG, PNG or GIF. Max size 2MB."
                        />
                      </FormField>
                    </div>
                  )}
                </form>
              </Card.Content>
            </Card>

            {/* Activity Summary */}
            <Card className="mt-6">
              <Card.Header>
                <h3 className="text-lg font-semibold">Recent Activity</h3>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Last Login</p>
                      <p className="text-xs text-gray-500">Today at 9:30 AM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Edit className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Profile Updated</p>
                      <p className="text-xs text-gray-500">3 days ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Password Changed</p>
                      <p className="text-xs text-gray-500">1 week ago</p>
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>)
}
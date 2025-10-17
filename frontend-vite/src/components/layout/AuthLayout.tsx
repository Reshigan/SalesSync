import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and branding */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">SS</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            SalesSync
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Field Force Management Platform
          </p>
        </div>

        {/* Auth form container */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>&copy; 2024 SalesSync. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
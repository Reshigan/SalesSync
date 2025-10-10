'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  UserGroupIcon, 
  MapPinIcon, 
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  RectangleStackIcon,
  UsersIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  showNotifications?: boolean;
  showSettings?: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  color: string;
}

const navItems: NavItem[] = [
  { name: 'Home', href: '/field-agents', icon: HomeIcon, color: 'text-blue-600' },
  { name: 'Agents', href: '/field-agents/agents', icon: UserGroupIcon, color: 'text-green-600' },
  { name: 'Visits', href: '/field-agents/visits', icon: MapPinIcon, color: 'text-purple-600' },
  { name: 'Products', href: '/field-agents/product-distribution', icon: ClipboardDocumentListIcon, color: 'text-orange-600' },
  { name: 'Commission', href: '/field-agents/commissions', icon: CurrencyDollarIcon, color: 'text-emerald-600' },
  { name: 'Boards', href: '/field-agents/boards', icon: RectangleStackIcon, color: 'text-indigo-600' },
  { name: 'Customers', href: '/field-agents/customers', icon: UsersIcon, color: 'text-rose-600' }
];

export default function MobileLayout({ 
  children, 
  title, 
  showBackButton = false,
  showNotifications = true,
  showSettings = true
}: MobileLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get current page info
  const getCurrentPageInfo = () => {
    const currentItem = navItems.find(item => pathname === item.href);
    return currentItem || { name: title || 'Field Agents', color: 'text-blue-600' };
  };

  const currentPage = getCurrentPageInfo();

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMenuOpen(false);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showBackButton ? (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 touch-manipulation"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 touch-manipulation"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
            )}
            
            <div>
              <h1 className={`text-lg font-semibold ${currentPage.color}`}>
                {currentPage.name}
              </h1>
              {!isOnline && (
                <p className="text-xs text-red-500">Offline Mode</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {showNotifications && (
              <button className="p-2 rounded-lg hover:bg-gray-100 touch-manipulation relative">
                <BellIcon className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
            )}
            
            {showSettings && (
              <button className="p-2 rounded-lg hover:bg-gray-100 touch-manipulation">
                <Cog6ToothIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mobile-content">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <div className="flex justify-around">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`mobile-nav-item ${
                  isActive 
                    ? `${item.color} bg-blue-50` 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Side Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMenuOpen(false)}
          />
          
          <div className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 touch-manipulation"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-xl text-left touch-manipulation ${
                        isActive 
                          ? `${item.color} bg-blue-50` 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="space-y-2">
                  <button className="w-full flex items-center space-x-3 p-3 rounded-xl text-left text-gray-700 hover:bg-gray-100 touch-manipulation">
                    <Cog6ToothIcon className="w-6 h-6" />
                    <span className="font-medium">Settings</span>
                  </button>
                  
                  <button className="w-full flex items-center space-x-3 p-3 rounded-xl text-left text-red-600 hover:bg-red-50 touch-manipulation">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
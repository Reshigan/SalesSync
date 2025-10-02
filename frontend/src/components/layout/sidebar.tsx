'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard,
  Truck,
  Megaphone,
  Store,
  MapPin,
  Package,
  DollarSign,
  Users,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Van Sales',
    icon: Truck,
    children: [
      { title: 'Dashboard', href: '/van-sales', icon: LayoutDashboard },
      { title: 'Manage Vans', href: '/van-sales/vans', icon: Truck },
      { title: 'Van Loads', href: '/van-sales/loads', icon: Package },
      { title: 'Reconciliation', href: '/van-sales/reconciliation', icon: DollarSign },
    ],
  },
  {
    title: 'Promotions',
    icon: Megaphone,
    children: [
      { title: 'Dashboard', href: '/promotions', icon: LayoutDashboard },
      { title: 'Campaigns', href: '/promotions/campaigns', icon: Megaphone },
      { title: 'Activities', href: '/promotions/activities', icon: Users },
      { title: 'Performance', href: '/promotions/performance', icon: DollarSign },
    ],
  },
  {
    title: 'Merchandising',
    icon: Store,
    children: [
      { title: 'Dashboard', href: '/merchandising', icon: LayoutDashboard },
      { title: 'Store Visits', href: '/merchandising/visits', icon: Store },
      { title: 'Compliance', href: '/merchandising/compliance', icon: Settings },
      { title: 'Photo Gallery', href: '/merchandising/photos', icon: Package },
    ],
  },
  {
    title: 'Field Marketing',
    icon: MapPin,
    children: [
      { title: 'Dashboard', href: '/field-marketing', icon: LayoutDashboard },
      { title: 'Agents', href: '/field-marketing/agents', icon: Users },
      { title: 'Activities', href: '/field-marketing/activities', icon: MapPin },
      { title: 'KYC Management', href: '/field-marketing/kyc', icon: Settings },
    ],
  },
  {
    title: 'Inventory',
    icon: Package,
    children: [
      { title: 'Dashboard', href: '/inventory', icon: LayoutDashboard },
      { title: 'Stock Levels', href: '/inventory/stock', icon: Package },
      { title: 'Warehouses', href: '/inventory/warehouses', icon: Store },
      { title: 'Transfers', href: '/inventory/transfers', icon: Truck },
      { title: 'Movements', href: '/inventory/movements', icon: Settings },
    ],
  },
  {
    title: 'Commissions',
    icon: DollarSign,
    children: [
      { title: 'Dashboard', href: '/commissions', icon: LayoutDashboard },
      { title: 'Structures', href: '/commissions/structures', icon: Settings },
      { title: 'Records', href: '/commissions/records', icon: DollarSign },
      { title: 'Payments', href: '/commissions/payments', icon: Package },
    ],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const isParentActive = (children: NavItem[]) => {
    return children.some(child => child.href && isActive(child.href));
  };

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
        <h1 className="text-xl font-bold text-white">SalesSync</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => (
          <div key={item.title}>
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleExpanded(item.title)}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isParentActive(item.children)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.title}
                  </div>
                  {expandedItems.includes(item.title) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                {expandedItems.includes(item.title) && (
                  <div className="mt-2 ml-6 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.title}
                        href={child.href!}
                        className={cn(
                          'flex items-center px-3 py-2 text-sm rounded-lg transition-colors',
                          isActive(child.href!)
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        <child.icon className="w-4 h-4 mr-3" />
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href!}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive(item.href!)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.title}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">A</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Admin User</p>
            <p className="text-xs text-gray-500">admin@demo.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
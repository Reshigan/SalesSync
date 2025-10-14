import React, { useState } from 'react';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useBreakpoint } from '@/hooks/use-mobile';

interface MobileNavItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: MobileNavItem[];
}

interface MobileNavigationProps {
  items: MobileNavItem[];
  onItemClick?: (item: MobileNavItem) => void;
  className?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  onItemClick,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { isMobile } = useBreakpoint();

  const toggleExpanded = (label: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemClick = (item: MobileNavItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
    if (!item.children) {
      setIsOpen(false);
    }
  };

  const renderNavItem = (item: MobileNavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const paddingLeft = level * 16 + 16;

    return (
      <div key={item.label}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.label);
            } else {
              handleItemClick(item);
            }
          }}
          className={`w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-50 transition-colors`}
          style={{ paddingLeft }}
        >
          <div className="flex items-center space-x-3">
            {item.icon}
            <span className="font-medium text-gray-900">{item.label}</span>
          </div>
          {hasChildren && (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          )}
        </button>
        
        {hasChildren && isExpanded && (
          <div className="bg-gray-50">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 ${className}`}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsOpen(false)} />
          
          <div className="fixed top-0 left-0 bottom-0 w-full max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-full pb-20">
              {items.map(item => renderNavItem(item))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Responsive grid component
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  cols?: { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number;
  className?: string;
}> = ({ 
  children, 
  cols = { sm: 1, md: 2, lg: 3, xl: 4 }, 
  gap = 4,
  className = '' 
}) => {
  const gridCols = [
    cols.sm && `grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`
  ].filter(Boolean).join(' ');

  return (
    <div className={`grid ${gridCols} gap-${gap} ${className}`}>
      {children}
    </div>
  );
};

// Touch-friendly button component
export const TouchButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  disabled = false
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};
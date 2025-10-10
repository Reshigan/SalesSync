#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📱 Creating mobile responsive utilities and components...\n');

// Mobile responsive hook
const mobileHookContent = `'use client'

import { useState, useEffect } from 'react';

export interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const defaultBreakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export const useBreakpoint = (breakpoints: BreakpointConfig = defaultBreakpoints) => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isSm = windowSize.width >= breakpoints.sm;
  const isMd = windowSize.width >= breakpoints.md;
  const isLg = windowSize.width >= breakpoints.lg;
  const isXl = windowSize.width >= breakpoints.xl;
  const is2Xl = windowSize.width >= breakpoints['2xl'];

  const isMobile = windowSize.width < breakpoints.md;
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg;
  const isDesktop = windowSize.width >= breakpoints.lg;

  return {
    windowSize,
    breakpoints: {
      sm: isSm,
      md: isMd,
      lg: isLg,
      xl: isXl,
      '2xl': is2Xl
    },
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint: is2Xl ? '2xl' : isXl ? 'xl' : isLg ? 'lg' : isMd ? 'md' : isSm ? 'sm' : 'xs'
  };
};

export const useTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkTouchDevice();
    window.addEventListener('touchstart', checkTouchDevice, { once: true });
    
    return () => {
      window.removeEventListener('touchstart', checkTouchDevice);
    };
  }, []);

  return isTouchDevice;
};`;

// Mobile navigation component
const mobileNavContent = `import React, { useState } from 'react';
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
          className={\`w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-50 transition-colors\`}
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
        className={\`p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 \${className}\`}
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
    cols.sm && \`grid-cols-\${cols.sm}\`,
    cols.md && \`md:grid-cols-\${cols.md}\`,
    cols.lg && \`lg:grid-cols-\${cols.lg}\`,
    cols.xl && \`xl:grid-cols-\${cols.xl}\`
  ].filter(Boolean).join(' ');

  return (
    <div className={\`grid \${gridCols} gap-\${gap} \${className}\`}>
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
      className={\`\${baseClasses} \${variantClasses[variant]} \${sizeClasses[size]} \${className}\`}
    >
      {children}
    </button>
  );
};`;

// Mobile-specific utilities
const mobileUtilsContent = `export const mobileUtils = {
  // Prevent zoom on input focus (iOS)
  preventZoom: () => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    }
  },

  // Enable zoom back
  enableZoom: () => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1');
    }
  },

  // Check if device is iOS
  isIOS: () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  // Check if device is Android
  isAndroid: () => {
    return /Android/.test(navigator.userAgent);
  },

  // Get safe area insets for devices with notches
  getSafeAreaInsets: () => {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('--sat') || '0'),
      right: parseInt(style.getPropertyValue('--sar') || '0'),
      bottom: parseInt(style.getPropertyValue('--sab') || '0'),
      left: parseInt(style.getPropertyValue('--sal') || '0')
    };
  },

  // Vibrate device (if supported)
  vibrate: (pattern: number | number[] = 200) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },

  // Share content using Web Share API
  share: async (data: { title?: string; text?: string; url?: string }) => {
    if ('share' in navigator) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Error sharing:', error);
        return false;
      }
    }
    return false;
  }
};

// CSS classes for mobile-specific styling
export const mobileClasses = {
  // Touch-friendly sizing
  touchTarget: 'min-h-[44px] min-w-[44px]',
  
  // Safe area padding
  safeAreaTop: 'pt-safe-top',
  safeAreaBottom: 'pb-safe-bottom',
  safeAreaLeft: 'pl-safe-left',
  safeAreaRight: 'pr-safe-right',
  
  // Hide scrollbars on mobile
  hideScrollbar: 'scrollbar-hide',
  
  // Prevent text selection
  noSelect: 'select-none',
  
  // Smooth scrolling
  smoothScroll: 'scroll-smooth',
  
  // Full height minus safe areas
  fullHeightSafe: 'h-screen-safe'
};`;

// Create directories
const hooksDir = path.join(__dirname, 'frontend/src/hooks');
const componentsDir = path.join(__dirname, 'frontend/src/components/ui');
const utilsDir = path.join(__dirname, 'frontend/src/utils');

[hooksDir, componentsDir, utilsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Write files
fs.writeFileSync(path.join(hooksDir, 'use-mobile.ts'), mobileHookContent);
fs.writeFileSync(path.join(componentsDir, 'mobile-nav.tsx'), mobileNavContent);
fs.writeFileSync(path.join(utilsDir, 'mobile.ts'), mobileUtilsContent);

console.log('✅ Created mobile responsive hooks');
console.log('✅ Created mobile navigation component');
console.log('✅ Created touch-friendly components');
console.log('✅ Created mobile utilities');
console.log('\n🎉 Mobile responsiveness implemented!');
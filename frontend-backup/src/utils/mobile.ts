export const mobileUtils = {
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
};
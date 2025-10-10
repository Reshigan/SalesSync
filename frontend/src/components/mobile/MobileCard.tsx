'use client';

import React from 'react';

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  swipeable?: boolean;
  elevation?: 'low' | 'medium' | 'high';
}

export default function MobileCard({ 
  children, 
  className = '', 
  onClick,
  swipeable = false,
  elevation = 'low'
}: MobileCardProps) {
  const elevationClasses = {
    low: 'shadow-sm',
    medium: 'shadow-md',
    high: 'shadow-lg'
  };

  const baseClasses = `
    mobile-card 
    ${elevationClasses[elevation]}
    ${onClick ? 'cursor-pointer touch-active' : ''}
    ${swipeable ? 'swipeable' : ''}
    ${className}
  `;

  return (
    <div 
      className={baseClasses}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
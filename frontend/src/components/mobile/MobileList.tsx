'use client';

import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface MobileListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightText?: string;
  badge?: {
    text: string;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  };
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

interface MobileListProps {
  children: React.ReactNode;
  className?: string;
  divided?: boolean;
}

export function MobileListItem({
  title,
  subtitle,
  description,
  icon,
  rightIcon,
  rightText,
  badge,
  onClick,
  disabled = false,
  className = ''
}: MobileListItemProps) {
  const badgeColors = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800'
  };

  const itemClasses = `
    flex items-center p-4 touch-manipulation
    ${onClick && !disabled ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  const handleClick = () => {
    if (onClick && !disabled) {
      onClick();
    }
  };

  return (
    <div className={itemClasses} onClick={handleClick}>
      {icon && (
        <div className="flex-shrink-0 mr-4">
          {icon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-900 truncate">
            {title}
          </h3>
          
          {badge && (
            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${badgeColors[badge.color]}`}>
              {badge.text}
            </span>
          )}
          
          {rightText && (
            <span className="ml-2 text-sm text-gray-500">
              {rightText}
            </span>
          )}
        </div>
        
        {subtitle && (
          <p className="text-sm text-gray-600 truncate mt-1">
            {subtitle}
          </p>
        )}
        
        {description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {description}
          </p>
        )}
      </div>
      
      {(rightIcon || onClick) && (
        <div className="flex-shrink-0 ml-4">
          {rightIcon || <ChevronRightIcon className="w-5 h-5 text-gray-400" />}
        </div>
      )}
    </div>
  );
}

export default function MobileList({ 
  children, 
  className = '',
  divided = true 
}: MobileListProps) {
  const listClasses = `
    bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden
    ${divided ? 'divide-y divide-gray-100' : ''}
    ${className}
  `.trim();

  return (
    <div className={listClasses}>
      {children}
    </div>
  );
}
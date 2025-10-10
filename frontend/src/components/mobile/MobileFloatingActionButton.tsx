'use client';

import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

interface FloatingAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

interface MobileFloatingActionButtonProps {
  icon?: React.ReactNode;
  onClick?: () => void;
  actions?: FloatingAction[];
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export default function MobileFloatingActionButton({
  icon = <PlusIcon className="w-6 h-6" />,
  onClick,
  actions = [],
  color = 'bg-blue-600 hover:bg-blue-700',
  size = 'md',
  position = 'bottom-right'
}: MobileFloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2'
  };

  const handleMainClick = () => {
    if (actions.length > 0) {
      setIsExpanded(!isExpanded);
    } else if (onClick) {
      onClick();
    }
  };

  const handleActionClick = (action: FloatingAction) => {
    action.onClick();
    setIsExpanded(false);
  };

  return (
    <>
      {/* Backdrop for expanded state */}
      {isExpanded && actions.length > 0 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Action buttons */}
      {isExpanded && actions.length > 0 && (
        <div className={`fixed ${positionClasses[position]} z-50 flex flex-col-reverse space-y-reverse space-y-3 mb-20`}>
          {actions.map((action, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
                {action.label}
              </div>
              <button
                onClick={() => handleActionClick(action)}
                className={`
                  ${sizeClasses.sm} ${action.color || 'bg-white'} text-gray-700 rounded-full shadow-lg 
                  hover:shadow-xl transition-all duration-200 touch-manipulation
                  flex items-center justify-center
                `}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={handleMainClick}
        className={`
          fixed ${positionClasses[position]} ${sizeClasses[size]} ${color} text-white 
          rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 
          touch-manipulation flex items-center justify-center
          ${isExpanded ? 'rotate-45' : 'rotate-0'}
        `}
      >
        {icon}
      </button>
    </>
  );
}
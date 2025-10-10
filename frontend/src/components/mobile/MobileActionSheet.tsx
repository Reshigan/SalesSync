'use client';

import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ActionSheetAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actions: ActionSheetAction[];
  cancelLabel?: string;
}

export default function MobileActionSheet({
  isOpen,
  onClose,
  title,
  description,
  actions,
  cancelLabel = 'Cancel'
}: MobileActionSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleActionClick = (action: ActionSheetAction) => {
    if (!action.disabled) {
      action.onClick();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Action Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-xl transform transition-transform">
        <div className="p-6">
          {/* Header */}
          {(title || description) && (
            <div className="text-center mb-6">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm text-gray-600">
                  {description}
                </p>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="space-y-3">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action)}
                disabled={action.disabled}
                className={`
                  w-full flex items-center justify-center space-x-3 p-4 rounded-xl font-medium text-lg min-h-[56px] touch-manipulation transition-colors
                  ${action.destructive 
                    ? 'text-red-600 hover:bg-red-50 active:bg-red-100' 
                    : 'text-gray-900 hover:bg-gray-50 active:bg-gray-100'
                  }
                  ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {action.icon && (
                  <span className="w-6 h-6">
                    {action.icon}
                  </span>
                )}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
          
          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full mt-6 p-4 bg-gray-100 text-gray-900 font-medium text-lg rounded-xl min-h-[56px] touch-manipulation hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
        
        {/* Handle */}
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full" />
      </div>
    </div>
  );
}
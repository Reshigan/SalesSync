import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: any;
  error?: string;
  touched?: boolean;
  required?: boolean;
  placeholder?: string;
  onChange: (name: string, value: any) => void;
  onBlur: (name: string) => void;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  error,
  touched,
  required,
  placeholder,
  onChange,
  onBlur,
  className = ''
}) => {
  const hasError = touched && error;

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        id={name}
        name={name}
        type={type}
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur(name)}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${hasError 
            ? 'border-red-300 text-red-900 placeholder-red-300' 
            : 'border-gray-300 text-gray-900 placeholder-gray-400'
          }
        `}
      />
      
      {hasError && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

interface FormSelectProps {
  label: string;
  name: string;
  value: any;
  options: { value: string | number; label: string }[];
  error?: string;
  touched?: boolean;
  required?: boolean;
  placeholder?: string;
  onChange: (name: string, value: any) => void;
  onBlur: (name: string) => void;
  className?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  name,
  value,
  options,
  error,
  touched,
  required,
  placeholder = 'Select an option',
  onChange,
  onBlur,
  className = ''
}) => {
  const hasError = touched && error;

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <select
        id={name}
        name={name}
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur(name)}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${hasError 
            ? 'border-red-300 text-red-900' 
            : 'border-gray-300 text-gray-900'
          }
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {hasError && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

interface FormTextareaProps {
  label: string;
  name: string;
  value: any;
  error?: string;
  touched?: boolean;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  onChange: (name: string, value: any) => void;
  onBlur: (name: string) => void;
  className?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  name,
  value,
  error,
  touched,
  required,
  placeholder,
  rows = 3,
  onChange,
  onBlur,
  className = ''
}) => {
  const hasError = touched && error;

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur(name)}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${hasError 
            ? 'border-red-300 text-red-900 placeholder-red-300' 
            : 'border-gray-300 text-gray-900 placeholder-gray-400'
          }
        `}
      />
      
      {hasError && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

interface FormCheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  error?: string;
  touched?: boolean;
  onChange: (name: string, value: boolean) => void;
  onBlur: (name: string) => void;
  className?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label,
  name,
  checked,
  error,
  touched,
  onChange,
  onBlur,
  className = ''
}) => {
  const hasError = touched && error;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(name, e.target.checked)}
          onBlur={() => onBlur(name)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
          {label}
        </label>
      </div>
      
      {hasError && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
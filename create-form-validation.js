#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📝 Creating comprehensive form validation system...\n');

// Form validation hook
const formValidationHookContent = `'use client'

import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface FormErrors {
  [key: string]: string;
}

export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationSchema: ValidationSchema
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((name: string, value: any): string | null => {
    const rule = validationSchema[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return \`\${name} is required\`;
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return \`\${name} must be at least \${rule.minLength} characters\`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return \`\${name} must be no more than \${rule.maxLength} characters\`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return \`\${name} format is invalid\`;
      }
      if (rule.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      if (rule.phone && !/^[\\+]?[1-9][\\d\\s\\-\\(\\)]{7,15}$/.test(value)) {
        return 'Please enter a valid phone number';
      }
      if (rule.url && !/^https?:\\/\\/.+/.test(value)) {
        return 'Please enter a valid URL';
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return \`\${name} must be at least \${rule.min}\`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return \`\${name} must be no more than \${rule.max}\`;
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [validationSchema]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(validationSchema).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField, validationSchema]);

  const handleChange = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error || '' }));
  }, [values, validateField]);

  const handleSubmit = useCallback(async (onSubmit: (values: T) => Promise<void> | void) => {
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const allTouched = Object.keys(validationSchema).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    if (validateForm()) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
  }, [values, validateForm, validationSchema]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldValue = useCallback((name: string, value: any) => {
    handleChange(name, value);
  }, [handleChange]);

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validateForm,
    reset,
    setFieldValue,
    setFieldError,
    isValid: Object.keys(errors).length === 0
  };
};`;

// Form components with validation
const formComponentsContent = `import React from 'react';
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
    <div className={\`space-y-1 \${className}\`}>
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
        className={\`
          block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          \${hasError 
            ? 'border-red-300 text-red-900 placeholder-red-300' 
            : 'border-gray-300 text-gray-900 placeholder-gray-400'
          }
        \`}
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
    <div className={\`space-y-1 \${className}\`}>
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
        className={\`
          block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          \${hasError 
            ? 'border-red-300 text-red-900' 
            : 'border-gray-300 text-gray-900'
          }
        \`}
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
    <div className={\`space-y-1 \${className}\`}>
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
        className={\`
          block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          \${hasError 
            ? 'border-red-300 text-red-900 placeholder-red-300' 
            : 'border-gray-300 text-gray-900 placeholder-gray-400'
          }
        \`}
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
    <div className={\`space-y-1 \${className}\`}>
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
};`;

// Validation schemas for common forms
const validationSchemasContent = `import { ValidationSchema } from '@/hooks/use-form-validation';

// User validation schema
export const userValidationSchema: ValidationSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50
  },
  email: {
    required: true,
    email: true
  },
  phone: {
    phone: true
  },
  role: {
    required: true
  }
};

// Product validation schema
export const productValidationSchema: ValidationSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  sku: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[A-Z0-9-]+$/
  },
  price: {
    required: true,
    min: 0
  },
  categoryId: {
    required: true
  },
  description: {
    maxLength: 500
  }
};

// Customer validation schema
export const customerValidationSchema: ValidationSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  email: {
    email: true
  },
  phone: {
    required: true,
    phone: true
  },
  address: {
    required: true,
    minLength: 10,
    maxLength: 200
  },
  city: {
    required: true,
    minLength: 2,
    maxLength: 50
  },
  postalCode: {
    required: true,
    pattern: /^[0-9]{5,10}$/
  }
};

// Order validation schema
export const orderValidationSchema: ValidationSchema = {
  customerId: {
    required: true
  },
  items: {
    required: true,
    custom: (items) => {
      if (!Array.isArray(items) || items.length === 0) {
        return 'At least one item is required';
      }
      return null;
    }
  },
  deliveryDate: {
    required: true,
    custom: (date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        return 'Delivery date cannot be in the past';
      }
      return null;
    }
  }
};

// Login validation schema
export const loginValidationSchema: ValidationSchema = {
  email: {
    required: true,
    email: true
  },
  password: {
    required: true,
    minLength: 6
  }
};

// Registration validation schema
export const registrationValidationSchema: ValidationSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50
  },
  email: {
    required: true,
    email: true
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]/,
    custom: (password) => {
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]/.test(password)) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
      }
      return null;
    }
  },
  confirmPassword: {
    required: true,
    custom: (confirmPassword, values) => {
      if (confirmPassword !== values?.password) {
        return 'Passwords do not match';
      }
      return null;
    }
  }
};

// Inventory validation schema
export const inventoryValidationSchema: ValidationSchema = {
  productId: {
    required: true
  },
  quantity: {
    required: true,
    min: 0
  },
  minStock: {
    required: true,
    min: 0
  },
  maxStock: {
    required: true,
    min: 1,
    custom: (maxStock, values) => {
      if (values?.minStock && maxStock <= values.minStock) {
        return 'Maximum stock must be greater than minimum stock';
      }
      return null;
    }
  },
  location: {
    required: true,
    minLength: 2,
    maxLength: 50
  }
};`;

// Create directories
const hooksDir = path.join(__dirname, 'frontend/src/hooks');
const componentsDir = path.join(__dirname, 'frontend/src/components/forms');
const utilsDir = path.join(__dirname, 'frontend/src/utils');

[hooksDir, componentsDir, utilsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Write files
fs.writeFileSync(path.join(hooksDir, 'use-form-validation.ts'), formValidationHookContent);
fs.writeFileSync(path.join(componentsDir, 'form-fields.tsx'), formComponentsContent);
fs.writeFileSync(path.join(utilsDir, 'validation-schemas.ts'), validationSchemasContent);

console.log('✅ Created form validation hook');
console.log('✅ Created form field components with validation');
console.log('✅ Created validation schemas for common forms');
console.log('✅ Added comprehensive validation rules');
console.log('\n🎉 Form validation system implemented!');
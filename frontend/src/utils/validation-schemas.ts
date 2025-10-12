import { ValidationSchema } from '@/hooks/use-form-validation';

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
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    custom: (password) => {
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
      }
      return null;
    }
  },
  confirmPassword: {
    required: true,
    custom: (confirmPassword) => {
      // Note: Password matching validation should be handled at form level
      // This is just basic validation for the field itself
      if (!confirmPassword || confirmPassword.length < 1) {
        return 'Please confirm your password';
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
    custom: (maxStock) => {
      // Note: Min/Max stock comparison should be handled at form level
      if (!maxStock || maxStock < 1) {
        return 'Maximum stock must be at least 1';
      }
      return null;
    }
  },
  location: {
    required: true,
    minLength: 2,
    maxLength: 50
  }
};
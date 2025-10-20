const validator = require('validator');
const xss = require('xss');

// Sanitize input data
function sanitizeInput(data) {
  if (typeof data === 'string') {
    return xss(data.trim());
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return data;
}

// Validate email format
function validateEmail(email) {
  return validator.isEmail(email);
}

// Validate phone number (South African format)
function validatePhone(phone) {
  const saPhoneRegex = /^(\+27|0)[0-9]{9}$/;
  return saPhoneRegex.test(phone.replace(/\s/g, ''));
}

// Validate password strength
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
    requirements: {
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    }
  };
}

// Validate South African ID number
function validateSAIdNumber(idNumber) {
  if (!/^\d{13}$/.test(idNumber)) {
    return false;
  }
  
  // Luhn algorithm check
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    let digit = parseInt(idNumber[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    sum += digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(idNumber[12]);
}

// Validate currency amount
function validateCurrency(amount) {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount >= 0 && numAmount <= 999999999.99;
}

// Validate date format
function validateDate(date) {
  return validator.isISO8601(date);
}

// Validate coordinates
function validateCoordinates(lat, lng) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  return !isNaN(latitude) && !isNaN(longitude) &&
         latitude >= -90 && latitude <= 90 &&
         longitude >= -180 && longitude <= 180;
}

// Input validation middleware
function validateInput(schema) {
  return (req, res, next) => {
    const errors = [];
    
    // Sanitize all input data
    req.body = sanitizeInput(req.body);
    req.query = sanitizeInput(req.query);
    req.params = sanitizeInput(req.params);
    
    // Validate based on schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field] || req.query[field] || req.params[field];
      
      // Check required fields
      if (rules.required && (!value || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }
      
      // Skip validation if field is not required and empty
      if (!rules.required && (!value || value === '')) {
        continue;
      }
      
      // Type validation
      if (rules.type) {
        switch (rules.type) {
          case 'email':
            if (!validateEmail(value)) {
              errors.push(`${field} must be a valid email address`);
            }
            break;
            
          case 'phone':
            if (!validatePhone(value)) {
              errors.push(`${field} must be a valid South African phone number`);
            }
            break;
            
          case 'password':
            const passwordValidation = validatePassword(value);
            if (!passwordValidation.isValid) {
              errors.push(`${field} must be at least 8 characters with uppercase, lowercase, and numbers`);
            }
            break;
            
          case 'currency':
            if (!validateCurrency(value)) {
              errors.push(`${field} must be a valid currency amount`);
            }
            break;
            
          case 'date':
            if (!validateDate(value)) {
              errors.push(`${field} must be a valid ISO date`);
            }
            break;
            
          case 'id_number':
            if (!validateSAIdNumber(value)) {
              errors.push(`${field} must be a valid South African ID number`);
            }
            break;
            
          case 'coordinates':
            if (rules.lat && rules.lng) {
              const lat = req.body[rules.lat] || req.query[rules.lat];
              const lng = req.body[rules.lng] || req.query[rules.lng];
              if (!validateCoordinates(lat, lng)) {
                errors.push(`${field} coordinates are invalid`);
              }
            }
            break;
        }
      }
      
      // Length validation
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters long`);
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters long`);
      }
      
      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
      
      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
}

// Common validation schemas
const schemas = {
  login: {
    email: { required: true, type: 'email' },
    password: { required: true, minLength: 1 }
  },
  
  register: {
    email: { required: true, type: 'email' },
    password: { required: true, type: 'password' },
    name: { required: true, minLength: 2, maxLength: 100 },
    phone: { required: false, type: 'phone' }
  },
  
  customer: {
    name: { required: true, minLength: 2, maxLength: 100 },
    email: { required: false, type: 'email' },
    phone: { required: false, type: 'phone' },
    business_type: { required: false, enum: ['retail', 'wholesale', 'distributor', 'other'] },
    credit_limit: { required: false, type: 'currency' }
  },
  
  product: {
    name: { required: true, minLength: 2, maxLength: 200 },
    sku: { required: true, minLength: 1, maxLength: 50 },
    price: { required: true, type: 'currency' },
    category: { required: false, maxLength: 100 }
  },
  
  visit: {
    customer_id: { required: true, pattern: /^\d+$/ },
    latitude: { required: true },
    longitude: { required: true },
    visit_type: { required: true, enum: ['sales', 'delivery', 'collection', 'survey', 'other'] }
  }
};

module.exports = {
  validateInput,
  schemas,
  sanitizeInput,
  validateEmail,
  validatePhone,
  validatePassword,
  validateSAIdNumber,
  validateCurrency,
  validateDate,
  validateCoordinates
};
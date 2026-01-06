// Validation utilities for forms

export const validators = {
  required: (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required';
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  },

  password: (value) => {
    if (!value) return null;
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(value) || !/[a-z]/.test(value)) {
      return 'Password must contain uppercase and lowercase letters';
    }
    if (!/\d/.test(value)) {
      return 'Password must contain at least one number';
    }
    return null;
  },

  confirmPassword: (password) => (value) => {
    if (!value) return null;
    if (value !== password) {
      return 'Passwords do not match';
    }
    return null;
  },

  username: (value) => {
    if (!value) return null;
    if (value.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^\+?[\d\s-]{8,}$/;
    if (!phoneRegex.test(value)) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  numeric: (value) => {
    if (!value) return null;
    if (!/^\d+$/.test(value)) {
      return 'Must be a number';
    }
    return null;
  },

  range: (min, max) => (value) => {
    if (!value) return null;
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
      return `Must be between ${min} and ${max}`;
    }
    return null;
  },
};

// Validate form data against rules
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    const ruleArray = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

    for (const rule of ruleArray) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        isValid = false;
        break;
      }
    }
  }

  return { isValid, errors };
};

// Hook for form validation
export const createFormValidator = (rules) => {
  return (data) => validateForm(data, rules);
};

export default validators;

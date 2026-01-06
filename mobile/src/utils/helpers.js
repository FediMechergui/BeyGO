// Utility functions

// Format date for display
export const formatDate = (date, locale = 'en') => {
  const d = new Date(date);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString(locale, options);
};

// Format time
export const formatTime = (date, locale = 'en') => {
  const d = new Date(date);
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now - then) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return formatDate(date);
};

// Format number with commas
export const formatNumber = (num) => {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';
};

// Format points/coins
export const formatPoints = (points) => {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return formatNumber(points);
};

// Calculate level from XP
export const calculateLevel = (xp) => {
  // XP required per level increases: 100, 200, 400, 800...
  let level = 1;
  let xpRequired = 100;
  let totalXpRequired = 0;
  
  while (xp >= totalXpRequired + xpRequired) {
    totalXpRequired += xpRequired;
    level++;
    xpRequired = Math.floor(xpRequired * 1.5);
  }
  
  const xpForNextLevel = xpRequired;
  const xpProgress = xp - totalXpRequired;
  const progress = xpProgress / xpForNextLevel;
  
  return {
    level,
    xpProgress,
    xpForNextLevel,
    progress,
    totalXp: xp,
  };
};

// Get rank title based on level
export const getRankTitle = (level) => {
  if (level >= 50) return 'Grand Vizier';
  if (level >= 40) return 'Pasha';
  if (level >= 30) return 'Agha';
  if (level >= 20) return 'Kaid';
  if (level >= 15) return 'Sheikh';
  if (level >= 10) return 'Historian';
  if (level >= 5) return 'Explorer';
  return 'Apprentice';
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Generate unique ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  return {
    isValid: password.length >= minLength && strength >= 2,
    strength: strength <= 1 ? 'weak' : strength === 2 ? 'fair' : strength === 3 ? 'good' : 'strong',
    checks: {
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    },
  };
};

// Shuffle array (Fisher-Yates)
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj) => {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// Convert dynasty period to readable format
export const formatDynastyPeriod = (startYear, endYear) => {
  if (!startYear || !endYear) return '';
  return `${startYear} - ${endYear}`;
};

// Calculate reign duration
export const calculateReignDuration = (startYear, endYear) => {
  if (!startYear || !endYear) return null;
  const duration = endYear - startYear;
  return {
    years: duration,
    text: duration === 1 ? '1 year' : `${duration} years`,
  };
};

// Get Bey title with ordinal
export const getBeyTitle = (name, ordinal) => {
  const ordinals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const ord = ordinals[ordinal - 1] || ordinal;
  return `${name} ${ord} Bey`;
};

// Color manipulation
export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Platform-specific styling helper
export const platformSelect = (ios, android, web) => {
  return Platform.select({ ios, android, web: web || android });
};

import { Platform } from 'react-native';

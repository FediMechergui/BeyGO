import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import translations from './translations';

// Storage key
const LANGUAGE_KEY = '@beygo_language';

// Supported languages
export const LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
};

// Default language
const DEFAULT_LANGUAGE = 'en';

// Create context
const LocalizationContext = createContext();

/**
 * Localization Provider Component
 */
export function LocalizationProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [isRTL, setIsRTL] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage && LANGUAGES[savedLanguage]) {
        setLanguageState(savedLanguage);
        setIsRTL(LANGUAGES[savedLanguage].rtl);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Change application language
   */
  const setLanguage = async (langCode) => {
    if (!LANGUAGES[langCode]) {
      console.warn(`Language ${langCode} not supported`);
      return false;
    }

    try {
      const newLang = LANGUAGES[langCode];
      const currentRTL = I18nManager.isRTL;
      const needsRTLChange = currentRTL !== newLang.rtl;

      // Save language preference
      await AsyncStorage.setItem(LANGUAGE_KEY, langCode);
      setLanguageState(langCode);
      setIsRTL(newLang.rtl);

      // Handle RTL change (requires app restart)
      if (needsRTLChange) {
        I18nManager.allowRTL(newLang.rtl);
        I18nManager.forceRTL(newLang.rtl);
        
        // Reload app for RTL changes to take effect
        if (!__DEV__) {
          await Updates.reloadAsync();
        } else {
          console.log('RTL change requires app restart in development');
        }
      }

      return true;
    } catch (error) {
      console.error('Error setting language:', error);
      return false;
    }
  };

  /**
   * Get translation for a key
   * Supports nested keys like 'auth.login'
   */
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        // Fallback to English
        value = translations[DEFAULT_LANGUAGE];
        for (const fallbackKey of keys) {
          if (value && value[fallbackKey] !== undefined) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }

    // Replace parameters
    if (typeof value === 'string') {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }

    return value || key;
  };

  /**
   * Get all translations for current language
   */
  const getTranslations = () => translations[language];

  /**
   * Check if current language is RTL
   */
  const isRightToLeft = () => isRTL;

  /**
   * Get current language info
   */
  const getCurrentLanguage = () => LANGUAGES[language];

  /**
   * Get all supported languages
   */
  const getSupportedLanguages = () => Object.values(LANGUAGES);

  const value = {
    language,
    isRTL,
    isLoading,
    setLanguage,
    t,
    getTranslations,
    isRightToLeft,
    getCurrentLanguage,
    getSupportedLanguages,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

/**
 * Hook to use localization
 */
export function useLocalization() {
  const context = useContext(LocalizationContext);
  
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  
  return context;
}

/**
 * HOC to inject localization props
 */
export function withLocalization(WrappedComponent) {
  return function WithLocalization(props) {
    const localization = useLocalization();
    return <WrappedComponent {...props} {...localization} />;
  };
}

/**
 * Format number based on locale
 */
export function formatNumber(number, language = DEFAULT_LANGUAGE) {
  const locales = {
    en: 'en-US',
    ar: 'ar-TN',
    fr: 'fr-TN',
  };
  
  return new Intl.NumberFormat(locales[language] || locales.en).format(number);
}

/**
 * Format date based on locale
 */
export function formatDate(date, language = DEFAULT_LANGUAGE, options = {}) {
  const locales = {
    en: 'en-US',
    ar: 'ar-TN',
    fr: 'fr-TN',
  };
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat(locales[language] || locales.en, defaultOptions).format(
    new Date(date)
  );
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date, language = DEFAULT_LANGUAGE) {
  const locales = {
    en: 'en-US',
    ar: 'ar-TN',
    fr: 'fr-TN',
  };
  
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now - then) / 1000);
  
  const units = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];
  
  for (const { unit, seconds } of units) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      const rtf = new Intl.RelativeTimeFormat(locales[language] || locales.en, {
        numeric: 'auto',
      });
      return rtf.format(-interval, unit);
    }
  }
  
  return formatDate(date, language);
}

export default {
  LocalizationProvider,
  useLocalization,
  withLocalization,
  formatNumber,
  formatDate,
  formatRelativeTime,
  LANGUAGES,
};

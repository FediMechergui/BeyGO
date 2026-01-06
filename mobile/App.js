// Must be first import for Reanimated to work properly
import 'react-native-reanimated';

import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { useAuthStore } from './src/store/authStore';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { colors } from './src/theme/colors';
import { LocalizationProvider } from './src/localization';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initEmailJS } from './src/services/emailService';
import { registerForPushNotifications, setupNotificationResponseHandler } from './src/services/notificationService';
import { initOfflineSupport, prefetchEssentialData } from './src/services/offlineService';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const { isAuthenticated, loadUser } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize services
        await initOfflineSupport();
        initEmailJS();
        
        // Load user data from storage
        await loadUser();
        
        // Register for push notifications (non-blocking)
        registerForPushNotifications().catch(err => 
          console.warn('Push notification setup failed:', err.message)
        );
        
        // Prefetch data for offline use (non-blocking)
        prefetchEssentialData().catch(err => 
          console.warn('Data prefetch failed:', err.message)
        );
        
      } catch (e) {
        console.warn('App initialization error:', e);
        setInitError(e.message);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // Setup notification handler once navigation is ready
  const navigationRef = React.useRef();
  
  const onNavigationReady = useCallback(() => {
    if (navigationRef.current) {
      setupNotificationResponseHandler(navigationRef.current);
    }
  }, []);

  if (!isReady) {
    return null;
  }

  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to initialize app</Text>
        <Text style={styles.errorDetail}>{initError}</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <LocalizationProvider>
        <SafeAreaProvider>
          <NavigationContainer 
            ref={navigationRef}
            onReady={onNavigationReady}
          >
            <StatusBar style="light" backgroundColor={colors.primary} />
            {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
          </NavigationContainer>
        </SafeAreaProvider>
      </LocalizationProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 10,
  },
  errorDetail: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

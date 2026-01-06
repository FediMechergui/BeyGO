import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Notification Configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Storage keys
const STORAGE_KEYS = {
  pushToken: '@beygo_push_token',
  notificationPrefs: '@beygo_notification_prefs',
  lastNotificationId: '@beygo_last_notification',
};

// Default notification preferences
const DEFAULT_PREFS = {
  enabled: true,
  nearbyMuseums: true,
  rewards: true,
  achievements: true,
  dailyReminder: true,
  newContent: true,
  socialUpdates: true,
  sound: true,
  vibration: true,
};

/**
 * Register for push notifications
 */
export const registerForPushNotifications = async () => {
  let token;

  // Check if physical device
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Get Expo push token
  try {
    // Get project ID from app config or use a fallback for development
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                      Constants.easConfig?.projectId ||
                      null;
    
    // Skip push token registration in development without EAS
    if (!projectId) {
      console.log('Push notifications disabled: no EAS projectId configured');
      console.log('To enable push notifications, run: npx eas build:configure');
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId,
    })).data;
    
    console.log('Push token:', token);
    
    // Store token locally
    await AsyncStorage.setItem(STORAGE_KEYS.pushToken, token);
    
    // Send token to backend
    await sendTokenToServer(token);
    
  } catch (error) {
    console.warn('Push notifications not available:', error.message);
    return null;
  }

  // Configure Android channel
  if (Platform.OS === 'android') {
    await setupAndroidChannels();
  }

  return token;
};

/**
 * Setup Android notification channels
 */
const setupAndroidChannels = async () => {
  // Main channel
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#C8A45C', // Primary gold color
    sound: 'notification.wav',
  });

  // Museum proximity channel
  await Notifications.setNotificationChannelAsync('museum_nearby', {
    name: 'Nearby Museums',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 500, 200, 500],
    lightColor: '#4A90A4',
    description: 'Notifications when you are near a museum',
  });

  // Rewards channel
  await Notifications.setNotificationChannelAsync('rewards', {
    name: 'Rewards',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#FFD700',
    description: 'Reward and achievement notifications',
  });

  // Daily reminder channel
  await Notifications.setNotificationChannelAsync('daily_reminder', {
    name: 'Daily Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    description: 'Daily exploration reminders',
  });
};

/**
 * Send push token to backend
 */
const sendTokenToServer = async (token) => {
  try {
    await api.post('/users/push-token', { 
      token,
      platform: Platform.OS,
      deviceId: Constants.deviceId,
    });
  } catch (error) {
    console.error('Error sending push token to server:', error);
  }
};

/**
 * Get stored push token
 */
export const getPushToken = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.pushToken);
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async () => {
  try {
    const prefs = await AsyncStorage.getItem(STORAGE_KEYS.notificationPrefs);
    return prefs ? JSON.parse(prefs) : DEFAULT_PREFS;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return DEFAULT_PREFS;
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (preferences) => {
  try {
    const currentPrefs = await getNotificationPreferences();
    const newPrefs = { ...currentPrefs, ...preferences };
    await AsyncStorage.setItem(STORAGE_KEYS.notificationPrefs, JSON.stringify(newPrefs));
    
    // Update server
    await api.put('/users/notification-preferences', newPrefs);
    
    return newPrefs;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

/**
 * Schedule local notification
 */
export const scheduleNotification = async ({
  title,
  body,
  data = {},
  trigger,
  channelId = 'default',
}) => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        badge: 1,
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger,
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

/**
 * Send immediate local notification
 */
export const sendLocalNotification = async ({ title, body, data = {}, channelId = 'default' }) => {
  return scheduleNotification({
    title,
    body,
    data,
    trigger: null, // Immediate
    channelId,
  });
};

/**
 * Notify user about nearby museum
 */
export const notifyNearbyMuseum = async (museum, distance) => {
  const prefs = await getNotificationPreferences();
  if (!prefs.nearbyMuseums) return null;

  return sendLocalNotification({
    title: '🏛️ Museum Nearby!',
    body: `${museum.name} is only ${Math.round(distance)}m away! Discover the Beys waiting for you.`,
    data: { 
      type: 'museum_nearby', 
      museumId: museum._id,
      action: 'open_museum',
    },
    channelId: 'museum_nearby',
  });
};

/**
 * Notify user about reward earned
 */
export const notifyRewardEarned = async (reward) => {
  const prefs = await getNotificationPreferences();
  if (!prefs.rewards) return null;

  return sendLocalNotification({
    title: '🎁 Reward Unlocked!',
    body: `Congratulations! You've earned: ${reward.name}`,
    data: { 
      type: 'reward_earned', 
      rewardId: reward._id,
      action: 'open_rewards',
    },
    channelId: 'rewards',
  });
};

/**
 * Notify user about achievement unlocked
 */
export const notifyAchievement = async (achievement) => {
  const prefs = await getNotificationPreferences();
  if (!prefs.achievements) return null;

  return sendLocalNotification({
    title: '🏆 Achievement Unlocked!',
    body: `${achievement.name}: ${achievement.description}`,
    data: { 
      type: 'achievement', 
      achievementId: achievement._id,
      action: 'open_achievements',
    },
    channelId: 'rewards',
  });
};

/**
 * Notify user about puzzle available at hotspot
 */
export const notifyPuzzleAvailable = async (hotspot, bey) => {
  return sendLocalNotification({
    title: '🧩 AR Puzzle Available!',
    body: `Discover ${bey.name} at this location. Start the AR puzzle challenge!`,
    data: { 
      type: 'puzzle_available', 
      hotspotId: hotspot._id,
      beyId: bey._id,
      action: 'start_puzzle',
    },
    channelId: 'default',
  });
};

/**
 * Schedule daily exploration reminder
 */
export const scheduleDailyReminder = async (hour = 10, minute = 0) => {
  const prefs = await getNotificationPreferences();
  if (!prefs.dailyReminder) return null;

  // Cancel existing daily reminders
  await cancelScheduledNotifications('daily_reminder');

  return scheduleNotification({
    title: '📜 Daily Exploration Awaits!',
    body: 'Continue your journey through Tunisian history. New discoveries await!',
    data: { type: 'daily_reminder', action: 'open_app' },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
    channelId: 'daily_reminder',
  });
};

/**
 * Cancel scheduled notifications by type
 */
export const cancelScheduledNotifications = async (type) => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduled) {
    if (notification.content.data?.type === type) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
};

/**
 * Cancel all notifications
 */
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = async () => {
  return Notifications.getAllScheduledNotificationsAsync();
};

/**
 * Set up notification response handler
 */
export const setupNotificationResponseHandler = (navigation) => {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    
    switch (data?.action) {
      case 'open_museum':
        navigation.navigate('MuseumDetail', { museumId: data.museumId });
        break;
      case 'open_rewards':
        navigation.navigate('Rewards');
        break;
      case 'open_achievements':
        navigation.navigate('Profile', { tab: 'achievements' });
        break;
      case 'start_puzzle':
        navigation.navigate('Puzzle', { hotspotId: data.hotspotId, beyId: data.beyId });
        break;
      case 'open_app':
      default:
        // Just open the app
        break;
    }
  });

  return subscription;
};

/**
 * Set up notification received handler (foreground)
 */
export const setupNotificationReceivedHandler = (callback) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Get badge count
 */
export const getBadgeCount = async () => {
  return Notifications.getBadgeCountAsync();
};

/**
 * Set badge count
 */
export const setBadgeCount = async (count) => {
  return Notifications.setBadgeCountAsync(count);
};

/**
 * Clear badge
 */
export const clearBadge = async () => {
  return setBadgeCount(0);
};

export default {
  registerForPushNotifications,
  getPushToken,
  getNotificationPreferences,
  updateNotificationPreferences,
  scheduleNotification,
  sendLocalNotification,
  notifyNearbyMuseum,
  notifyRewardEarned,
  notifyAchievement,
  notifyPuzzleAvailable,
  scheduleDailyReminder,
  cancelScheduledNotifications,
  cancelAllNotifications,
  getScheduledNotifications,
  setupNotificationResponseHandler,
  setupNotificationReceivedHandler,
  getBadgeCount,
  setBadgeCount,
  clearBadge,
};

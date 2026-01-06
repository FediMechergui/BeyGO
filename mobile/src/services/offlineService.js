import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';

// Storage keys
const STORAGE_KEYS = {
  museums: '@beygo_museums',
  beys: '@beygo_beys',
  dynasties: '@beygo_dynasties',
  userProfile: '@beygo_user_profile',
  visitHistory: '@beygo_visit_history',
  rewards: '@beygo_rewards',
  pendingActions: '@beygo_pending_actions',
  lastSyncTime: '@beygo_last_sync',
  cacheVersion: '@beygo_cache_version',
};

// Cache configuration
const CACHE_CONFIG = {
  version: '1.0.0',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  staleAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Network state
let isOnline = true;
let networkListeners = [];

/**
 * Initialize offline support
 */
export const initOfflineSupport = async () => {
  // Check current network state
  const state = await NetInfo.fetch();
  isOnline = state.isConnected && state.isInternetReachable;

  // Subscribe to network changes
  NetInfo.addEventListener((state) => {
    const wasOnline = isOnline;
    isOnline = state.isConnected && state.isInternetReachable;

    // Notify listeners
    networkListeners.forEach((listener) => listener(isOnline));

    // Sync when coming back online
    if (!wasOnline && isOnline) {
      syncPendingActions();
    }
  });

  // Check cache version
  await checkCacheVersion();

  return isOnline;
};

/**
 * Check and migrate cache version
 */
const checkCacheVersion = async () => {
  try {
    const storedVersion = await AsyncStorage.getItem(STORAGE_KEYS.cacheVersion);
    
    if (storedVersion !== CACHE_CONFIG.version) {
      console.log('Cache version mismatch, clearing cache...');
      await clearAllCache();
      await AsyncStorage.setItem(STORAGE_KEYS.cacheVersion, CACHE_CONFIG.version);
    }
  } catch (error) {
    console.error('Error checking cache version:', error);
  }
};

/**
 * Add network state listener
 */
export const addNetworkListener = (listener) => {
  networkListeners.push(listener);
  return () => {
    networkListeners = networkListeners.filter((l) => l !== listener);
  };
};

/**
 * Get current network status
 */
export const getNetworkStatus = () => isOnline;

/**
 * Store data in cache
 */
export const cacheData = async (key, data) => {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
    return true;
  } catch (error) {
    console.error('Error caching data:', error);
    return false;
  }
};

/**
 * Get data from cache
 */
export const getCachedData = async (key, maxAge = CACHE_CONFIG.maxAge) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    // Check if cache is fresh
    if (age < maxAge) {
      return { data, fresh: true, age };
    }

    // Check if cache is stale but usable
    if (age < CACHE_CONFIG.staleAge) {
      return { data, fresh: false, age };
    }

    // Cache is too old
    return null;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
};

/**
 * Fetch with cache fallback
 */
export const fetchWithCache = async (
  cacheKey,
  fetchFn,
  options = {}
) => {
  const {
    maxAge = CACHE_CONFIG.maxAge,
    forceRefresh = false,
    returnStale = true,
  } = options;

  // Try cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await getCachedData(cacheKey, maxAge);
    if (cached?.fresh) {
      return { data: cached.data, source: 'cache', fresh: true };
    }
    
    // If offline and have stale data, return it
    if (!isOnline && cached && returnStale) {
      return { data: cached.data, source: 'cache', fresh: false };
    }
  }

  // Try to fetch from network
  if (isOnline) {
    try {
      const data = await fetchFn();
      await cacheData(cacheKey, data);
      return { data, source: 'network', fresh: true };
    } catch (error) {
      console.error('Network fetch failed:', error);
      
      // Fall back to stale cache
      if (returnStale) {
        const cached = await getCachedData(cacheKey, CACHE_CONFIG.staleAge);
        if (cached) {
          return { data: cached.data, source: 'cache', fresh: false };
        }
      }
      
      throw error;
    }
  }

  // Offline with no cache
  const cached = await getCachedData(cacheKey, CACHE_CONFIG.staleAge);
  if (cached) {
    return { data: cached.data, source: 'cache', fresh: false };
  }

  throw new Error('No network connection and no cached data available');
};

/**
 * Cache museums data
 */
export const cacheMuseums = async (museums) => {
  return cacheData(STORAGE_KEYS.museums, museums);
};

/**
 * Get cached museums
 */
export const getCachedMuseums = async () => {
  return fetchWithCache(
    STORAGE_KEYS.museums,
    async () => {
      const response = await api.get('/museums');
      return response.data.data;
    }
  );
};

/**
 * Cache beys data
 */
export const cacheBeys = async (beys) => {
  return cacheData(STORAGE_KEYS.beys, beys);
};

/**
 * Get cached beys
 */
export const getCachedBeys = async () => {
  return fetchWithCache(
    STORAGE_KEYS.beys,
    async () => {
      const response = await api.get('/beys');
      return response.data.data?.beys || response.data.data;
    }
  );
};

/**
 * Cache dynasties data
 */
export const cacheDynasties = async (dynasties) => {
  return cacheData(STORAGE_KEYS.dynasties, dynasties);
};

/**
 * Get cached dynasties
 */
export const getCachedDynasties = async () => {
  return fetchWithCache(
    STORAGE_KEYS.dynasties,
    async () => {
      const response = await api.get('/dynasties');
      return response.data.data;
    }
  );
};

/**
 * Cache user profile
 */
export const cacheUserProfile = async (profile) => {
  return cacheData(STORAGE_KEYS.userProfile, profile);
};

/**
 * Get cached user profile
 */
export const getCachedUserProfile = async () => {
  const cached = await getCachedData(STORAGE_KEYS.userProfile);
  return cached?.data;
};

/**
 * Add pending action (for offline operations)
 */
export const addPendingAction = async (action) => {
  try {
    const pending = await AsyncStorage.getItem(STORAGE_KEYS.pendingActions);
    const actions = pending ? JSON.parse(pending) : [];
    
    actions.push({
      ...action,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    });
    
    await AsyncStorage.setItem(STORAGE_KEYS.pendingActions, JSON.stringify(actions));
    return true;
  } catch (error) {
    console.error('Error adding pending action:', error);
    return false;
  }
};

/**
 * Get pending actions
 */
export const getPendingActions = async () => {
  try {
    const pending = await AsyncStorage.getItem(STORAGE_KEYS.pendingActions);
    return pending ? JSON.parse(pending) : [];
  } catch (error) {
    console.error('Error getting pending actions:', error);
    return [];
  }
};

/**
 * Remove pending action
 */
export const removePendingAction = async (actionId) => {
  try {
    const pending = await AsyncStorage.getItem(STORAGE_KEYS.pendingActions);
    const actions = pending ? JSON.parse(pending) : [];
    
    const filtered = actions.filter((a) => a.id !== actionId);
    await AsyncStorage.setItem(STORAGE_KEYS.pendingActions, JSON.stringify(filtered));
    
    return true;
  } catch (error) {
    console.error('Error removing pending action:', error);
    return false;
  }
};

/**
 * Sync pending actions when online
 */
export const syncPendingActions = async () => {
  if (!isOnline) return { synced: 0, failed: 0 };

  const actions = await getPendingActions();
  let synced = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'RECORD_VISIT':
          await api.post('/visits', action.payload);
          break;
        case 'COMPLETE_PUZZLE':
          await api.post('/challenges/complete', action.payload);
          break;
        case 'COLLECT_ARTIFACT':
          await api.post('/visits/collect-artifact', action.payload);
          break;
        case 'UPDATE_PROFILE':
          await api.put('/users/profile', action.payload);
          break;
        case 'CLAIM_REWARD':
          await api.post('/rewards/claim', action.payload);
          break;
        default:
          console.warn('Unknown action type:', action.type);
      }

      await removePendingAction(action.id);
      synced++;
    } catch (error) {
      console.error('Error syncing action:', action, error);
      failed++;
    }
  }

  // Update last sync time
  await AsyncStorage.setItem(STORAGE_KEYS.lastSyncTime, new Date().toISOString());

  return { synced, failed };
};

/**
 * Get last sync time
 */
export const getLastSyncTime = async () => {
  try {
    const time = await AsyncStorage.getItem(STORAGE_KEYS.lastSyncTime);
    return time ? new Date(time) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Prefetch essential data for offline use
 */
export const prefetchEssentialData = async () => {
  if (!isOnline) return false;

  try {
    // Fetch and cache all essential data in parallel
    await Promise.all([
      getCachedMuseums(),
      getCachedBeys(),
      getCachedDynasties(),
    ]);

    console.log('Essential data prefetched successfully');
    return true;
  } catch (error) {
    console.error('Error prefetching data:', error);
    return false;
  }
};

/**
 * Clear all cached data
 */
export const clearAllCache = async () => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    const items = await AsyncStorage.multiGet(keys);
    
    let totalSize = 0;
    const stats = {};

    for (const [key, value] of items) {
      if (value) {
        const size = new Blob([value]).size;
        totalSize += size;
        stats[key] = {
          size,
          sizeFormatted: formatBytes(size),
        };

        try {
          const parsed = JSON.parse(value);
          if (parsed.timestamp) {
            stats[key].age = Date.now() - parsed.timestamp;
            stats[key].ageFormatted = formatDuration(stats[key].age);
          }
        } catch (e) {
          // Not JSON
        }
      }
    }

    return {
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      items: stats,
      itemCount: Object.keys(stats).length,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
};

// Helper: Format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper: Format duration
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export default {
  initOfflineSupport,
  addNetworkListener,
  getNetworkStatus,
  cacheData,
  getCachedData,
  fetchWithCache,
  cacheMuseums,
  getCachedMuseums,
  cacheBeys,
  getCachedBeys,
  cacheDynasties,
  getCachedDynasties,
  cacheUserProfile,
  getCachedUserProfile,
  addPendingAction,
  getPendingActions,
  removePendingAction,
  syncPendingActions,
  getLastSyncTime,
  prefetchEssentialData,
  clearAllCache,
  getCacheStats,
  STORAGE_KEYS,
};

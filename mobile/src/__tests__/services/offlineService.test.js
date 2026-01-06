import offlineService from '../../services/offlineService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));

describe('Offline Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cacheData', () => {
    it('caches data with timestamp', async () => {
      const key = '@test_key';
      const data = { name: 'Test Data' };

      await offlineService.cacheData(key, data);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        key,
        expect.stringContaining('"data":{"name":"Test Data"}')
      );
    });
  });

  describe('getCachedData', () => {
    it('returns null when no cache exists', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await offlineService.getCachedData('@test_key');
      expect(result).toBeNull();
    });

    it('returns fresh data when within maxAge', async () => {
      const cachedData = {
        data: { name: 'Cached Data' },
        timestamp: Date.now() - 1000, // 1 second ago
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await offlineService.getCachedData('@test_key');
      expect(result.fresh).toBe(true);
      expect(result.data.name).toBe('Cached Data');
    });

    it('returns stale data when beyond maxAge but within staleAge', async () => {
      const cachedData = {
        data: { name: 'Stale Data' },
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await offlineService.getCachedData('@test_key');
      expect(result.fresh).toBe(false);
      expect(result.data.name).toBe('Stale Data');
    });
  });

  describe('addPendingAction', () => {
    it('adds action to pending queue', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const action = {
        type: 'RECORD_VISIT',
        payload: { museumId: '123' },
      };

      const result = await offlineService.addPendingAction(action);
      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getPendingActions', () => {
    it('returns empty array when no pending actions', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await offlineService.getPendingActions();
      expect(result).toEqual([]);
    });

    it('returns pending actions', async () => {
      const actions = [
        { id: '1', type: 'TEST', payload: {} },
      ];
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(actions));

      const result = await offlineService.getPendingActions();
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('TEST');
    });
  });

  describe('getNetworkStatus', () => {
    it('returns current network status', () => {
      const status = offlineService.getNetworkStatus();
      expect(typeof status).toBe('boolean');
    });
  });
});

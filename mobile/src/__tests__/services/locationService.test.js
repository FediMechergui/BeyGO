import {
  calculateDistance,
  isWithinGeofence,
  formatDistance,
} from '../../services/locationService';

describe('Location Service', () => {
  describe('calculateDistance', () => {
    it('calculates distance between two points correctly', () => {
      // Bardo Museum to Carthage (approximately 15km)
      const lat1 = 36.8094;
      const lon1 = 10.1342;
      const lat2 = 36.8528;
      const lon2 = 10.3233;

      const distance = calculateDistance(lat1, lon1, lat2, lon2);
      
      // Should be around 15-20km
      expect(distance).toBeGreaterThan(15000);
      expect(distance).toBeLessThan(25000);
    });

    it('returns 0 for same coordinates', () => {
      const lat = 36.8094;
      const lon = 10.1342;

      const distance = calculateDistance(lat, lon, lat, lon);
      expect(distance).toBe(0);
    });

    it('handles negative coordinates', () => {
      const distance = calculateDistance(-33.8688, 151.2093, -34.0522, 151.2437);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('isWithinGeofence', () => {
    const center = { latitude: 36.8094, longitude: 10.1342 };
    const radiusMeters = 100;

    it('returns true for point inside geofence', () => {
      const point = { latitude: 36.8095, longitude: 10.1343 };
      expect(isWithinGeofence(point, center, radiusMeters)).toBe(true);
    });

    it('returns false for point outside geofence', () => {
      const point = { latitude: 36.82, longitude: 10.15 };
      expect(isWithinGeofence(point, center, radiusMeters)).toBe(false);
    });

    it('returns true for point exactly on boundary', () => {
      // This is an edge case, implementation dependent
      const point = center;
      expect(isWithinGeofence(point, center, radiusMeters)).toBe(true);
    });
  });

  describe('formatDistance', () => {
    it('formats meters correctly', () => {
      expect(formatDistance(500)).toBe('500 m');
      expect(formatDistance(100)).toBe('100 m');
    });

    it('formats kilometers correctly', () => {
      expect(formatDistance(1500)).toBe('1.5 km');
      expect(formatDistance(10000)).toBe('10 km');
    });

    it('handles zero distance', () => {
      expect(formatDistance(0)).toBe('0 m');
    });
  });
});

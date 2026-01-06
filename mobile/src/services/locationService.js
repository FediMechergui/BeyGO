import * as Location from 'expo-location';

class LocationService {
  constructor() {
    this.watchSubscription = null;
  }

  // Request location permissions
  async requestPermissions() {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      return { granted: false, message: 'Location permission denied' };
    }

    return { granted: true };
  }

  // Get current location
  async getCurrentLocation() {
    try {
      const permission = await this.requestPermissions();
      if (!permission.granted) {
        throw new Error(permission.message);
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  }

  // Watch location changes
  async watchLocation(callback, options = {}) {
    try {
      const permission = await this.requestPermissions();
      if (!permission.granted) {
        throw new Error(permission.message);
      }

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: options.timeInterval || 5000,
          distanceInterval: options.distanceInterval || 10,
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          });
        }
      );

      return this.watchSubscription;
    } catch (error) {
      console.error('Error watching location:', error);
      throw error;
    }
  }

  // Stop watching location
  stopWatching() {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }

  // Calculate distance between two points (in meters)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Check if user is within a geofence
  isWithinGeofence(userLat, userLon, targetLat, targetLon, radius) {
    const distance = this.calculateDistance(userLat, userLon, targetLat, targetLon);
    return distance <= radius;
  }

  // Format distance for display
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

export const locationService = new LocationService();
export default locationService;

// Export standalone functions for testing and direct use
export const calculateDistance = (lat1, lon1, lat2, lon2) => 
  locationService.calculateDistance(lat1, lon1, lat2, lon2);

export const isWithinGeofence = (point, center, radiusMeters) => 
  locationService.isWithinGeofence(
    point.latitude, 
    point.longitude, 
    center.latitude, 
    center.longitude, 
    radiusMeters
  );

export const formatDistance = (meters) => {
  if (meters === 0) return '0 m';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return km === Math.floor(km) ? `${Math.floor(km)} km` : `${km.toFixed(1)} km`;
};

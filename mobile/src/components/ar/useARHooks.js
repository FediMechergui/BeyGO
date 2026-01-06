import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';
import config from '../../config/env';

// AR Configuration
// AR Configuration - Optimized for Pokemon Go-like smoothness
const AR_CONFIG = {
  proximity: {
    immediate: config.PROXIMITY_THRESHOLD_IMMEDIATE || 10, // Can collect
    near: config.PROXIMITY_THRESHOLD_NEAR || 25, // Getting close
    far: config.PROXIMITY_THRESHOLD_APPROACHING || 50, // Approaching
    visible: 100, // Visible on radar
  },
  updateInterval: 500, // Faster updates for smoother tracking (was 2000)
  distanceInterval: 0.5, // Update every 0.5 meters for precision
  accuracyThreshold: 20,
  devMode: config.DEV_MODE_AR || false,
  autoScatter: config.DEV_AUTO_SCATTER_HOTSPOTS || false,
  scatterRadius: config.DEV_SCATTER_RADIUS || 5, // max radius in meters
  scatterMinRadius: config.DEV_SCATTER_MIN_RADIUS || 2, // min radius in meters
  scatterCount: config.DEV_SCATTER_COUNT || 9,
};

/**
 * Generate random hotspots around a center point (for dev mode)
 */
function generateScatteredHotspots(centerLat, centerLng, maxRadius = 5, count = 9, minRadius = 2) {
  const hotspots = [];
  const pieceNames = [
    'Portrait Fragment', 'Crown Piece', 'Royal Seal',
    'Dynasty Emblem', 'Historical Scroll', 'Golden Coin',
    'Palace Gate', 'Throne Detail', 'Final Piece'
  ];
  
  for (let i = 0; i < count; i++) {
    // Random angle and distance between minRadius and maxRadius
    const angle = (Math.PI * 2 * i / count) + (Math.random() * 0.5 - 0.25);
    const distance = minRadius + (Math.random() * (maxRadius - minRadius)); // 2-5m range
    
    // Convert to lat/lng offset (approximate)
    const latOffset = (distance / 111320) * Math.cos(angle); // 111320m per degree lat
    const lngOffset = (distance / (111320 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
    
    const hotspot = {
      _id: `dev_hotspot_${i + 1}`,
      name: pieceNames[i],
      pieceNumber: i + 1,
      location: {
        coordinates: [centerLng + lngOffset, centerLat + latOffset], // [lng, lat] GeoJSON format
      },
      collected: false,
      floor: 0,
    };
    
    hotspots.push(hotspot);
    console.log(`[DEV] Generated hotspot ${i + 1}: ${pieceNames[i]} at ${(centerLat + latOffset).toFixed(6)}, ${(centerLng + lngOffset).toFixed(6)} (${Math.round(distance)}m away)`);
  }
  
  return hotspots;
}

/**
 * Custom hook for AR geolocation and hotspot detection
 * Implements Pokemon GO-style proximity detection
 */
export function useARLocation(hotspots = []) {
  const [location, setLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [nearbyHotspots, setNearbyHotspots] = useState([]);
  const [immediateHotspot, setImmediateHotspot] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [devHotspots, setDevHotspots] = useState([]);
  const [closestHotspot, setClosestHotspot] = useState(null);
  
  const locationSubscription = useRef(null);
  const headingSubscription = useRef(null);
  const hasGeneratedDevHotspots = useRef(false);

  // Use dev-generated hotspots if in dev mode, otherwise use provided hotspots
  const activeHotspots = AR_CONFIG.autoScatter && devHotspots.length > 0 ? devHotspots : hotspots;

  // Start tracking
  const startTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission denied');
        return false;
      }

      // Get initial location
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      setLocation(initialLocation.coords);
      setAccuracy(initialLocation.coords.accuracy);
      
      // Generate dev hotspots around user's current location
      if (AR_CONFIG.autoScatter && !hasGeneratedDevHotspots.current) {
        console.log('[DEV MODE] Generating scattered hotspots around your location...');
        console.log(`[DEV MODE] Your location: ${initialLocation.coords.latitude.toFixed(6)}, ${initialLocation.coords.longitude.toFixed(6)}`);
        console.log(`[DEV MODE] Scatter range: ${AR_CONFIG.scatterMinRadius}-${AR_CONFIG.scatterRadius}m`);
        const scattered = generateScatteredHotspots(
          initialLocation.coords.latitude,
          initialLocation.coords.longitude,
          AR_CONFIG.scatterRadius,
          AR_CONFIG.scatterCount,
          AR_CONFIG.scatterMinRadius
        );
        setDevHotspots(scattered);
        hasGeneratedDevHotspots.current = true;
      }

      // Start watching position - HIGH FREQUENCY for smooth tracking
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: AR_CONFIG.updateInterval, // 500ms for smooth updates
          distanceInterval: AR_CONFIG.distanceInterval, // Every 0.5 meters
        },
        (newLocation) => {
          setLocation(newLocation.coords);
          setAccuracy(newLocation.coords.accuracy);
        }
      );

      // Start watching heading (compass) - HIGH FREQUENCY for smooth arrow
      headingSubscription.current = await Location.watchHeadingAsync((newHeading) => {
        setHeading(newHeading.trueHeading || newHeading.magHeading || 0);
      });

      setIsTracking(true);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    if (headingSubscription.current) {
      headingSubscription.current.remove();
      headingSubscription.current = null;
    }
    setIsTracking(false);
  }, []);

  // Calculate distance to hotspot
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
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
  }, []);

  // Calculate bearing to hotspot
  const calculateBearing = useCallback((lat1, lon1, lat2, lon2) => {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const λ1 = (lon1 * Math.PI) / 180;
    const λ2 = (lon2 * Math.PI) / 180;

    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x =
      Math.cos(φ1) * Math.sin(φ2) -
      Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);

    const θ = Math.atan2(y, x);
    return ((θ * 180) / Math.PI + 360) % 360;
  }, []);

  // Update nearby hotspots when location changes
  useEffect(() => {
    if (!location || !activeHotspots.length) return;

    const processedHotspots = activeHotspots
      .filter(h => !h.collected) // Filter out collected hotspots
      .map((hotspot) => {
        const [lng, lat] = hotspot.location?.coordinates || [0, 0];
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          lat,
          lng
        );
        const bearing = calculateBearing(
          location.latitude,
          location.longitude,
          lat,
        lng
      );
      
      // Calculate relative bearing (based on device heading)
      const relativeBearing = (bearing - heading + 360) % 360;

      // Determine proximity level
      let proximityLevel = 'out_of_range';
      if (distance <= AR_CONFIG.proximity.immediate) {
        proximityLevel = 'immediate';
      } else if (distance <= AR_CONFIG.proximity.near) {
        proximityLevel = 'near';
      } else if (distance <= AR_CONFIG.proximity.far) {
        proximityLevel = 'far';
      } else if (distance <= AR_CONFIG.proximity.visible) {
        proximityLevel = 'visible';
      }

      return {
        ...hotspot,
        distance,
        bearing,
        relativeBearing,
        proximityLevel,
      };
    });

    // Filter visible hotspots and sort by distance
    const visible = processedHotspots
      .filter((h) => h.proximityLevel !== 'out_of_range')
      .sort((a, b) => a.distance - b.distance);

    setNearbyHotspots(visible);

    // Track the closest uncollected hotspot for navigation
    const closest = processedHotspots.sort((a, b) => a.distance - b.distance)[0];
    setClosestHotspot(closest || null);

    // Check for immediate hotspot (can interact with AR)
    const immediate = visible.find((h) => h.proximityLevel === 'immediate');
    setImmediateHotspot(immediate || null);
  }, [location, heading, activeHotspots, calculateDistance, calculateBearing]);

  // Mark a hotspot as collected
  const markCollected = useCallback((hotspotId) => {
    setDevHotspots(prev => prev.map(h => 
      h._id === hotspotId ? { ...h, collected: true } : h
    ));
  }, []);

  // Regenerate hotspots (reset)
  const regenerateHotspots = useCallback(() => {
    if (location) {
      console.log('[DEV MODE] Regenerating hotspots around current position...');
      console.log(`[DEV MODE] New center: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
      hasGeneratedDevHotspots.current = false;
      const scattered = generateScatteredHotspots(
        location.latitude,
        location.longitude,
        AR_CONFIG.scatterRadius,
        AR_CONFIG.scatterCount,
        AR_CONFIG.scatterMinRadius
      );
      setDevHotspots(scattered);
      hasGeneratedDevHotspots.current = true;
    }
  }, [location]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    location,
    heading,
    accuracy,
    nearbyHotspots,
    immediateHotspot,
    closestHotspot, // NEW: for navigation guidance
    isTracking,
    error,
    devHotspots, // NEW: dev-generated hotspots
    startTracking,
    stopTracking,
    markCollected, // NEW: mark hotspot as collected
    regenerateHotspots, // NEW: regenerate dev hotspots
    calculateDistance,
    calculateBearing,
    proximityConfig: AR_CONFIG.proximity,
  };
}

/**
 * Custom hook for AR marker detection
 */
export function useARMarkerDetection() {
  const [detectedMarkers, setDetectedMarkers] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastDetection, setLastDetection] = useState(null);

  const detectMarker = useCallback((markerData) => {
    const marker = {
      ...markerData,
      id: `marker_${Date.now()}`,
      detectedAt: new Date(),
    };

    setDetectedMarkers((prev) => {
      // Avoid duplicates within 5 seconds
      const isDuplicate = prev.some(
        (m) =>
          m.type === marker.type &&
          m.targetId === marker.targetId &&
          Date.now() - new Date(m.detectedAt).getTime() < 5000
      );

      if (isDuplicate) return prev;
      return [...prev, marker];
    });

    setLastDetection(marker);
    return marker;
  }, []);

  const clearMarkers = useCallback(() => {
    setDetectedMarkers([]);
    setLastDetection(null);
  }, []);

  const removeMarker = useCallback((markerId) => {
    setDetectedMarkers((prev) => prev.filter((m) => m.id !== markerId));
  }, []);

  return {
    detectedMarkers,
    lastDetection,
    isScanning,
    setIsScanning,
    detectMarker,
    clearMarkers,
    removeMarker,
  };
}

/**
 * Custom hook for AR session management
 */
export function useARSession() {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [collectedItems, setCollectedItems] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    markersDetected: 0,
    itemsCollected: 0,
    distanceTraveled: 0,
    puzzlesSolved: 0,
  });

  const sessionStartTime = useRef(null);
  const lastLocation = useRef(null);
  const timerInterval = useRef(null);

  const startSession = useCallback(() => {
    sessionStartTime.current = Date.now();
    setSessionActive(true);
    setCollectedItems([]);
    setSessionStats({
      markersDetected: 0,
      itemsCollected: 0,
      distanceTraveled: 0,
      puzzlesSolved: 0,
    });

    // Start duration timer
    timerInterval.current = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStartTime.current) / 1000));
    }, 1000);
  }, []);

  const endSession = useCallback(() => {
    setSessionActive(false);
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    const summary = {
      duration: sessionDuration,
      ...sessionStats,
      collectedItems,
      endTime: new Date(),
    };

    return summary;
  }, [sessionDuration, sessionStats, collectedItems]);

  const collectItem = useCallback((item) => {
    setCollectedItems((prev) => [...prev, item]);
    setSessionStats((prev) => ({
      ...prev,
      itemsCollected: prev.itemsCollected + 1,
    }));
  }, []);

  const recordMarkerDetection = useCallback(() => {
    setSessionStats((prev) => ({
      ...prev,
      markersDetected: prev.markersDetected + 1,
    }));
  }, []);

  const recordPuzzleSolved = useCallback(() => {
    setSessionStats((prev) => ({
      ...prev,
      puzzlesSolved: prev.puzzlesSolved + 1,
    }));
  }, []);

  const updateDistance = useCallback((newLocation) => {
    if (lastLocation.current) {
      const R = 6371e3;
      const φ1 = (lastLocation.current.latitude * Math.PI) / 180;
      const φ2 = (newLocation.latitude * Math.PI) / 180;
      const Δφ = ((newLocation.latitude - lastLocation.current.latitude) * Math.PI) / 180;
      const Δλ = ((newLocation.longitude - lastLocation.current.longitude) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      setSessionStats((prev) => ({
        ...prev,
        distanceTraveled: prev.distanceTraveled + distance,
      }));
    }
    lastLocation.current = newLocation;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  return {
    sessionActive,
    sessionDuration,
    collectedItems,
    sessionStats,
    startSession,
    endSession,
    collectItem,
    recordMarkerDetection,
    recordPuzzleSolved,
    updateDistance,
  };
}

export default {
  useARLocation,
  useARMarkerDetection,
  useARSession,
  AR_CONFIG,
};

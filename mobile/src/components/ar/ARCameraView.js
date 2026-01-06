import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../theme';

// AR Marker Types
export const AR_MARKER_TYPES = {
  BEY_SPIRIT: 'bey_spirit',
  HISTORICAL_ARTIFACT: 'artifact',
  COIN_COLLECTION: 'coins',
  DOCUMENT: 'document',
  PUZZLE_PIECE: 'puzzle',
};

// AR Configuration
const AR_CONFIG = {
  detectionRadius: 50, // meters
  scanInterval: 2000, // ms
  markerPersistence: 5000, // ms
  vibrationPattern: [0, 100, 50, 100],
};

export default function ARCameraView({
  onMarkerDetected,
  onARObjectCollected,
  hotspots = [],
  targetBey,
  puzzleMode = false,
  style,
}) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [detectedMarkers, setDetectedMarkers] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [arObjects, setArObjects] = useState([]);
  const [showAROverlay, setShowAROverlay] = useState(false);
  
  const cameraRef = useRef(null);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const locationSubscription = useRef(null);

  // Request permissions
  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus === 'granted');
      
      if (locationStatus === 'granted') {
        startLocationTracking();
      }
    })();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Start location tracking
  const startLocationTracking = async () => {
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (location) => {
        setCurrentLocation(location.coords);
        checkNearbyHotspots(location.coords);
      }
    );
  };

  // Check for nearby AR hotspots
  const checkNearbyHotspots = useCallback((coords) => {
    if (!hotspots.length) return;

    const nearbyHotspots = hotspots.filter((hotspot) => {
      const distance = calculateDistance(
        coords.latitude,
        coords.longitude,
        hotspot.location.coordinates[1],
        hotspot.location.coordinates[0]
      );
      return distance <= AR_CONFIG.detectionRadius;
    });

    if (nearbyHotspots.length > 0) {
      setArObjects(nearbyHotspots);
      setShowAROverlay(true);
      Vibration.vibrate(AR_CONFIG.vibrationPattern);
    }
  }, [hotspots]);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
  };

  // Scanning animation
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isScanning]);

  // Pulse animation for detected objects
  useEffect(() => {
    if (arObjects.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [arObjects]);

  // Handle barcode/QR detection (used as AR markers)
  const handleBarcodeScanned = ({ type, data }) => {
    if (!isScanning) return;

    try {
      const markerData = JSON.parse(data);
      
      if (markerData.type && Object.values(AR_MARKER_TYPES).includes(markerData.type)) {
        setIsScanning(false);
        Vibration.vibrate(AR_CONFIG.vibrationPattern);
        
        const marker = {
          ...markerData,
          detectedAt: new Date(),
          position: currentLocation,
        };
        
        setDetectedMarkers((prev) => [...prev, marker]);
        onMarkerDetected?.(marker);
        
        // Re-enable scanning after interval
        setTimeout(() => setIsScanning(true), AR_CONFIG.scanInterval);
      }
    } catch (e) {
      // Not a valid AR marker
    }
  };

  // Collect AR object
  const handleCollectObject = (object) => {
    Vibration.vibrate([0, 200, 100, 200]);
    setArObjects((prev) => prev.filter((obj) => obj._id !== object._id));
    onARObjectCollected?.(object);
    
    if (arObjects.length === 1) {
      setShowAROverlay(false);
    }
  };

  const hasPermission = cameraPermission?.granted && hasLocationPermission;

  if (!cameraPermission || hasLocationPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Requesting permissions...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-off" size={64} color={colors.textMuted} />
        <Text style={styles.statusText}>
          Camera and location permissions are required for AR features
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
      />

      {/* Scanning Overlay */}
      <View style={styles.scanOverlay}>
        {/* Corner brackets */}
        <View style={styles.scanFrame}>
          <View style={[styles.cornerBracket, styles.topLeft]} />
          <View style={[styles.cornerBracket, styles.topRight]} />
          <View style={[styles.cornerBracket, styles.bottomLeft]} />
          <View style={[styles.cornerBracket, styles.bottomRight]} />
          
          {/* Scanning line */}
          {isScanning && (
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [
                    {
                      translateY: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 200],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </View>
      </View>

      {/* AR Objects Overlay */}
      {showAROverlay && arObjects.map((object, index) => (
        <ARObjectOverlay
          key={object._id || index}
          object={object}
          pulseAnim={pulseAnim}
          onCollect={() => handleCollectObject(object)}
          index={index}
        />
      ))}

      {/* Target Bey Indicator */}
      {targetBey && (
        <View style={styles.targetIndicator}>
          <Ionicons name="locate" size={24} color={colors.primary} />
          <Text style={styles.targetText}>
            Searching for {targetBey.name}...
          </Text>
        </View>
      )}

      {/* Detected Markers Count */}
      {detectedMarkers.length > 0 && (
        <View style={styles.markerCount}>
          <Ionicons name="cube" size={20} color={colors.accent} />
          <Text style={styles.markerCountText}>
            {detectedMarkers.length} artifacts found
          </Text>
        </View>
      )}

      {/* Puzzle Mode Indicator */}
      {puzzleMode && (
        <View style={styles.puzzleIndicator}>
          <Ionicons name="extension-puzzle" size={24} color={colors.accent} />
          <Text style={styles.puzzleText}>Puzzle Mode Active</Text>
        </View>
      )}

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, isScanning ? styles.statusActive : styles.statusInactive]} />
          <Text style={styles.statusLabel}>
            {isScanning ? 'Scanning...' : 'Processing'}
          </Text>
        </View>
        {currentLocation && (
          <View style={styles.statusItem}>
            <Ionicons name="location" size={16} color={colors.success} />
            <Text style={styles.statusLabel}>GPS Active</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// AR Object Overlay Component
function ARObjectOverlay({ object, pulseAnim, onCollect, index }) {
  const getObjectIcon = () => {
    switch (object.type) {
      case AR_MARKER_TYPES.BEY_SPIRIT:
        return 'person';
      case AR_MARKER_TYPES.HISTORICAL_ARTIFACT:
        return 'trophy';
      case AR_MARKER_TYPES.COIN_COLLECTION:
        return 'logo-bitcoin';
      case AR_MARKER_TYPES.DOCUMENT:
        return 'document-text';
      case AR_MARKER_TYPES.PUZZLE_PIECE:
        return 'extension-puzzle';
      default:
        return 'cube';
    }
  };

  const getPositionStyle = () => {
    // Position objects around the screen based on index
    const positions = [
      { top: '30%', left: '20%' },
      { top: '25%', right: '25%' },
      { top: '50%', left: '40%' },
      { bottom: '35%', left: '25%' },
      { bottom: '30%', right: '20%' },
    ];
    return positions[index % positions.length];
  };

  return (
    <Animated.View
      style={[
        styles.arObject,
        getPositionStyle(),
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <TouchableOpacity style={styles.arObjectButton} onPress={onCollect}>
        <View style={styles.arObjectGlow} />
        <View style={styles.arObjectIcon}>
          <Ionicons name={getObjectIcon()} size={32} color={colors.textInverse} />
        </View>
        <Text style={styles.arObjectName}>{object.name || 'Artifact'}</Text>
        <Text style={styles.arObjectAction}>Tap to collect</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  cornerBracket: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  arObject: {
    position: 'absolute',
    alignItems: 'center',
  },
  arObjectButton: {
    alignItems: 'center',
  },
  arObjectGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  arObjectIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  arObjectName: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.textInverse,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  arObjectAction: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  targetIndicator: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  targetText: {
    color: colors.textInverse,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
  },
  markerCount: {
    position: 'absolute',
    top: 60,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  markerCountText: {
    color: colors.textInverse,
    fontSize: fontSize.xs,
    marginLeft: spacing.xs,
  },
  puzzleIndicator: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  puzzleText: {
    color: colors.textInverse,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  statusBar: {
    position: 'absolute',
    bottom: 40,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusActive: {
    backgroundColor: colors.success,
  },
  statusInactive: {
    backgroundColor: colors.warning,
  },
  statusLabel: {
    color: colors.textInverse,
    fontSize: fontSize.xs,
  },
});

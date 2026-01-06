import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { useMuseumStore } from '../../store/museumStore';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

// OpenStreetMap tile URL (no API key needed)
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// Calculate distance between two coordinates in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate bearing/direction from point A to point B
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

// Get compass direction from bearing
const getDirection = (bearing) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

export default function MapScreen({ navigation }) {
  const mapRef = useRef(null);
  const { nearbyMuseums, museums, userLocation, setUserLocation, fetchNearbyMuseums, fetchMuseums } = useMuseumStore();
  const [selectedMuseum, setSelectedMuseum] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  // Use nearbyMuseums if available, otherwise fall back to all museums
  const displayMuseums = nearbyMuseums.length > 0 ? nearbyMuseums : museums;

  // Calculate distances and add to museums
  const museumsWithDistance = displayMuseums.map(museum => {
    const lat = museum.location?.coordinates?.latitude;
    const lng = museum.location?.coordinates?.longitude;
    
    if (userLocation && lat && lng) {
      const distance = calculateDistance(
        userLocation.latitude, userLocation.longitude,
        lat, lng
      );
      const bearing = calculateBearing(
        userLocation.latitude, userLocation.longitude,
        lat, lng
      );
      return { ...museum, distance, bearing, direction: getDirection(bearing) };
    }
    return { ...museum, distance: null, bearing: null, direction: null };
  }).sort((a, b) => (a.distance || 999) - (b.distance || 999));

  const initialRegion = {
    latitude: userLocation?.latitude || 36.8065,
    longitude: userLocation?.longitude || 10.1815,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  useEffect(() => {
    // Fetch all museums as a fallback
    console.log('MapScreen: Fetching museums...');
    fetchMuseums();
    requestLocation();
  }, []);

  useEffect(() => {
    console.log('MapScreen: displayMuseums count:', displayMuseums.length);
    console.log('MapScreen: userLocation:', userLocation);
    if (displayMuseums.length > 0) {
      displayMuseums.forEach((m, i) => {
        console.log(`  Museum ${i+1}: ${m.name} at ${m.location?.coordinates?.latitude}, ${m.location?.coordinates?.longitude}`);
      });
    }
  }, [displayMuseums, userLocation]);

  const requestLocation = async () => {
    try {
      setIsLoading(true);
      setLocationError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        Alert.alert(
          'Permission Required',
          'Location permission is needed to show your position on the map.'
        );
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      console.log('MapScreen: Got location:', location.coords.latitude, location.coords.longitude);
      
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Animate to user location once map is ready
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }, 1000);
        }
      }, 500);

      fetchNearbyMuseums(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  };

  const handleMarkerPress = (museum) => {
    setSelectedMuseum(museum);
    // Center on selected museum
    if (mapRef.current && museum.location?.coordinates) {
      mapRef.current.animateToRegion({
        latitude: museum.location.coordinates.latitude,
        longitude: museum.location.coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  const openDirections = (museum) => {
    const lat = museum.location?.coordinates?.latitude;
    const lng = museum.location?.coordinates?.longitude;
    if (lat && lng) {
      const url = Platform.select({
        ios: `maps://app?daddr=${lat},${lng}`,
        android: `google.navigation:q=${lat},${lng}`,
      });
      Linking.openURL(url).catch(() => {
        // Fallback to Google Maps web
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
      });
    }
  };

  // Show loading state
  if (isLoading && !userLocation) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT} // Use default provider (Apple Maps on iOS, Google on Android)
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        mapType="standard"
        onMapReady={() => {
          console.log('MapScreen: Map is ready');
          setMapReady(true);
        }}
        onRegionChangeComplete={(region) => {
          console.log('MapScreen: Region changed to:', region.latitude.toFixed(4), region.longitude.toFixed(4));
        }}
      >
        {/* OpenStreetMap tiles as fallback/overlay - remove if default maps work */}
        {Platform.OS === 'android' && (
          <UrlTile
            urlTemplate={OSM_TILE_URL}
            maximumZ={19}
            flipY={false}
            tileSize={256}
          />
        )}
        
        {/* Museum Markers */}
        {museumsWithDistance.map((museum) => (
          <React.Fragment key={museum._id}>
            <Marker
              coordinate={{
                latitude: museum.location?.coordinates?.latitude || 36.8065,
                longitude: museum.location?.coordinates?.longitude || 10.1815,
              }}
              onPress={() => handleMarkerPress(museum)}
            >
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.marker,
                    selectedMuseum?._id === museum._id && styles.markerSelected,
                  ]}
                >
                  <Ionicons
                    name="business"
                    size={20}
                    color={
                      selectedMuseum?._id === museum._id
                        ? colors.textInverse
                        : colors.primary
                    }
                  />
                </View>
              </View>
            </Marker>
            {/* Geofence circle */}
            <Circle
              center={{
                latitude: museum.location?.coordinates?.latitude || 36.8065,
                longitude: museum.location?.coordinates?.longitude || 10.1815,
              }}
              radius={museum.location?.radius || 100}
              fillColor={colors.primary + '20'}
              strokeColor={colors.primary + '40'}
              strokeWidth={2}
            />
          </React.Fragment>
        ))}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Museum Map</Text>
        <Text style={styles.subtitle}>
          {museumsWithDistance.length} museums on map
        </Text>
      </View>

      {/* Center Button */}
      <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={24} color={colors.primary} />
      </TouchableOpacity>

      {/* Radar Button */}
      <TouchableOpacity 
        style={[styles.radarButton, showRadar && styles.radarButtonActive]} 
        onPress={() => setShowRadar(!showRadar)}
      >
        <Ionicons name="radio" size={24} color={showRadar ? colors.textInverse : colors.primary} />
      </TouchableOpacity>

      {/* Radar Panel - Shows nearby museums with distance and direction */}
      {showRadar && (
        <View style={styles.radarPanel}>
          <View style={styles.radarHeader}>
            <Ionicons name="radio" size={20} color={colors.primary} />
            <Text style={styles.radarTitle}>Nearby Museums</Text>
          </View>
          <ScrollView style={styles.radarList} showsVerticalScrollIndicator={false}>
            {museumsWithDistance.slice(0, 5).map((museum, index) => (
              <TouchableOpacity
                key={museum._id}
                style={styles.radarItem}
                onPress={() => {
                  setSelectedMuseum(museum);
                  setShowRadar(false);
                  if (mapRef.current) {
                    mapRef.current.animateToRegion({
                      latitude: museum.location?.coordinates?.latitude || 36.8065,
                      longitude: museum.location?.coordinates?.longitude || 10.1815,
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    });
                  }
                }}
              >
                <View style={styles.radarItemLeft}>
                  <View style={[styles.radarRank, index === 0 && styles.radarRankNearest]}>
                    <Text style={[styles.radarRankText, index === 0 && styles.radarRankTextNearest]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.radarItemInfo}>
                    <Text style={styles.radarItemName} numberOfLines={1}>
                      {museum.name}
                    </Text>
                    <Text style={styles.radarItemBeys}>
                      {museum.availableBeys?.length || 0} Beys to collect
                    </Text>
                  </View>
                </View>
                <View style={styles.radarItemRight}>
                  <View style={styles.directionBadge}>
                    <Ionicons 
                      name="compass" 
                      size={14} 
                      color={colors.primary}
                      style={{ transform: [{ rotate: `${museum.bearing || 0}deg` }] }}
                    />
                    <Text style={styles.directionText}>{museum.direction || '?'}</Text>
                  </View>
                  <Text style={styles.distanceText}>
                    {museum.distance ? `${museum.distance.toFixed(1)} km` : '-- km'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Museum</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: colors.primary + '40' },
            ]}
          />
          <Text style={styles.legendText}>Visit Range</Text>
        </View>
      </View>

      {/* Selected Museum Card */}
      {selectedMuseum && (
        <View style={styles.museumCard}>
          <View style={styles.museumCardContent}>
            <View style={styles.museumIcon}>
              <Ionicons name="business" size={32} color={colors.primary} />
            </View>
            <View style={styles.museumInfo}>
              <Text style={styles.museumName}>{selectedMuseum.name}</Text>
              <View style={styles.museumMeta}>
                <Ionicons name="people" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>
                  {selectedMuseum.availableBeys?.length || 0} Beys to collect
                </Text>
              </View>
              <View style={styles.museumMeta}>
                <Ionicons name="location" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>
                  {selectedMuseum.distance
                    ? `${selectedMuseum.distance.toFixed(2)} km away`
                    : selectedMuseum.city || 'Tunisia'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedMuseum(null)}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.museumActions}>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() => openDirections(selectedMuseum)}
            >
              <Ionicons name="navigate" size={16} color={colors.primary} />
              <Text style={styles.directionsText}>Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() =>
                navigation.navigate('MuseumDetail', { id: selectedMuseum._id })
              }
            >
              <Text style={styles.viewButtonText}>View Details</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  map: {
    width: width,
    height: height,
  },
  header: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  centerButton: {
    position: 'absolute',
    top: 140,
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  legend: {
    position: 'absolute',
    top: 260,
    right: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  legendText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  markerSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.accent,
  },
  museumCard: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  museumCardContent: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  museumIcon: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  museumInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  museumName: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  museumMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  closeButton: {
    padding: spacing.xs,
  },
  museumActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  directionsText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  viewButtonText: {
    fontSize: fontSize.sm,
    color: colors.textInverse,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  radarButton: {
    position: 'absolute',
    top: 200,
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  radarButtonActive: {
    backgroundColor: colors.primary,
  },
  radarPanel: {
    position: 'absolute',
    top: 140,
    left: spacing.lg,
    right: 80,
    maxHeight: 280,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  radarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  radarTitle: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  radarList: {
    maxHeight: 200,
  },
  radarItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '50',
  },
  radarItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radarRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  radarRankNearest: {
    backgroundColor: colors.primary,
  },
  radarRankText: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: colors.primary,
  },
  radarRankTextNearest: {
    color: colors.textInverse,
  },
  radarItemInfo: {
    flex: 1,
  },
  radarItemName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  radarItemBeys: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  radarItemRight: {
    alignItems: 'flex-end',
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  directionText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 2,
  },
  distanceText: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.accent,
  },
});

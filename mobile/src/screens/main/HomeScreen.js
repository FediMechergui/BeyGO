import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useMuseumStore } from '../../store/museumStore';
import { API_URL } from '../../services/api';

// Get base URL for images (remove /api suffix)
const IMAGE_BASE_URL = API_URL.replace('/api', '');

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuthStore();
  const [locationError, setLocationError] = useState(null);
  const {
    nearbyMuseums,
    currentMuseum,
    activeVisit,
    activeChallenge,
    isLoading,
    fetchNearbyMuseums,
    setUserLocation,
  } = useMuseumStore();

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    setLocationError(null);
    try {
      // First check if location services are enabled
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        setLocationError('Location services are disabled');
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to find nearby museums.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => fetchNearbyMuseums() },
            { text: 'Open Settings', onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }},
          ]
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        fetchNearbyMuseums(location.coords.latitude, location.coords.longitude);
      } else {
        setLocationError('Location permission denied');
        // Fallback: fetch all museums without location
        fetchNearbyMuseums();
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError(error.message);
      // Try with last known location as fallback
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          console.log('Using last known location');
          setUserLocation({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          });
          fetchNearbyMuseums(lastKnown.coords.latitude, lastKnown.coords.longitude);
          return;
        }
      } catch (e) {
        console.log('No last known location available');
      }
      fetchNearbyMuseums();
    }
  };

  const onRefresh = () => {
    initializeLocation();
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.username}>{user?.username || 'Explorer'}</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={24} color={colors.accent} />
            <Text style={styles.statValue}>{user?.totalPoints || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="trophy" size={24} color={colors.success} />
            <Text style={styles.statValue}>{user?.beysCollected?.length || 0}</Text>
            <Text style={styles.statLabel}>Beys Collected</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="location" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{user?.museumsVisited?.length || 0}</Text>
            <Text style={styles.statLabel}>Museums</Text>
          </View>
        </View>
      </View>

      {/* Active Visit/Challenge */}
      {activeVisit && (
        <TouchableOpacity
          style={styles.activeCard}
          onPress={() => navigation.navigate('MuseumDetail', { id: currentMuseum?._id })}
        >
          <View style={styles.activeCardHeader}>
            <Ionicons name="location" size={20} color={colors.textInverse} />
            <Text style={styles.activeCardTitle}>Active Visit</Text>
          </View>
          <Text style={styles.activeCardMuseum}>{currentMuseum?.name}</Text>
          {activeChallenge && (
            <View style={styles.challengeProgress}>
              <Text style={styles.challengeText}>
                Puzzle: {activeChallenge.piecesCollected?.length || 0}/9 pieces
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${((activeChallenge.piecesCollected?.length || 0) / 9) * 100}%` },
                  ]}
                />
              </View>
            </View>
          )}
          <View style={styles.activeCardButton}>
            <Text style={styles.activeCardButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Explore')}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="compass" size={28} color={colors.primary} />
          </View>
          <Text style={styles.actionTitle}>Explore</Text>
          <Text style={styles.actionSubtitle}>Find museums</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Map')}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="map" size={28} color={colors.success} />
          </View>
          <Text style={styles.actionTitle}>Map</Text>
          <Text style={styles.actionSubtitle}>Navigate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('BeyList')}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.accent + '20' }]}>
            <Ionicons name="people" size={28} color={colors.accent} />
          </View>
          <Text style={styles.actionTitle}>Beys</Text>
          <Text style={styles.actionSubtitle}>Collection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Rewards')}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.error + '20' }]}>
            <Ionicons name="gift" size={28} color={colors.error} />
          </View>
          <Text style={styles.actionTitle}>Rewards</Text>
          <Text style={styles.actionSubtitle}>Redeem</Text>
        </TouchableOpacity>
      </View>

      {/* Nearby Museums */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nearby Museums</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {nearbyMuseums.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.museumsScroll}
        >
          {nearbyMuseums.slice(0, 5).map((museum) => {
            const imageUrl = museum.images?.[0]?.url || museum.images?.[0];
            return (
            <TouchableOpacity
              key={museum._id}
              style={styles.museumCard}
              onPress={() => navigation.navigate('MuseumDetail', { id: museum._id })}
            >
              {imageUrl ? (
                <Image 
                  source={{ uri: `${IMAGE_BASE_URL}${imageUrl}` }}
                  style={styles.museumImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.museumImagePlaceholder}>
                  <Ionicons name="business" size={40} color={colors.primary} />
                </View>
              )}
              <View style={styles.museumInfo}>
                <Text style={styles.museumName} numberOfLines={1}>
                  {museum.name}
                </Text>
                <View style={styles.museumMeta}>
                  <Ionicons name="location" size={12} color={colors.textMuted} />
                  <Text style={styles.museumDistance}>
                    {museum.distance ? `${museum.distance.toFixed(1)} km` : 'Nearby'}
                  </Text>
                </View>
                <View style={styles.museumBeys}>
                  <Ionicons name="people" size={12} color={colors.primary} />
                  <Text style={styles.beyCount}>
                    {museum.availableBeys?.length || 0} Beys
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );})}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No museums nearby</Text>
          <Text style={styles.emptySubtext}>Enable location to find museums</Text>
        </View>
      )}

      {/* Historical Tip */}
      <View style={styles.tipCard}>
        <View style={styles.tipIcon}>
          <Ionicons name="bulb" size={24} color={colors.accent} />
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Did you know?</Text>
          <Text style={styles.tipText}>
            The Husaynid dynasty ruled Tunisia for over 250 years, from 1705 to 1957,
            making it one of the longest-ruling dynasties in North African history.
          </Text>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: fontSize.md,
    color: colors.textLight,
  },
  username: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  activeCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  activeCardTitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: spacing.xs,
  },
  activeCardMuseum: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginBottom: spacing.md,
  },
  challengeProgress: {
    marginBottom: spacing.md,
  },
  challengeText: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  activeCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  activeCardButtonText: {
    fontSize: fontSize.sm,
    color: colors.textInverse,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  actionCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    margin: spacing.xs,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  actionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  museumsScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  museumCard: {
    width: 160,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  museumImagePlaceholder: {
    height: 100,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  museumImage: {
    height: 100,
    width: '100%',
    backgroundColor: colors.backgroundDark,
  },
  museumInfo: {
    padding: spacing.sm,
  },
  museumName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  museumMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  museumDistance: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginLeft: 4,
  },
  museumBeys: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  beyCount: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textLight,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  tipCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  tipIcon: {
    marginRight: spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    lineHeight: 20,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

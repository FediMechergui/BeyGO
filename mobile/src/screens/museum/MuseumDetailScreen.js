import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { useMuseumStore } from '../../store/museumStore';
import { museumAPI, API_URL } from '../../services/api';

// Get base URL for images (remove /api suffix)
const IMAGE_BASE_URL = API_URL.replace('/api', '');

const { width } = Dimensions.get('window');

export default function MuseumDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [museum, setMuseum] = useState(null);
  const [loading, setLoading] = useState(true);
  const {
    activeVisit,
    startVisit,
    endVisit,
    startChallenge,
    userLocation,
    isLoading,
  } = useMuseumStore();

  useEffect(() => {
    fetchMuseum();
  }, [id]);

  const fetchMuseum = async () => {
    try {
      const response = await museumAPI.getById(id);
      setMuseum(response.data.data || response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load museum details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartVisit = async () => {
    if (!userLocation) {
      Alert.alert(
        'Location Required',
        'Please enable location services to start a visit'
      );
      return;
    }

    const result = await startVisit(id, userLocation.latitude, userLocation.longitude);
    if (result.success) {
      Alert.alert(
        'Visit Started!',
        'Welcome to the museum! Start exploring and collecting puzzle pieces.',
        [
          {
            text: 'Start Challenge',
            onPress: handleStartChallenge,
          },
          { text: 'Later', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleEndVisit = async () => {
    Alert.alert(
      'End Visit',
      'Are you sure you want to end your visit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Visit',
          style: 'destructive',
          onPress: async () => {
            const result = await endVisit(activeVisit._id);
            if (result.success) {
              Alert.alert('Visit Ended', `You earned ${result.data.pointsEarned} points!`);
            }
          },
        },
      ]
    );
  };

  const handleStartChallenge = async () => {
    if (!museum?.availableBeys?.length) {
      Alert.alert('No Beys Available', 'This museum has no Beys to collect yet.');
      return;
    }

    // Start challenge with the first available Bey
    const beyId = museum.availableBeys[0]._id || museum.availableBeys[0];
    const result = await startChallenge(beyId);
    if (result.success) {
      navigation.navigate('Puzzle', { challengeId: result.data._id, bey: result.data.bey });
    } else {
      Alert.alert('Error', result.error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!museum) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorText}>Museum not found</Text>
      </View>
    );
  }

  const isVisiting = activeVisit?.museum === id;

  // Get the first museum image URL
  const getMuseumImageUrl = () => {
    if (museum?.images?.length > 0) {
      const imageUrl = museum.images[0].url || museum.images[0];
      return `${IMAGE_BASE_URL}${imageUrl}`;
    }
    return null;
  };

  const museumImageUrl = getMuseumImageUrl();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        {museumImageUrl ? (
          <ImageBackground
            source={{ uri: museumImageUrl }}
            style={styles.hero}
            resizeMode="cover"
          >
            <View style={styles.heroImageOverlay} />
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
            </TouchableOpacity>
          </ImageBackground>
        ) : (
          <View style={styles.hero}>
            <View style={styles.heroOverlay}>
              <Ionicons name="business" size={80} color={colors.textInverse} />
            </View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.museumName}>{museum.name}</Text>
            <View style={styles.location}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.locationText}>
                {museum.city || 'Tunisia'}
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="people" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{museum.availableBeys?.length || 0}</Text>
              <Text style={styles.statLabel}>Beys</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="cube" size={24} color={colors.accent} />
              <Text style={styles.statValue}>{museum.arHotspots?.length || 9}</Text>
              <Text style={styles.statLabel}>AR Points</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="star" size={24} color={colors.success} />
              <Text style={styles.statValue}>{museum.rating || 4.5}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* Visit Status */}
          {isVisiting && (
            <View style={styles.visitingBanner}>
              <Ionicons name="location" size={20} color={colors.textInverse} />
              <Text style={styles.visitingText}>You're currently visiting</Text>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>
              {museum.description ||
                `Explore the rich history of the Tunisian Beylic at ${museum.name}. 
                Discover artifacts, learn about the Beys who ruled Tunisia, and 
                collect puzzle pieces through our interactive AR experience.`}
            </Text>
          </View>

          {/* Operating Hours */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operating Hours</Text>
            <View style={styles.hoursCard}>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursDay}>Mon - Fri</Text>
                <Text style={styles.hoursTime}>
                  {museum.openingHours?.start || '09:00'} -{' '}
                  {museum.openingHours?.end || '17:00'}
                </Text>
              </View>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursDay}>Saturday</Text>
                <Text style={styles.hoursTime}>09:00 - 14:00</Text>
              </View>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursDay}>Sunday</Text>
                <Text style={styles.hoursClosed}>Closed</Text>
              </View>
            </View>
          </View>

          {/* Available Beys */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Beys</Text>
              <TouchableOpacity onPress={() => navigation.navigate('BeyList', { museumId: id })}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.beysScroll}
            >
              {(museum.availableBeys || []).slice(0, 5).map((bey, index) => (
                <TouchableOpacity
                  key={bey._id || index}
                  style={styles.beyCard}
                  onPress={() =>
                    navigation.navigate('BeyDetail', { id: bey._id || bey })
                  }
                >
                  <View style={styles.beyIcon}>
                    <Ionicons name="person" size={32} color={colors.primary} />
                  </View>
                  <Text style={styles.beyName} numberOfLines={1}>
                    {bey.name || `Bey ${index + 1}`}
                  </Text>
                  <Text style={styles.beyDynasty} numberOfLines={1}>
                    {bey.dynasty?.name || 'Unknown Dynasty'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* AR Hotspots */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AR Collection Points</Text>
            <Text style={styles.sectionSubtitle}>
              Find these locations to collect puzzle pieces
            </Text>
            <View style={styles.hotspotsGrid}>
              {(museum.arHotspots || []).map((hotspot, index) => (
                <View key={hotspot._id || index} style={styles.hotspotItem}>
                  <View style={styles.hotspotIcon}>
                    <Text style={styles.hotspotNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.hotspotName} numberOfLines={1}>
                    {hotspot.name || `Point ${index + 1}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomBar}>
        {isVisiting ? (
          <View style={styles.visitingActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.endButton]}
              onPress={handleEndVisit}
            >
              <Text style={styles.endButtonText}>End Visit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.challengeButton]}
              onPress={handleStartChallenge}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="camera" size={20} color={colors.textInverse} />
                  <Text style={styles.challengeButtonText}>Start Puzzle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.startVisitButton}
            onPress={handleStartVisit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <>
                <Ionicons name="play" size={20} color={colors.textInverse} />
                <Text style={styles.startVisitButtonText}>Start Visit</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textLight,
    marginTop: spacing.md,
  },
  hero: {
    height: 250,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginTop: -30,
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: spacing.lg,
  },
  titleSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  museumName: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: fontSize.md,
    color: colors.textLight,
    marginLeft: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  visitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  visitingText: {
    fontSize: fontSize.md,
    color: colors.textInverse,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textLight,
    lineHeight: 24,
  },
  hoursCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hoursDay: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  hoursTime: {
    fontSize: fontSize.md,
    color: colors.textLight,
  },
  hoursClosed: {
    fontSize: fontSize.md,
    color: colors.error,
  },
  beysScroll: {
    paddingRight: spacing.lg,
  },
  beyCard: {
    width: 120,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    alignItems: 'center',
  },
  beyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  beyName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  beyDynasty: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  hotspotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hotspotItem: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  hotspotIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  hotspotNumber: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  hotspotName: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  bottomPadding: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startVisitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  startVisitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginLeft: spacing.sm,
  },
  visitingActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  endButton: {
    backgroundColor: colors.backgroundDark,
    marginRight: spacing.sm,
  },
  endButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  challengeButton: {
    backgroundColor: colors.primary,
    flex: 2,
  },
  challengeButtonText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginLeft: spacing.sm,
  },
});

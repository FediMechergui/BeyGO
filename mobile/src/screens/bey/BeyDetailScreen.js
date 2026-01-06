import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { beyAPI, API_URL } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

// Get base URL for images (remove /api suffix)
const IMAGE_BASE_URL = API_URL.replace('/api', '');

const { width } = Dimensions.get('window');

export default function BeyDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [bey, setBey] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const isCollected = user?.beysCollected?.includes(id);

  useEffect(() => {
    fetchBey();
  }, [id]);

  const fetchBey = async () => {
    try {
      const response = await beyAPI.getById(id);
      setBey(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching Bey:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!bey) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorText}>Bey not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View
          style={[
            styles.hero,
            {
              backgroundColor:
                bey.dynasty?.name === 'Muradid' ? colors.secondary : colors.primary,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <View style={styles.beyPortrait}>
              {bey.portraitImage ? (
                <Image 
                  source={{ uri: `${IMAGE_BASE_URL}${bey.portraitImage}` }}
                  style={styles.beyPortraitImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={80} color={colors.primary} />
              )}
            </View>
            {isCollected && (
              <View style={styles.collectedBadge}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={styles.collectedText}>Collected</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Name & Title */}
          <View style={styles.titleSection}>
            <Text style={styles.beyName}>{bey.name}</Text>
            <Text style={styles.beyTitle}>{bey.title || 'Bey of Tunis'}</Text>
            <View style={styles.dynastyTag}>
              <Ionicons name="shield" size={14} color={colors.primary} />
              <Text style={styles.dynastyText}>
                {bey.dynasty?.name || 'Unknown'} Dynasty
              </Text>
            </View>
          </View>

          {/* Reign Info */}
          <View style={styles.reignCard}>
            <View style={styles.reignItem}>
              <Text style={styles.reignLabel}>Reign Start</Text>
              <Text style={styles.reignValue}>{bey.reignStart || 'Unknown'}</Text>
            </View>
            <View style={styles.reignDivider} />
            <View style={styles.reignItem}>
              <Text style={styles.reignLabel}>Reign End</Text>
              <Text style={styles.reignValue}>{bey.reignEnd || 'Unknown'}</Text>
            </View>
            <View style={styles.reignDivider} />
            <View style={styles.reignItem}>
              <Text style={styles.reignLabel}>Order</Text>
              <Text style={styles.reignValue}>#{bey.order || '?'}</Text>
            </View>
          </View>

          {/* Biography */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biography</Text>
            <Text style={styles.biography}>
              {bey.biography ||
                `${bey.name} served as the Bey of Tunis during the ${bey.dynasty?.name || 'Beylical'} era. 
                His reign marked an important period in Tunisian history, contributing to the 
                political and cultural landscape of the region. The Beylical system was a form of 
                hereditary monarchy that governed Tunisia under Ottoman suzerainty.`}
            </Text>
          </View>

          {/* Key Facts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Facts</Text>
            <View style={styles.factsGrid}>
              <View style={styles.factCard}>
                <Ionicons name="location" size={24} color={colors.primary} />
                <Text style={styles.factLabel}>Residence</Text>
                <Text style={styles.factValue}>
                  {bey.residence?.name || 'Bardo Palace'}
                </Text>
              </View>
              <View style={styles.factCard}>
                <Ionicons name="cash" size={24} color={colors.accent} />
                <Text style={styles.factLabel}>Currency</Text>
                <Text style={styles.factValue}>
                  {bey.currency?.name || 'Tunisian Riyal'}
                </Text>
              </View>
              <View style={styles.factCard}>
                <Ionicons name="calendar" size={24} color={colors.success} />
                <Text style={styles.factLabel}>Era</Text>
                <Text style={styles.factValue}>
                  {bey.reignStart || '?'} - {bey.reignEnd || '?'}
                </Text>
              </View>
              <View style={styles.factCard}>
                <Ionicons name="people" size={24} color={colors.secondary} />
                <Text style={styles.factLabel}>Dynasty</Text>
                <Text style={styles.factValue}>
                  {bey.dynasty?.name || 'Unknown'}
                </Text>
              </View>
            </View>
          </View>

          {/* Historical Events */}
          {bey.events && bey.events.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Historical Events</Text>
              {bey.events.map((event, index) => (
                <View key={index} style={styles.eventCard}>
                  <View style={styles.eventDot} />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventYear}>{event.year || 'Unknown'}</Text>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventDescription}>
                      {event.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Puzzle Challenge */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Puzzle Challenge</Text>
            <View style={styles.puzzleCard}>
              <View style={styles.puzzleGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <View
                    key={num}
                    style={[
                      styles.puzzlePiece,
                      isCollected && styles.puzzlePieceCollected,
                    ]}
                  >
                    {isCollected ? (
                      <Text style={styles.puzzlePieceNumber}>{num}</Text>
                    ) : (
                      <Ionicons name="help" size={16} color={colors.textMuted} />
                    )}
                  </View>
                ))}
              </View>
              <View style={styles.puzzleInfo}>
                <Text style={styles.puzzleStatus}>
                  {isCollected ? 'Puzzle Completed!' : 'Not Yet Collected'}
                </Text>
                <Text style={styles.puzzlePoints}>
                  {isCollected ? '+100 points earned' : 'Collect 9 pieces to unlock'}
                </Text>
              </View>
            </View>
          </View>

          {/* Related Beys */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Same Dynasty</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('BeyList', { dynasty: bey.dynasty?.name })
                }
              >
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedScroll}
            >
              {[1, 2, 3].map((item) => (
                <View key={item} style={styles.relatedCard}>
                  <View style={styles.relatedIcon}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.relatedName}>Related Bey</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Bottom Action */}
      {!isCollected && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.collectButton}
            onPress={() => navigation.navigate('Puzzle', { beyId: id, bey })}
          >
            <Ionicons name="camera" size={20} color={colors.textInverse} />
            <Text style={styles.collectButtonText}>Start Puzzle Challenge</Text>
          </TouchableOpacity>
        </View>
      )}
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
    height: 280,
    paddingTop: spacing.xl,
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
    zIndex: 10,
  },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
  },
  beyPortrait: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.textInverse,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.accent,
    overflow: 'hidden',
  },
  beyPortraitImage: {
    width: '100%',
    height: '100%',
  },
  collectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textInverse,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    marginTop: spacing.md,
  },
  collectedText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.success,
    marginLeft: spacing.xs,
  },
  content: {
    marginTop: -30,
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: spacing.lg,
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  beyName: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  beyTitle: {
    fontSize: fontSize.md,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  dynastyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    marginTop: spacing.sm,
  },
  dynastyText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  reignCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  reignItem: {
    flex: 1,
    alignItems: 'center',
  },
  reignLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  reignValue: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  reignDivider: {
    width: 1,
    backgroundColor: colors.border,
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
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  biography: {
    fontSize: fontSize.md,
    color: colors.textLight,
    lineHeight: 24,
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  factCard: {
    width: '50%',
    padding: spacing.xs,
  },
  factCardInner: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  factLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  factValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
    textAlign: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 4,
    marginRight: spacing.md,
  },
  eventContent: {
    flex: 1,
  },
  eventYear: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  eventDescription: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: 4,
    lineHeight: 20,
  },
  puzzleCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  puzzleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  puzzlePiece: {
    width: 50,
    height: 50,
    margin: 3,
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puzzlePieceCollected: {
    backgroundColor: colors.primary,
  },
  puzzlePieceNumber: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  puzzleInfo: {
    alignItems: 'center',
  },
  puzzleStatus: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  puzzlePoints: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  relatedScroll: {
    paddingRight: spacing.lg,
  },
  relatedCard: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 80,
  },
  relatedIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  relatedName: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    textAlign: 'center',
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
  collectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  collectButtonText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginLeft: spacing.sm,
  },
});

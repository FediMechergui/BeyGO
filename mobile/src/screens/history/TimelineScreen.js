import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { beyAPI } from '../../services/api';

export default function TimelineScreen({ navigation }) {
  const [beys, setBeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDynasty, setSelectedDynasty] = useState('all');

  useEffect(() => {
    fetchBeys();
  }, []);

  const fetchBeys = async () => {
    try {
      const response = await beyAPI.getTimeline();
      // Handle both array and object responses
      const data = response.data.data;
      setBeys(Array.isArray(data) ? data : (data?.beys || []));
    } catch (error) {
      console.error('Error fetching timeline:', error);
      setBeys([]);
    } finally {
      setLoading(false);
    }
  };

  // Ensure beys is always an array before filtering
  const filteredBeys = (beys || []).filter((bey) => {
    if (selectedDynasty === 'all') return true;
    return bey.dynasty?.name?.toLowerCase() === selectedDynasty;
  });

  // Sort by reign start
  const sortedBeys = [...filteredBeys].sort((a, b) => {
    const yearA = parseInt(a.reignStart) || 0;
    const yearB = parseInt(b.reignStart) || 0;
    return yearA - yearB;
  });

  // Group by dynasty
  const muradidBeys = sortedBeys.filter(b => b.dynasty?.name === 'Muradid');
  const husaynidBeys = sortedBeys.filter(b => b.dynasty?.name === 'Husaynid');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Historical Timeline</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Era Overview */}
      <View style={styles.eraOverview}>
        <View style={styles.eraCard}>
          <Text style={styles.eraYears}>1593 - 1957</Text>
          <Text style={styles.eraTitle}>Beylical Era of Tunisia</Text>
          <Text style={styles.eraSubtitle}>
            364 years • 2 Dynasties • {beys.length || 27} Beys
          </Text>
        </View>
      </View>

      {/* Dynasty Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedDynasty === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedDynasty('all')}
        >
          <Text
            style={[
              styles.filterText,
              selectedDynasty === 'all' && styles.filterTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedDynasty === 'muradid' && styles.filterButtonActive,
            { backgroundColor: selectedDynasty === 'muradid' ? colors.secondary : colors.card },
          ]}
          onPress={() => setSelectedDynasty('muradid')}
        >
          <Text
            style={[
              styles.filterText,
              selectedDynasty === 'muradid' && styles.filterTextActive,
            ]}
          >
            Muradid
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedDynasty === 'husaynid' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedDynasty('husaynid')}
        >
          <Text
            style={[
              styles.filterText,
              selectedDynasty === 'husaynid' && styles.filterTextActive,
            ]}
          >
            Husaynid
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchBeys}
            tintColor={colors.primary}
          />
        }
      >
        {/* Muradid Dynasty Section */}
        {(selectedDynasty === 'all' || selectedDynasty === 'muradid') && muradidBeys.length > 0 && (
          <View style={styles.dynastySection}>
            <View style={[styles.dynastyHeader, { backgroundColor: colors.secondary }]}>
              <Ionicons name="shield" size={20} color={colors.textInverse} />
              <Text style={styles.dynastyTitle}>Muradid Dynasty</Text>
              <Text style={styles.dynastyPeriod}>1613 - 1702</Text>
            </View>
            <View style={styles.timelineContainer}>
              {muradidBeys.map((bey, index) => (
                <TouchableOpacity
                  key={bey._id}
                  style={styles.timelineItem}
                  onPress={() => navigation.navigate('BeyDetail', { id: bey._id })}
                >
                  <View style={styles.timelineLine}>
                    <View style={[styles.timelineDot, { backgroundColor: colors.secondary }]} />
                    {index < muradidBeys.length - 1 && (
                      <View style={[styles.timelineConnector, { backgroundColor: colors.secondary + '40' }]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.beyYear}>
                      {bey.reignStart || '?'} - {bey.reignEnd || '?'}
                    </Text>
                    <Text style={styles.beyName}>{bey.name}</Text>
                    <Text style={styles.beyTitle}>{bey.title || 'Bey of Tunis'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Husaynid Dynasty Section */}
        {(selectedDynasty === 'all' || selectedDynasty === 'husaynid') && husaynidBeys.length > 0 && (
          <View style={styles.dynastySection}>
            <View style={[styles.dynastyHeader, { backgroundColor: colors.primary }]}>
              <Ionicons name="shield" size={20} color={colors.textInverse} />
              <Text style={styles.dynastyTitle}>Husaynid Dynasty</Text>
              <Text style={styles.dynastyPeriod}>1705 - 1957</Text>
            </View>
            <View style={styles.timelineContainer}>
              {husaynidBeys.map((bey, index) => (
                <TouchableOpacity
                  key={bey._id}
                  style={styles.timelineItem}
                  onPress={() => navigation.navigate('BeyDetail', { id: bey._id })}
                >
                  <View style={styles.timelineLine}>
                    <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                    {index < husaynidBeys.length - 1 && (
                      <View style={[styles.timelineConnector, { backgroundColor: colors.primary + '40' }]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.beyYear}>
                      {bey.reignStart || '?'} - {bey.reignEnd || '?'}
                    </Text>
                    <Text style={styles.beyName}>{bey.name}</Text>
                    <Text style={styles.beyTitle}>{bey.title || 'Bey of Tunis'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Historical Note */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>End of the Beylical Era</Text>
            <Text style={styles.noteText}>
              The Beylical system ended on July 25, 1957, when Tunisia was declared
              a republic, abolishing the monarchy. Muhammad VIII al-Amin was the
              last Bey of Tunis.
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  eraOverview: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  eraCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  eraYears: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  eraTitle: {
    fontSize: fontSize.lg,
    color: colors.textInverse,
    marginTop: spacing.xs,
  },
  eraSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.textInverse,
  },
  scrollView: {
    flex: 1,
  },
  dynastySection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  dynastyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  dynastyTitle: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginLeft: spacing.sm,
    flex: 1,
  },
  dynastyPeriod: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timelineContainer: {
    paddingLeft: spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  timelineLine: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  timelineConnector: {
    position: 'absolute',
    top: 12,
    width: 2,
    height: 60,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  beyYear: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  beyName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  beyTitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  noteCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  noteContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  noteTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  noteText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

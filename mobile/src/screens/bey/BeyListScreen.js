import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { beyAPI, museumAPI, API_URL } from '../../services/api';

// Get base URL for images (remove /api suffix)
const IMAGE_BASE_URL = API_URL.replace('/api', '');

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 3) / 2;

export default function BeyListScreen({ route, navigation }) {
  const { museumId } = route.params || {};
  const [beys, setBeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDynasty, setSelectedDynasty] = useState('all');

  useEffect(() => {
    fetchBeys();
  }, [museumId]);

  const fetchBeys = async () => {
    try {
      let response;
      if (museumId) {
        // Fetch beys for specific museum
        response = await museumAPI.getBeys(museumId);
        setBeys(response.data.data?.beys || []);
      } else {
        // Fetch all beys
        response = await beyAPI.getAll();
        setBeys(response.data.data?.beys || response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching Beys:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBeys = beys.filter((bey) => {
    const matchesSearch =
      bey.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bey.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDynasty =
      selectedDynasty === 'all' ||
      bey.dynasty?.name?.toLowerCase().includes(selectedDynasty);
    return matchesSearch && matchesDynasty;
  });

  const renderBeyCard = ({ item: bey }) => (
    <TouchableOpacity
      style={styles.beyCard}
      onPress={() => navigation.navigate('BeyDetail', { id: bey._id })}
    >
      <View style={styles.beyImageContainer}>
        {bey.portraitImage ? (
          <Image 
            source={{ uri: `${IMAGE_BASE_URL}${bey.portraitImage}` }}
            style={styles.beyImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.beyImagePlaceholder}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
        )}
        <View
          style={[
            styles.dynastyBadge,
            {
              backgroundColor:
                bey.dynasty?.name === 'Muradid' ? colors.secondary : colors.primary,
            },
          ]}
        >
          <Text style={styles.dynastyBadgeText}>
            {bey.dynasty?.name?.charAt(0) || 'B'}
          </Text>
        </View>
      </View>
      <View style={styles.beyInfo}>
        <Text style={styles.beyName} numberOfLines={1}>
          {bey.name}
        </Text>
        <Text style={styles.beyTitle} numberOfLines={1}>
          {bey.title || 'Bey of Tunis'}
        </Text>
        <View style={styles.beyMeta}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={styles.beyDates}>
            {bey.reignStart || '?'} - {bey.reignEnd || '?'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.title}>Tunisian Beys</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Beys..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
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
            All ({beys.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedDynasty === 'mouradite' && styles.filterButtonActive,
            { backgroundColor: selectedDynasty === 'mouradite' ? colors.secondary : colors.card },
          ]}
          onPress={() => setSelectedDynasty('mouradite')}
        >
          <Text
            style={[
              styles.filterText,
              selectedDynasty === 'mouradite' && styles.filterTextActive,
            ]}
          >
            Mouradite
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedDynasty === 'husseinite' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedDynasty('husseinite')}
        >
          <Text
            style={[
              styles.filterText,
              selectedDynasty === 'husseinite' && styles.filterTextActive,
            ]}
          >
            Husseinite
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {filteredBeys.length} Bey{filteredBeys.length !== 1 ? 's' : ''} • 364 years of history
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Timeline')}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Beys Grid */}
      <FlatList
        data={filteredBeys}
        renderItem={renderBeyCard}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchBeys}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Beys found</Text>
            <Text style={styles.emptyText}>Try adjusting your search</Text>
          </View>
        }
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
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
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  statsText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  row: {
    justifyContent: 'space-between',
  },
  beyCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  beyImageContainer: {
    position: 'relative',
  },
  beyImage: {
    height: 120,
    width: '100%',
    backgroundColor: colors.backgroundDark,
  },
  beyImagePlaceholder: {
    height: 120,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dynastyBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dynastyBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  beyInfo: {
    padding: spacing.sm,
  },
  beyName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  beyTitle: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  beyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  beyDates: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { useMuseumStore } from '../../store/museumStore';
import { API_URL } from '../../services/api';

// Get base URL for images (remove /api suffix)
const IMAGE_BASE_URL = API_URL.replace('/api', '');

export default function ExploreScreen({ navigation }) {
  const { nearbyMuseums, isLoading, fetchNearbyMuseums } = useMuseumStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMuseums, setFilteredMuseums] = useState([]);

  useEffect(() => {
    fetchNearbyMuseums();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = nearbyMuseums.filter(
        (museum) =>
          museum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          museum.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMuseums(filtered);
    } else {
      setFilteredMuseums(nearbyMuseums);
    }
  }, [searchQuery, nearbyMuseums]);

  const renderMuseumCard = ({ item: museum }) => {
    const imageUrl = museum.images?.[0]?.url || museum.images?.[0];
    return (
    <TouchableOpacity
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
          <Ionicons name="business" size={48} color={colors.primary} />
        </View>
      )}
      <View style={styles.museumContent}>
        <View style={styles.museumHeader}>
          <Text style={styles.museumName}>{museum.name}</Text>
          {museum.isOpen && (
            <View style={styles.openBadge}>
              <Text style={styles.openText}>Open</Text>
            </View>
          )}
        </View>
        <View style={styles.museumLocation}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.locationText}>
            {museum.city || 'Tunisia'}
          </Text>
          {museum.distance && (
            <Text style={styles.distanceText}>
              • {museum.distance.toFixed(1)} km
            </Text>
          )}
        </View>
        <Text style={styles.museumDescription} numberOfLines={2}>
          {museum.description || 'Explore the rich history of Tunisian Beys at this museum.'}
        </Text>
        <View style={styles.museumStats}>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={16} color={colors.primary} />
            <Text style={styles.statText}>
              {museum.availableBeys?.length || 0} Beys
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="cube-outline" size={16} color={colors.accent} />
            <Text style={styles.statText}>
              {museum.arHotspots?.length || 9} AR Points
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="star-outline" size={16} color={colors.success} />
            <Text style={styles.statText}>
              {museum.rating || 4.5}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={24}
        color={colors.textMuted}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );};

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore Museums</Text>
        <Text style={styles.subtitle}>
          Discover Tunisian Beylical history
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search museums..."
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

      {/* Filters */}
      <View style={styles.filters}>
        <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]}>
          <Text style={[styles.filterText, styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>Nearby</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>Open Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>Most Beys</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <Text style={styles.resultsText}>
        {filteredMuseums.length} museum{filteredMuseums.length !== 1 ? 's' : ''} found
      </Text>

      {/* Museum List */}
      <FlatList
        data={filteredMuseums}
        renderItem={renderMuseumCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchNearbyMuseums}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No museums found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or enable location services
            </Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textLight,
    marginTop: spacing.xs,
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
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
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
  resultsText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  museumCard: {
    flexDirection: 'row',
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
  museumImagePlaceholder: {
    width: 100,
    height: '100%',
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  museumImage: {
    width: 100,
    height: '100%',
    backgroundColor: colors.backgroundDark,
  },
  museumContent: {
    flex: 1,
    padding: spacing.md,
  },
  museumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  museumName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  openBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  openText: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: '600',
  },
  museumLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  locationText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginLeft: 4,
  },
  distanceText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginLeft: 4,
  },
  museumDescription: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  museumStats: {
    flexDirection: 'row',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginLeft: 4,
  },
  chevron: {
    alignSelf: 'center',
    marginRight: spacing.sm,
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
    textAlign: 'center',
  },
});

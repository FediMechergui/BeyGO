import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { userAPI } from '../../services/api';

export default function LeaderboardScreen({ navigation }) {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    try {
      const response = await userAPI.getLeaderboard(50);
      setLeaderboard(response.data.data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Mock data for demo
      setLeaderboard([
        { _id: '1', username: 'HistoryExplorer', totalPoints: 2500, beysCollected: 15 },
        { _id: '2', username: 'TunisianScholar', totalPoints: 2100, beysCollected: 12 },
        { _id: '3', username: 'MuseumHunter', totalPoints: 1850, beysCollected: 11 },
        { _id: '4', username: 'BeylicalFan', totalPoints: 1600, beysCollected: 9 },
        { _id: '5', username: 'ArtifactSeeker', totalPoints: 1400, beysCollected: 8 },
        { _id: '6', username: user?.username || 'You', totalPoints: user?.totalPoints || 0, beysCollected: user?.beysCollected?.length || 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getUserRank = () => {
    const index = leaderboard.findIndex((u) => u._id === user?._id || u.username === user?.username);
    return index !== -1 ? index + 1 : '-';
  };

  const renderLeaderItem = ({ item, index }) => {
    const isCurrentUser = item._id === user?._id || item.username === user?.username;
    const rank = index + 1;

    return (
      <View
        style={[
          styles.leaderItem,
          isCurrentUser && styles.leaderItemCurrent,
          rank <= 3 && styles.leaderItemTop,
        ]}
      >
        {/* Rank */}
        <View style={styles.rankContainer}>
          {rank === 1 ? (
            <View style={[styles.medalIcon, styles.goldMedal]}>
              <Ionicons name="trophy" size={20} color={colors.textInverse} />
            </View>
          ) : rank === 2 ? (
            <View style={[styles.medalIcon, styles.silverMedal]}>
              <Ionicons name="trophy" size={20} color={colors.textInverse} />
            </View>
          ) : rank === 3 ? (
            <View style={[styles.medalIcon, styles.bronzeMedal]}>
              <Ionicons name="trophy" size={20} color={colors.textInverse} />
            </View>
          ) : (
            <Text style={styles.rankText}>{rank}</Text>
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={[styles.avatar, isCurrentUser && styles.avatarCurrent]}>
            <Text style={[styles.avatarText, isCurrentUser && styles.avatarTextCurrent]}>
              {item.username?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.username, isCurrentUser && styles.usernameCurrent]}>
              {item.username}
              {isCurrentUser && ' (You)'}
            </Text>
            <View style={styles.userStats}>
              <Ionicons name="people" size={12} color={colors.textMuted} />
              <Text style={styles.userStatText}>
                {item.beysCollected?.length || item.beysCollected || 0} Beys
              </Text>
            </View>
          </View>
        </View>

        {/* Points */}
        <View style={styles.pointsContainer}>
          <Text style={[styles.points, isCurrentUser && styles.pointsCurrent]}>
            {item.totalPoints || 0}
          </Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </View>
    );
  };

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
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.placeholder} />
      </View>

      {/* User Rank Card */}
      <View style={styles.userRankCard}>
        <View style={styles.userRankInfo}>
          <Text style={styles.userRankLabel}>Your Rank</Text>
          <Text style={styles.userRankValue}>#{getUserRank()}</Text>
        </View>
        <View style={styles.userRankDivider} />
        <View style={styles.userRankInfo}>
          <Text style={styles.userRankLabel}>Points</Text>
          <Text style={styles.userRankValue}>{user?.totalPoints || 0}</Text>
        </View>
        <View style={styles.userRankDivider} />
        <View style={styles.userRankInfo}>
          <Text style={styles.userRankLabel}>Beys</Text>
          <Text style={styles.userRankValue}>{user?.beysCollected?.length || 0}</Text>
        </View>
      </View>

      {/* Timeframe Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, timeframe === 'week' && styles.filterButtonActive]}
          onPress={() => setTimeframe('week')}
        >
          <Text
            style={[
              styles.filterText,
              timeframe === 'week' && styles.filterTextActive,
            ]}
          >
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, timeframe === 'month' && styles.filterButtonActive]}
          onPress={() => setTimeframe('month')}
        >
          <Text
            style={[
              styles.filterText,
              timeframe === 'month' && styles.filterTextActive,
            ]}
          >
            This Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, timeframe === 'all' && styles.filterButtonActive]}
          onPress={() => setTimeframe('all')}
        >
          <Text
            style={[
              styles.filterText,
              timeframe === 'all' && styles.filterTextActive,
            ]}
          >
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Leaderboard List */}
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderItem}
        keyExtractor={(item, index) => item._id?.toString() || `leader-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchLeaderboard}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="podium-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No rankings yet</Text>
            <Text style={styles.emptyText}>
              Start collecting Beys to appear on the leaderboard
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
  userRankCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  userRankInfo: {
    flex: 1,
    alignItems: 'center',
  },
  userRankLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  userRankValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginTop: 2,
  },
  userRankDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  filterButtonActive: {
    backgroundColor: colors.card,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  leaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  leaderItemCurrent: {
    backgroundColor: colors.primary + '15',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  leaderItemTop: {
    // Optional special styling for top 3
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  medalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldMedal: {
    backgroundColor: '#FFD700',
  },
  silverMedal: {
    backgroundColor: '#C0C0C0',
  },
  bronzeMedal: {
    backgroundColor: '#CD7F32',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCurrent: {
    backgroundColor: colors.primary,
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  avatarTextCurrent: {
    color: colors.textInverse,
  },
  userDetails: {
    marginLeft: spacing.sm,
  },
  username: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  usernameCurrent: {
    color: colors.primary,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userStatText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginLeft: 4,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  pointsCurrent: {
    color: colors.primary,
  },
  pointsLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
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

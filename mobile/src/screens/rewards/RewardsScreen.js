import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { rewardAPI, userAPI } from '../../services/api';

export default function RewardsScreen({ navigation }) {
  const { user } = useAuthStore();
  const [rewards, setRewards] = useState([]);
  const [userRewards, setUserRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const [rewardsRes, userRewardsRes] = await Promise.all([
        rewardAPI.getAll(),
        userAPI.getRewards(),
      ]);
      setRewards(rewardsRes.data.data || []);
      setUserRewards(userRewardsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (rewardId, pointsCost) => {
    if ((user?.totalPoints || 0) < pointsCost) {
      Alert.alert(
        'Insufficient Points',
        `You need ${pointsCost - (user?.totalPoints || 0)} more points to redeem this reward.`
      );
      return;
    }

    Alert.alert(
      'Redeem Reward',
      `This will cost ${pointsCost} points. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              await rewardAPI.redeem(rewardId);
              Alert.alert('Success!', 'Reward redeemed successfully!');
              fetchRewards();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to redeem reward');
            }
          },
        },
      ]
    );
  };

  const renderRewardCard = ({ item: reward }) => {
    const canRedeem = (user?.totalPoints || 0) >= reward.pointsCost;

    return (
      <View style={styles.rewardCard}>
        <View style={styles.rewardIcon}>
          <Ionicons
            name={getRewardIcon(reward.type)}
            size={32}
            color={colors.primary}
          />
        </View>
        <View style={styles.rewardContent}>
          <Text style={styles.rewardName}>{reward.name}</Text>
          <Text style={styles.rewardDescription} numberOfLines={2}>
            {reward.description}
          </Text>
          <View style={styles.rewardMeta}>
            <View style={styles.rewardPoints}>
              <Ionicons name="star" size={14} color={colors.accent} />
              <Text style={styles.pointsText}>{reward.pointsCost} points</Text>
            </View>
            {reward.quantity !== undefined && (
              <Text style={styles.quantityText}>
                {reward.quantity} remaining
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.redeemButton,
            !canRedeem && styles.redeemButtonDisabled,
          ]}
          onPress={() => handleRedeemReward(reward._id, reward.pointsCost)}
          disabled={!canRedeem}
        >
          <Text
            style={[
              styles.redeemButtonText,
              !canRedeem && styles.redeemButtonTextDisabled,
            ]}
          >
            Redeem
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderUserRewardCard = ({ item: userReward }) => (
    <View style={styles.userRewardCard}>
      <View style={styles.rewardIcon}>
        <Ionicons
          name={getRewardIcon(userReward.reward?.type)}
          size={32}
          color={userReward.isUsed ? colors.textMuted : colors.success}
        />
      </View>
      <View style={styles.rewardContent}>
        <Text style={styles.rewardName}>{userReward.reward?.name}</Text>
        <Text style={styles.rewardDescription} numberOfLines={1}>
          Code: {userReward.redemptionCode}
        </Text>
        <Text style={styles.rewardDate}>
          Redeemed: {new Date(userReward.redeemedAt).toLocaleDateString()}
        </Text>
      </View>
      {userReward.isUsed ? (
        <View style={styles.usedBadge}>
          <Text style={styles.usedBadgeText}>Used</Text>
        </View>
      ) : (
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>Active</Text>
        </View>
      )}
    </View>
  );

  const getRewardIcon = (type) => {
    switch (type) {
      case 'discount':
        return 'pricetag';
      case 'free_entry':
        return 'ticket';
      case 'merchandise':
        return 'gift';
      case 'experience':
        return 'sparkles';
      default:
        return 'star';
    }
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
        <Text style={styles.title}>Rewards</Text>
        <View style={styles.pointsBadge}>
          <Ionicons name="star" size={16} color={colors.accent} />
          <Text style={styles.pointsBadgeText}>{user?.totalPoints || 0}</Text>
        </View>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.totalPoints || 0}</Text>
          <Text style={styles.statLabel}>Available Points</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userRewards.length}</Text>
          <Text style={styles.statLabel}>Rewards Earned</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.tabActive]}
          onPress={() => setActiveTab('available')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'available' && styles.tabTextActive,
            ]}
          >
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my_rewards' && styles.tabActive]}
          onPress={() => setActiveTab('my_rewards')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'my_rewards' && styles.tabTextActive,
            ]}
          >
            My Rewards
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'available' ? (
        <FlatList
          data={rewards}
          renderItem={renderRewardCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchRewards}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No rewards available</Text>
              <Text style={styles.emptyText}>
                Check back later for new rewards
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={userRewards}
          renderItem={renderUserRewardCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchRewards}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No rewards yet</Text>
              <Text style={styles.emptyText}>
                Collect more points to redeem rewards
              </Text>
            </View>
          }
        />
      )}
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
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  pointsBadgeText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.accent,
    marginLeft: spacing.xs,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.card,
  },
  tabText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  rewardCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  rewardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  rewardName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  rewardDescription: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: 2,
  },
  rewardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  rewardPoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
    marginLeft: 4,
  },
  quantityText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginLeft: spacing.md,
  },
  redeemButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  redeemButtonDisabled: {
    backgroundColor: colors.backgroundDark,
  },
  redeemButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textInverse,
  },
  redeemButtonTextDisabled: {
    color: colors.textMuted,
  },
  userRewardCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  rewardDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  usedBadge: {
    backgroundColor: colors.backgroundDark,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  usedBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: colors.success + '20',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  activeBadgeText: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: '600',
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

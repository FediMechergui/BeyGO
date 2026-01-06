import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius: radius = borderRadius.md,
  style,
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Preset skeleton patterns
export function SkeletonCard({ style }) {
  return (
    <View style={[styles.card, style]}>
      <SkeletonLoader width="100%" height={150} borderRadius={0} />
      <View style={styles.cardContent}>
        <SkeletonLoader width="70%" height={20} />
        <SkeletonLoader width="50%" height={14} style={{ marginTop: spacing.sm }} />
        <SkeletonLoader width="90%" height={14} style={{ marginTop: spacing.md }} />
        <SkeletonLoader width="80%" height={14} style={{ marginTop: spacing.xs }} />
      </View>
    </View>
  );
}

export function SkeletonListItem({ style }) {
  return (
    <View style={[styles.listItem, style]}>
      <SkeletonLoader width={50} height={50} borderRadius={25} />
      <View style={styles.listItemContent}>
        <SkeletonLoader width="60%" height={16} />
        <SkeletonLoader width="40%" height={12} style={{ marginTop: spacing.xs }} />
      </View>
    </View>
  );
}

export function SkeletonMuseumCard({ style }) {
  return (
    <View style={[styles.museumCard, style]}>
      <SkeletonLoader width={100} height="100%" borderRadius={0} />
      <View style={styles.museumCardContent}>
        <SkeletonLoader width="80%" height={18} />
        <SkeletonLoader width="50%" height={12} style={{ marginTop: spacing.xs }} />
        <SkeletonLoader width="100%" height={12} style={{ marginTop: spacing.sm }} />
        <SkeletonLoader width="70%" height={12} style={{ marginTop: spacing.xs }} />
        <View style={styles.museumCardStats}>
          <SkeletonLoader width={60} height={14} />
          <SkeletonLoader width={60} height={14} />
          <SkeletonLoader width={40} height={14} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonBeyCard({ style }) {
  return (
    <View style={[styles.beyCard, style]}>
      <SkeletonLoader width="100%" height={120} borderRadius={0} />
      <View style={styles.beyCardContent}>
        <SkeletonLoader width="70%" height={16} />
        <SkeletonLoader width="50%" height={12} style={{ marginTop: spacing.xs }} />
        <SkeletonLoader width="60%" height={10} style={{ marginTop: spacing.xs }} />
      </View>
    </View>
  );
}

export function SkeletonProfile({ style }) {
  return (
    <View style={[styles.profile, style]}>
      <View style={styles.profileHeader}>
        <SkeletonLoader width={100} height={100} borderRadius={50} />
        <SkeletonLoader width={150} height={24} style={{ marginTop: spacing.md }} />
        <SkeletonLoader width={200} height={14} style={{ marginTop: spacing.xs }} />
      </View>
      <View style={styles.profileStats}>
        <View style={styles.profileStat}>
          <SkeletonLoader width={40} height={24} />
          <SkeletonLoader width={60} height={12} style={{ marginTop: spacing.xs }} />
        </View>
        <View style={styles.profileStat}>
          <SkeletonLoader width={40} height={24} />
          <SkeletonLoader width={60} height={12} style={{ marginTop: spacing.xs }} />
        </View>
        <View style={styles.profileStat}>
          <SkeletonLoader width={40} height={24} />
          <SkeletonLoader width={60} height={12} style={{ marginTop: spacing.xs }} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonPuzzle({ style }) {
  return (
    <View style={[styles.puzzle, style]}>
      <View style={styles.puzzleGrid}>
        {[...Array(9)].map((_, index) => (
          <SkeletonLoader
            key={index}
            width={(SCREEN_WIDTH - spacing.lg * 4) / 3}
            height={(SCREEN_WIDTH - spacing.lg * 4) / 3}
            style={styles.puzzlePiece}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.backgroundDark,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardContent: {
    padding: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  listItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  museumCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    height: 130,
  },
  museumCardContent: {
    flex: 1,
    padding: spacing.md,
  },
  museumCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  beyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    width: (SCREEN_WIDTH - spacing.lg * 3) / 2,
  },
  beyCardContent: {
    padding: spacing.sm,
  },
  profile: {
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  profileStat: {
    alignItems: 'center',
  },
  puzzle: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  puzzleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  puzzlePiece: {
    margin: spacing.xs,
  },
});

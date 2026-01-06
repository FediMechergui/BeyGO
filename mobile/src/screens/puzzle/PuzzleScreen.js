import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { useMuseumStore } from '../../store/museumStore';
import { usePuzzleStore } from '../../stores/puzzleStore';

const { width } = Dimensions.get('window');
const PUZZLE_SIZE = width - spacing.lg * 2;
const PIECE_SIZE = (PUZZLE_SIZE - 12) / 3;

export default function PuzzleScreen({ route, navigation }) {
  const { challengeId, bey, beyId } = route.params || {};
  const { activeChallenge, collectPiece, useHint } = useMuseumStore();
  const { lastCollectedPiece, pieceCollectionTimestamp, clearPieceNotification } = usePuzzleStore();
  const lastProcessedTimestamp = useRef(null);
  
  const [pieces, setPieces] = useState([
    false, false, false,
    false, false, false,
    false, false, false,
  ]);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [showAnimation] = useState(new Animated.Value(0));
  const [completionAnimation] = useState(new Animated.Value(0));

  // Listen for piece collection from AR camera via store
  useEffect(() => {
    if (lastCollectedPiece && pieceCollectionTimestamp && 
        pieceCollectionTimestamp !== lastProcessedTimestamp.current) {
      lastProcessedTimestamp.current = pieceCollectionTimestamp;
      handlePieceCollected(lastCollectedPiece);
      clearPieceNotification();
    }
  }, [lastCollectedPiece, pieceCollectionTimestamp]);

  useEffect(() => {
    if (activeChallenge?.piecesCollected) {
      const newPieces = [...pieces];
      activeChallenge.piecesCollected.forEach((piece) => {
        if (piece.pieceNumber >= 1 && piece.pieceNumber <= 9) {
          newPieces[piece.pieceNumber - 1] = true;
        }
      });
      setPieces(newPieces);
      setHintsRemaining(3 - (activeChallenge.hintsUsed || 0));
    }
  }, [activeChallenge]);

  useEffect(() => {
    // Check if puzzle is complete
    if (pieces.every((p) => p)) {
      animateCompletion();
    }
  }, [pieces]);

  const animateCompletion = () => {
    Animated.sequence([
      Animated.timing(completionAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Alert.alert(
        '🎉 Congratulations!',
        `You've completed the puzzle and collected ${bey?.name || 'this Bey'}!`,
        [
          {
            text: 'View Collection',
            onPress: () => navigation.navigate('Profile'),
          },
          {
            text: 'Continue Exploring',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    });
  };

  const handleOpenCamera = () => {
    navigation.navigate('ARCamera', {
      challengeId: challengeId || activeChallenge?._id,
      bey,
    });
  };

  const handlePieceCollected = (pieceNumber) => {
    const newPieces = [...pieces];
    newPieces[pieceNumber - 1] = true;
    setPieces(newPieces);
    
    // Animate the collected piece
    Animated.sequence([
      Animated.timing(showAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(showAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleUseHint = async () => {
    if (hintsRemaining <= 0) {
      Alert.alert('No Hints Left', 'You have used all your hints for this puzzle.');
      return;
    }

    const result = await useHint(challengeId || activeChallenge?._id);
    if (result.success) {
      setHintsRemaining((prev) => prev - 1);
      Alert.alert(
        'Hint',
        result.data.hint || 'Look for the AR marker near the main exhibit!',
      );
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const collectedCount = pieces.filter((p) => p).length;
  const progress = (collectedCount / 9) * 100;

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
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Puzzle Challenge</Text>
          <Text style={styles.subtitle}>{bey?.name || 'Collect the Bey'}</Text>
        </View>
        <TouchableOpacity style={styles.hintButton} onPress={handleUseHint}>
          <Ionicons name="bulb" size={20} color={colors.accent} />
          <Text style={styles.hintCount}>{hintsRemaining}</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {collectedCount}/9 pieces collected
          </Text>
          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Puzzle Grid */}
      <View style={styles.puzzleContainer}>
        <View style={styles.puzzleFrame}>
          <View style={styles.puzzleGrid}>
            {pieces.map((collected, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.puzzlePiece,
                  collected && styles.puzzlePieceCollected,
                  collected && {
                    transform: [
                      {
                        scale: completionAnimation.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [1, 1.1, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {collected ? (
                  <View style={styles.pieceContent}>
                    <Ionicons name="checkmark" size={24} color={colors.textInverse} />
                    <Text style={styles.pieceNumber}>{index + 1}</Text>
                  </View>
                ) : (
                  <View style={styles.pieceEmpty}>
                    <Text style={styles.pieceNumberEmpty}>{index + 1}</Text>
                    <Ionicons name="help" size={20} color={colors.textMuted} />
                  </View>
                )}
              </Animated.View>
            ))}
          </View>
        </View>
      </View>

      {/* Bey Info */}
      <View style={styles.beyInfo}>
        <View style={styles.beyIcon}>
          <Ionicons name="person" size={32} color={colors.primary} />
        </View>
        <View style={styles.beyDetails}>
          <Text style={styles.beyName}>{bey?.name || 'Unknown Bey'}</Text>
          <Text style={styles.beyDynasty}>
            {bey?.dynasty?.name || 'Tunisian Dynasty'}
          </Text>
        </View>
        <View style={styles.pointsBadge}>
          <Ionicons name="star" size={16} color={colors.accent} />
          <Text style={styles.pointsText}>100</Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <View style={styles.instructionItem}>
          <View style={styles.instructionIcon}>
            <Ionicons name="walk" size={20} color={colors.primary} />
          </View>
          <Text style={styles.instructionText}>
            Explore the museum to find AR markers
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <View style={styles.instructionIcon}>
            <Ionicons name="camera" size={20} color={colors.primary} />
          </View>
          <Text style={styles.instructionText}>
            Scan markers with the AR camera
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <View style={styles.instructionIcon}>
            <Ionicons name="grid" size={20} color={colors.primary} />
          </View>
          <Text style={styles.instructionText}>
            Collect all 9 pieces to complete
          </Text>
        </View>
      </View>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.scanButton} onPress={handleOpenCamera}>
          <Ionicons name="camera" size={24} color={colors.textInverse} />
          <Text style={styles.scanButtonText}>Open AR Scanner</Text>
        </TouchableOpacity>
      </View>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  hintCount: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.accent,
    marginLeft: spacing.xs,
  },
  progressSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
  progressPercent: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.backgroundDark,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  puzzleContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  puzzleFrame: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  puzzleGrid: {
    width: PUZZLE_SIZE - spacing.md * 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  puzzlePiece: {
    width: PIECE_SIZE - 4,
    height: PIECE_SIZE - 4,
    margin: 2,
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  puzzlePieceCollected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderStyle: 'solid',
  },
  pieceContent: {
    alignItems: 'center',
  },
  pieceNumber: {
    fontSize: fontSize.xs,
    color: colors.textInverse,
    marginTop: 2,
  },
  pieceEmpty: {
    alignItems: 'center',
  },
  pieceNumberEmpty: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.textMuted,
    marginBottom: 2,
  },
  beyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  beyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  beyDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  beyName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  beyDynasty: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '15',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  pointsText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.accent,
    marginLeft: 4,
  },
  instructions: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  instructionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  instructionText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
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
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scanButtonText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginLeft: spacing.sm,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { shuffleArray } from '../../utils/helpers';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - spacing.lg * 2 - spacing.md * 3) / 4;

export const MemoryMatch = ({
  items,
  onComplete,
  onProgress,
  timeLimit,
  gridCols = 4,
}) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isLocked, setIsLocked] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, [items]);

  // Timer
  useEffect(() => {
    if (!timeLimit || gameComplete) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimit, gameComplete]);

  const initializeGame = () => {
    // Create pairs of cards
    const cardPairs = items.flatMap((item, index) => [
      { ...item, pairId: index, uniqueId: `${index}-a` },
      { ...item, pairId: index, uniqueId: `${index}-b` },
    ]);
    
    setCards(shuffleArray(cardPairs));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setTimeLeft(timeLimit);
    setGameComplete(false);
  };

  const handleCardPress = useCallback((index) => {
    if (isLocked || flipped.includes(index) || matched.includes(cards[index]?.pairId)) {
      return;
    }

    Haptics.selectionAsync();
    
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      setIsLocked(true);

      const [firstIndex, secondIndex] = newFlipped;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (firstCard.pairId === secondCard.pairId) {
        // Match found
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newMatched = [...matched, firstCard.pairId];
        setMatched(newMatched);
        setFlipped([]);
        setIsLocked(false);

        // Check completion
        if (newMatched.length === items.length) {
          setGameComplete(true);
          onComplete?.({ moves: moves + 1, timeLeft, matchedPairs: newMatched.length });
        } else {
          onProgress?.(newMatched.length / items.length);
        }
      } else {
        // No match - flip back
        setTimeout(() => {
          setFlipped([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  }, [flipped, matched, cards, isLocked, moves, items.length, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCard = (card, index) => {
    const isFlipped = flipped.includes(index) || matched.includes(card.pairId);
    const isMatched = matched.includes(card.pairId);

    return (
      <TouchableOpacity
        key={card.uniqueId}
        style={[
          styles.card,
          { width: CARD_SIZE, height: CARD_SIZE * 1.3 },
          isFlipped && styles.cardFlipped,
          isMatched && styles.cardMatched,
        ]}
        onPress={() => handleCardPress(index)}
        activeOpacity={0.8}
        disabled={isLocked || isMatched}
      >
        {isFlipped ? (
          <View style={styles.cardFront}>
            {card.icon ? (
              <Ionicons name={card.icon} size={32} color={colors.primary} />
            ) : (
              <Text style={styles.cardText}>{card.name}</Text>
            )}
            {card.subtitle && (
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {card.subtitle}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.cardBack}>
            <Ionicons name="help" size={28} color={colors.textLight} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.stat}>
          <Ionicons name="swap-horizontal" size={20} color={colors.textLight} />
          <Text style={styles.statText}>{moves} moves</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.statText}>{matched.length}/{items.length}</Text>
        </View>
        {timeLimit && (
          <View style={[styles.stat, timeLeft < 30 && styles.statWarning]}>
            <Ionicons name="time" size={20} color={timeLeft < 30 ? colors.error : colors.textLight} />
            <Text style={[styles.statText, timeLeft < 30 && styles.statTextWarning]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.grid}>
        {cards.map((card, index) => renderCard(card, index))}
      </View>

      {gameComplete && (
        <View style={styles.completedOverlay}>
          <Ionicons name="trophy" size={60} color={colors.accent} />
          <Text style={styles.completedTitle}>All Pairs Found!</Text>
          <Text style={styles.completedStats}>
            Completed in {moves} moves
            {timeLimit && ` with ${formatTime(timeLeft)} remaining`}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.resetButton} onPress={initializeGame}>
        <Ionicons name="refresh" size={20} color={colors.textInverse} />
        <Text style={styles.resetButtonText}>New Game</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statWarning: {
    backgroundColor: colors.error + '20',
  },
  statText: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  statTextWarning: {
    color: colors.error,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    margin: 2,
  },
  cardBack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  cardFront: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.xs,
  },
  cardFlipped: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cardMatched: {
    borderColor: colors.success,
    opacity: 0.7,
  },
  cardText: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 2,
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  completedTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginTop: spacing.md,
  },
  completedStats: {
    fontSize: fontSize.md,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  resetButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
    marginLeft: spacing.xs,
  },
});

export default MemoryMatch;

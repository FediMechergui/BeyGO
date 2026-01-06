import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { shuffleArray } from '../../utils/helpers';

const { width } = Dimensions.get('window');
const PUZZLE_SIZE = width - spacing.lg * 2;

export const JigsawPuzzle = ({
  image,
  gridSize = 3,
  onComplete,
  onProgress,
  timeLimit,
  showPreview = true,
}) => {
  const [pieces, setPieces] = useState([]);
  const [solved, setSolved] = useState(false);
  const [moves, setMoves] = useState(0);
  const [showingPreview, setShowingPreview] = useState(showPreview);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const pieceSize = PUZZLE_SIZE / gridSize;
  const animatedValues = useRef([]);

  // Initialize puzzle
  useEffect(() => {
    initializePuzzle();
  }, [image, gridSize]);

  // Timer
  useEffect(() => {
    if (!timeLimit || solved || showingPreview) return;

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
  }, [timeLimit, solved, showingPreview]);

  const initializePuzzle = () => {
    const totalPieces = gridSize * gridSize;
    const pieceArray = [];
    animatedValues.current = [];

    for (let i = 0; i < totalPieces; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      animatedValues.current.push(new Animated.ValueXY({ x: 0, y: 0 }));
      pieceArray.push({
        id: i,
        correctRow: row,
        correctCol: col,
        currentRow: row,
        currentCol: col,
        isCorrect: true,
      });
    }

    // Shuffle pieces
    const shuffledPositions = shuffleArray(
      pieceArray.map((p) => ({ row: p.currentRow, col: p.currentCol }))
    );
    
    const shuffledPieces = pieceArray.map((piece, index) => ({
      ...piece,
      currentRow: shuffledPositions[index].row,
      currentCol: shuffledPositions[index].col,
      isCorrect:
        piece.correctRow === shuffledPositions[index].row &&
        piece.correctCol === shuffledPositions[index].col,
    }));

    setPieces(shuffledPieces);
    setSolved(false);
    setMoves(0);
  };

  const handlePiecePress = (pieceIndex) => {
    if (solved) return;
    Haptics.selectionAsync();
    
    // Find empty space or swap with adjacent
    const piece = pieces[pieceIndex];
    const adjacentPieces = pieces.filter(
      (p) =>
        p.id !== piece.id &&
        ((Math.abs(p.currentRow - piece.currentRow) === 1 &&
          p.currentCol === piece.currentCol) ||
          (Math.abs(p.currentCol - piece.currentCol) === 1 &&
            p.currentRow === piece.currentRow))
    );

    if (adjacentPieces.length > 0) {
      // Swap with first adjacent piece
      swapPieces(pieceIndex, pieces.findIndex((p) => p.id === adjacentPieces[0].id));
    }
  };

  const swapPieces = (index1, index2) => {
    const newPieces = [...pieces];
    const piece1 = newPieces[index1];
    const piece2 = newPieces[index2];

    const temp = { row: piece1.currentRow, col: piece1.currentCol };
    piece1.currentRow = piece2.currentRow;
    piece1.currentCol = piece2.currentCol;
    piece2.currentRow = temp.row;
    piece2.currentCol = temp.col;

    // Check if pieces are in correct position
    piece1.isCorrect =
      piece1.correctRow === piece1.currentRow &&
      piece1.correctCol === piece1.currentCol;
    piece2.isCorrect =
      piece2.correctRow === piece2.currentRow &&
      piece2.correctCol === piece2.currentCol;

    setPieces(newPieces);
    setMoves((prev) => prev + 1);

    // Check completion
    const allCorrect = newPieces.every((p) => p.isCorrect);
    if (allCorrect) {
      setSolved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete?.({ moves: moves + 1, timeLeft });
    } else {
      const progress = newPieces.filter((p) => p.isCorrect).length / newPieces.length;
      onProgress?.(progress);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showingPreview) {
    return (
      <View style={styles.container}>
        <Text style={styles.previewTitle}>Memorize the Image</Text>
        <Image source={image} style={styles.previewImage} resizeMode="cover" />
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => setShowingPreview(false)}
        >
          <Text style={styles.startButtonText}>Start Puzzle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.stat}>
          <Ionicons name="swap-horizontal" size={20} color={colors.textLight} />
          <Text style={styles.statText}>{moves} moves</Text>
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

      <View style={[styles.puzzleContainer, { width: PUZZLE_SIZE, height: PUZZLE_SIZE }]}>
        {pieces.map((piece, index) => (
          <TouchableOpacity
            key={piece.id}
            style={[
              styles.piece,
              {
                width: pieceSize - 2,
                height: pieceSize - 2,
                left: piece.currentCol * pieceSize + 1,
                top: piece.currentRow * pieceSize + 1,
              },
              piece.isCorrect && styles.pieceCorrect,
            ]}
            onPress={() => handlePiecePress(index)}
            activeOpacity={0.8}
          >
            <Image
              source={image}
              style={{
                width: PUZZLE_SIZE,
                height: PUZZLE_SIZE,
                marginLeft: -piece.correctCol * pieceSize,
                marginTop: -piece.correctRow * pieceSize,
              }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>

      {solved && (
        <View style={styles.completedOverlay}>
          <Ionicons name="trophy" size={60} color={colors.accent} />
          <Text style={styles.completedTitle}>Puzzle Complete!</Text>
          <Text style={styles.completedStats}>
            Solved in {moves} moves
            {timeLimit && ` with ${formatTime(timeLeft)} remaining`}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.resetButton} onPress={initializePuzzle}>
        <Ionicons name="refresh" size={20} color={colors.textInverse} />
        <Text style={styles.resetButtonText}>Reset Puzzle</Text>
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
    justifyContent: 'space-between',
    width: PUZZLE_SIZE,
    marginBottom: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  statWarning: {
    backgroundColor: colors.error + '20',
  },
  statText: {
    fontSize: fontSize.md,
    color: colors.text,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  statTextWarning: {
    color: colors.error,
  },
  previewTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  previewImage: {
    width: PUZZLE_SIZE,
    height: PUZZLE_SIZE,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  startButtonText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  puzzleContainer: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  piece: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  pieceCorrect: {
    borderColor: colors.success,
    borderWidth: 2,
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

export default JigsawPuzzle;

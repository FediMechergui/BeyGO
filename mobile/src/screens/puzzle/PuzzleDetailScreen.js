import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { usePuzzleStore } from '../../stores/puzzleStore';
import { useProgressStore } from '../../stores/progressStore';
import { JigsawPuzzle, MemoryMatch, QuizGame, TimelineSort } from '../../components/games';

const PuzzleDetailScreen = ({ navigation, route }) => {
  const { puzzleId } = route.params;
  const { currentPuzzle, fetchPuzzleById, loading, startPuzzle, completePuzzle } = usePuzzleStore();
  const { addCoins, addXp } = useProgressStore();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  useEffect(() => {
    fetchPuzzleById(puzzleId);
  }, [puzzleId]);

  const handleStartGame = async () => {
    await startPuzzle(puzzleId);
    setGameStarted(true);
  };

  const handleGameComplete = async (result) => {
    setGameComplete(true);
    
    // Calculate rewards based on performance
    const baseCoins = currentPuzzle.reward?.coins || 50;
    const baseXp = currentPuzzle.reward?.xp || 100;
    
    let multiplier = 1;
    if (result.timeLeft && result.timeLeft > 0) {
      multiplier += 0.5; // Bonus for finishing with time
    }
    if (result.moves && result.moves < 20) {
      multiplier += 0.3; // Bonus for efficient solving
    }

    const earnedCoins = Math.round(baseCoins * multiplier);
    const earnedXp = Math.round(baseXp * multiplier);

    await completePuzzle(puzzleId, {
      ...result,
      coinsEarned: earnedCoins,
      xpEarned: earnedXp,
    });

    addCoins(earnedCoins);
    addXp(earnedXp);

    Alert.alert(
      '🎉 Puzzle Complete!',
      `You earned ${earnedCoins} coins and ${earnedXp} XP!`,
      [
        {
          text: 'Continue',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleGameProgress = (progress) => {
    // Track progress for analytics
    console.log(`Game progress: ${Math.round(progress * 100)}%`);
  };

  const renderGame = () => {
    if (!currentPuzzle) return null;

    switch (currentPuzzle.type) {
      case 'jigsaw':
        return (
          <JigsawPuzzle
            image={{ uri: currentPuzzle.image }}
            gridSize={currentPuzzle.difficulty === 'easy' ? 3 : currentPuzzle.difficulty === 'medium' ? 4 : 5}
            onComplete={handleGameComplete}
            onProgress={handleGameProgress}
            timeLimit={currentPuzzle.timeLimit}
            showPreview={true}
          />
        );

      case 'memory':
        return (
          <MemoryMatch
            items={currentPuzzle.items || generateMemoryItems(currentPuzzle)}
            onComplete={handleGameComplete}
            onProgress={handleGameProgress}
            timeLimit={currentPuzzle.timeLimit}
            gridCols={4}
          />
        );

      case 'quiz':
        return (
          <QuizGame
            questions={currentPuzzle.questions || generateQuizQuestions(currentPuzzle)}
            onComplete={handleGameComplete}
            onProgress={handleGameProgress}
            timePerQuestion={30}
            showExplanations={true}
          />
        );

      case 'timeline':
        return (
          <TimelineSort
            events={currentPuzzle.events || generateTimelineEvents(currentPuzzle)}
            onComplete={handleGameComplete}
            onProgress={handleGameProgress}
            timeLimit={currentPuzzle.timeLimit}
          />
        );

      default:
        return (
          <View style={styles.unsupportedGame}>
            <Ionicons name="construct" size={48} color={colors.textMuted} />
            <Text style={styles.unsupportedText}>
              This game type is coming soon!
            </Text>
          </View>
        );
    }
  };

  // Generate default memory items from puzzle data
  const generateMemoryItems = (puzzle) => {
    return [
      { name: 'Murad I', icon: 'person', subtitle: 'Founder' },
      { name: 'Hussein I', icon: 'crown', subtitle: 'New Dynasty' },
      { name: 'Bardo', icon: 'business', subtitle: 'Museum' },
      { name: 'Kasbah', icon: 'flag', subtitle: 'Fortress' },
      { name: '1705', icon: 'calendar', subtitle: 'Key Year' },
      { name: 'Tunisia', icon: 'map', subtitle: 'Country' },
    ];
  };

  // Generate default quiz questions
  const generateQuizQuestions = (puzzle) => {
    return [
      {
        id: 1,
        question: 'Which dynasty founded the Beylicate of Tunis?',
        options: ['Muradid', 'Husseinite', 'Ottoman', 'Hafsid'],
        correctAnswer: 0,
        explanation: 'The Muradid dynasty, founded by Murad I Bey, established the Beylicate of Tunis in 1613.',
      },
      {
        id: 2,
        question: 'When did the Husseinite dynasty begin?',
        options: ['1593', '1705', '1815', '1881'],
        correctAnswer: 1,
        explanation: 'Hussein I Bey founded the Husseinite dynasty in 1705 after overthrowing the Muradids.',
      },
      {
        id: 3,
        question: 'What museum houses the largest collection of Beylical artifacts?',
        options: ['Louvre', 'British Museum', 'Bardo Museum', 'Cairo Museum'],
        correctAnswer: 2,
        explanation: 'The Bardo National Museum in Tunis contains extensive collections from the Beylical period.',
      },
    ];
  };

  // Generate default timeline events
  const generateTimelineEvents = (puzzle) => {
    return [
      { id: 1, year: 1593, title: 'Muradid Dynasty begins', description: 'Murad I becomes first Bey', isImportant: true },
      { id: 2, year: 1705, title: 'Husseinite Dynasty begins', description: 'Hussein I takes power', isImportant: true },
      { id: 3, year: 1815, title: 'Mahmud II reforms', description: 'Modernization efforts begin' },
      { id: 4, year: 1881, title: 'French Protectorate', description: 'Tunisia under French control' },
      { id: 5, year: 1957, title: 'Republic declared', description: 'End of Beylicate', isImportant: true },
    ];
  };

  if (loading || !currentPuzzle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading puzzle...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (gameStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.gameHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Alert.alert(
                'Exit Puzzle?',
                'Your progress will be lost.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Exit', style: 'destructive', onPress: () => setGameStarted(false) },
                ]
              );
            }}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.gameTitle}>{currentPuzzle.name}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.gameContainer}>
          {renderGame()}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {currentPuzzle.image && (
          <Image
            source={{ uri: currentPuzzle.image }}
            style={styles.puzzleImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          <View style={styles.typeTag}>
            <Ionicons
              name={
                currentPuzzle.type === 'jigsaw' ? 'grid' :
                currentPuzzle.type === 'memory' ? 'albums' :
                currentPuzzle.type === 'quiz' ? 'help-circle' :
                'time'
              }
              size={16}
              color={colors.primary}
            />
            <Text style={styles.typeText}>
              {currentPuzzle.type?.charAt(0).toUpperCase() + currentPuzzle.type?.slice(1)} Puzzle
            </Text>
          </View>

          <Text style={styles.title}>{currentPuzzle.name}</Text>
          <Text style={styles.description}>{currentPuzzle.description}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="speedometer" size={24} color={colors.primary} />
              <Text style={styles.infoLabel}>Difficulty</Text>
              <Text style={styles.infoValue}>
                {currentPuzzle.difficulty?.charAt(0).toUpperCase() + currentPuzzle.difficulty?.slice(1)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={24} color={colors.warning} />
              <Text style={styles.infoLabel}>Time Limit</Text>
              <Text style={styles.infoValue}>
                {currentPuzzle.timeLimit ? `${Math.floor(currentPuzzle.timeLimit / 60)}:${(currentPuzzle.timeLimit % 60).toString().padStart(2, '0')}` : 'No limit'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="star" size={24} color={colors.accent} />
              <Text style={styles.infoLabel}>Reward</Text>
              <Text style={styles.infoValue}>
                {currentPuzzle.reward?.coins || 50} coins
              </Text>
            </View>
          </View>

          {currentPuzzle.hints && currentPuzzle.hints.length > 0 && (
            <View style={styles.hintsSection}>
              <Text style={styles.sectionTitle}>Hints</Text>
              {currentPuzzle.hints.map((hint, index) => (
                <View key={index} style={styles.hintItem}>
                  <Ionicons name="bulb" size={16} color={colors.warning} />
                  <Text style={styles.hintText}>{hint}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartGame}
          >
            <Ionicons name="play" size={24} color={colors.textInverse} />
            <Text style={styles.startButtonText}>Start Puzzle</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puzzleImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.card,
  },
  content: {
    padding: spacing.lg,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  typeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textLight,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
  },
  hintsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  hintText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  startButtonText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginLeft: spacing.sm,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gameTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  gameContainer: {
    flex: 1,
  },
  unsupportedGame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  unsupportedText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

export default PuzzleDetailScreen;

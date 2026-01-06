import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, borderRadius } from '../../theme';

export const QuizGame = ({
  questions,
  onComplete,
  onProgress,
  timePerQuestion = 30,
  showExplanations = true,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [answers, setAnswers] = useState([]);
  const [gameComplete, setGameComplete] = useState(false);

  const question = questions[currentQuestion];

  // Timer
  useEffect(() => {
    if (isAnswered || gameComplete) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, isAnswered, gameComplete]);

  const handleTimeout = () => {
    setIsAnswered(true);
    setAnswers([...answers, { questionId: question.id, answer: null, correct: false }]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const handleAnswer = (answerIndex) => {
    if (isAnswered) return;

    Haptics.selectionAsync();
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);

    const isCorrect = answerIndex === question.correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setAnswers([
      ...answers,
      { questionId: question.id, answer: answerIndex, correct: isCorrect },
    ]);

    onProgress?.((currentQuestion + 1) / questions.length);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(timePerQuestion);
    } else {
      setGameComplete(true);
      onComplete?.({
        score,
        total: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        answers,
      });
    }
  };

  const getAnswerStyle = (index) => {
    if (!isAnswered) return styles.answer;
    
    if (index === question.correctAnswer) {
      return [styles.answer, styles.answerCorrect];
    }
    if (index === selectedAnswer && index !== question.correctAnswer) {
      return [styles.answer, styles.answerWrong];
    }
    return [styles.answer, styles.answerDisabled];
  };

  const getProgressColor = () => {
    const percentage = (score / (currentQuestion + 1)) * 100;
    if (percentage >= 80) return colors.success;
    if (percentage >= 60) return colors.warning;
    return colors.error;
  };

  if (gameComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
    
    return (
      <View style={styles.container}>
        <View style={styles.resultsContainer}>
          <Ionicons
            name={percentage >= 60 ? 'trophy' : 'sad'}
            size={80}
            color={percentage >= 60 ? colors.accent : colors.error}
          />
          <Text style={styles.resultsTitle}>Quiz Complete!</Text>
          <Text style={styles.resultsScore}>
            {score} / {questions.length}
          </Text>
          <View style={[styles.gradeBadge, { backgroundColor: getProgressColor() }]}>
            <Text style={styles.gradeText}>Grade: {grade}</Text>
          </View>
          <Text style={styles.resultsPercentage}>{percentage}%</Text>
          
          {showExplanations && (
            <ScrollView style={styles.reviewContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.reviewTitle}>Review Your Answers</Text>
              {questions.map((q, index) => {
                const answer = answers[index];
                return (
                  <View key={q.id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <Ionicons
                        name={answer?.correct ? 'checkmark-circle' : 'close-circle'}
                        size={20}
                        color={answer?.correct ? colors.success : colors.error}
                      />
                      <Text style={styles.reviewQuestion} numberOfLines={2}>
                        {q.question}
                      </Text>
                    </View>
                    <Text style={styles.reviewAnswer}>
                      Correct: {q.options[q.correctAnswer]}
                    </Text>
                    {q.explanation && (
                      <Text style={styles.reviewExplanation}>{q.explanation}</Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progress}>
          <Text style={styles.progressText}>
            Question {currentQuestion + 1}/{questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                  backgroundColor: getProgressColor(),
                },
              ]}
            />
          </View>
        </View>
        
        <View style={[styles.timer, timeLeft < 10 && styles.timerWarning]}>
          <Ionicons
            name="time"
            size={20}
            color={timeLeft < 10 ? colors.error : colors.textLight}
          />
          <Text style={[styles.timerText, timeLeft < 10 && styles.timerTextWarning]}>
            {timeLeft}s
          </Text>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <Ionicons name="star" size={20} color={colors.accent} />
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.question}</Text>
        
        {question.hint && !isAnswered && (
          <View style={styles.hintContainer}>
            <Ionicons name="bulb" size={16} color={colors.warning} />
            <Text style={styles.hintText}>{question.hint}</Text>
          </View>
        )}
      </View>

      <View style={styles.answersContainer}>
        {question.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={getAnswerStyle(index)}
            onPress={() => handleAnswer(index)}
            disabled={isAnswered}
            activeOpacity={0.7}
          >
            <View style={styles.answerLetter}>
              <Text style={styles.answerLetterText}>
                {String.fromCharCode(65 + index)}
              </Text>
            </View>
            <Text style={styles.answerText}>{option}</Text>
            {isAnswered && index === question.correctAnswer && (
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            )}
            {isAnswered && index === selectedAnswer && index !== question.correctAnswer && (
              <Ionicons name="close-circle" size={24} color={colors.error} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {isAnswered && question.explanation && showExplanations && (
        <View style={styles.explanationContainer}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}

      {isAnswered && (
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progress: {
    flex: 1,
    marginRight: spacing.md,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  timerWarning: {
    backgroundColor: colors.error + '20',
  },
  timerText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: spacing.xs,
  },
  timerTextWarning: {
    color: colors.error,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  scoreText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.accent,
    marginLeft: spacing.xs,
  },
  questionContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  questionText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 26,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.warning + '10',
    borderRadius: borderRadius.md,
  },
  hintText: {
    fontSize: fontSize.sm,
    color: colors.warning,
    marginLeft: spacing.xs,
    flex: 1,
  },
  answersContainer: {
    gap: spacing.sm,
  },
  answer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  answerCorrect: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  answerWrong: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  answerDisabled: {
    opacity: 0.6,
  },
  answerLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  answerLetterText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.primary,
  },
  answerText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  explanationContainer: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  explanationText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  nextButtonText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginRight: spacing.sm,
  },
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.lg,
  },
  resultsScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.md,
  },
  gradeBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  gradeText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  resultsPercentage: {
    fontSize: fontSize.lg,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  reviewContainer: {
    maxHeight: 300,
    width: '100%',
    marginTop: spacing.lg,
  },
  reviewTitle: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  reviewItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reviewQuestion: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  reviewAnswer: {
    fontSize: fontSize.xs,
    color: colors.success,
    marginTop: spacing.xs,
    marginLeft: 28,
  },
  reviewExplanation: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
    marginLeft: 28,
    fontStyle: 'italic',
  },
});

export default QuizGame;

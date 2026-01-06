import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');
const TIMELINE_WIDTH = width - spacing.lg * 2;

export const TimelineSort = ({
  events,
  onComplete,
  onProgress,
  timeLimit,
}) => {
  const [items, setItems] = useState([]);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const pan = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    // Shuffle events initially
    const shuffled = [...events].sort(() => Math.random() - 0.5);
    setItems(shuffled.map((event, index) => ({ ...event, currentIndex: index })));
  }, [events]);

  // Timer
  useEffect(() => {
    if (!timeLimit || isComplete) return;

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
  }, [timeLimit, isComplete]);

  const checkOrder = () => {
    setAttempts((prev) => prev + 1);
    
    const isCorrect = items.every((item, index) => {
      const correctIndex = events.findIndex((e) => e.id === item.id);
      return correctIndex === index;
    });

    if (isCorrect) {
      setIsComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete?.({ attempts: attempts + 1, timeLeft });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Calculate progress
    let correctCount = 0;
    items.forEach((item, index) => {
      const correctIndex = events.findIndex((e) => e.id === item.id);
      if (correctIndex === index) correctCount++;
    });
    onProgress?.(correctCount / events.length);
  };

  const moveItem = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    Haptics.selectionAsync();
    const newItems = [...items];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    setItems(newItems);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderItem = (item, index) => {
    const isFirst = index === 0;
    const isLast = index === items.length - 1;

    return (
      <View key={item.id} style={styles.itemContainer}>
        <View style={styles.timelineConnector}>
          {!isFirst && <View style={styles.connectorLine} />}
          <View style={[styles.timelineDot, item.isImportant && styles.importantDot]} />
          {!isLast && <View style={styles.connectorLine} />}
        </View>
        
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemYear}>{item.year}</Text>
            <View style={styles.moveButtons}>
              {index > 0 && (
                <TouchableOpacity
                  style={styles.moveButton}
                  onPress={() => moveItem(index, index - 1)}
                >
                  <Ionicons name="arrow-up" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
              {index < items.length - 1 && (
                <TouchableOpacity
                  style={styles.moveButton}
                  onPress={() => moveItem(index, index + 1)}
                >
                  <Ionicons name="arrow-down" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={styles.itemTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.itemDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (isComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.completedContainer}>
          <Ionicons name="trophy" size={60} color={colors.accent} />
          <Text style={styles.completedTitle}>Timeline Sorted!</Text>
          <Text style={styles.completedSubtitle}>
            Completed in {attempts} attempt{attempts !== 1 ? 's' : ''}
            {timeLimit && ` with ${formatTime(timeLeft)} remaining`}
          </Text>
          
          <View style={styles.correctTimeline}>
            <Text style={styles.correctTimelineTitle}>Correct Order:</Text>
            {events.map((event, index) => (
              <View key={event.id} style={styles.correctItem}>
                <Text style={styles.correctYear}>{event.year}</Text>
                <Text style={styles.correctTitle}>{event.title}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.instructions}>
          Arrange events in chronological order
        </Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="refresh" size={16} color={colors.textLight} />
            <Text style={styles.statText}>{attempts} attempts</Text>
          </View>
          {timeLimit && (
            <View style={[styles.stat, timeLeft < 30 && styles.statWarning]}>
              <Ionicons
                name="time"
                size={16}
                color={timeLeft < 30 ? colors.error : colors.textLight}
              />
              <Text style={[styles.statText, timeLeft < 30 && styles.statTextWarning]}>
                {formatTime(timeLeft)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.timeline}>
        <View style={styles.timelineHeader}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <Text style={styles.timelineTitle}>Earliest</Text>
        </View>
        
        {items.map((item, index) => renderItem(item, index))}
        
        <View style={styles.timelineFooter}>
          <Ionicons name="time" size={20} color={colors.primary} />
          <Text style={styles.timelineTitle}>Latest</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.checkButton} onPress={checkOrder}>
        <Ionicons name="checkmark-circle" size={24} color={colors.textInverse} />
        <Text style={styles.checkButtonText}>Check Order</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  instructions: {
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
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
  },
  statTextWarning: {
    color: colors.error,
  },
  timeline: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timelineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  timelineTitle: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  itemContainer: {
    flexDirection: 'row',
  },
  timelineConnector: {
    width: 30,
    alignItems: 'center',
  },
  connectorLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.primary + '40',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
  },
  importantDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  itemContent: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginLeft: spacing.sm,
    marginVertical: spacing.xs,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemYear: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.primary,
  },
  moveButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  moveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  itemDescription: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  checkButtonText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginLeft: spacing.sm,
  },
  completedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.md,
  },
  completedSubtitle: {
    fontSize: fontSize.md,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  correctTimeline: {
    marginTop: spacing.xl,
    width: '100%',
  },
  correctTimelineTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  correctItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  correctYear: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.primary,
    width: 60,
  },
  correctTitle: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
  },
});

export default TimelineSort;

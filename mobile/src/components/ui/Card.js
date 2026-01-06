import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../theme';

export default function Card({
  title,
  subtitle,
  description,
  image,
  icon,
  iconColor = colors.primary,
  onPress,
  footer,
  badge,
  variant = 'default', // default, elevated, outlined
  children,
  style,
}) {
  const Container = onPress ? TouchableOpacity : View;

  const getCardStyle = () => {
    const baseStyle = [styles.card];

    switch (variant) {
      case 'elevated':
        baseStyle.push(styles.cardElevated);
        break;
      case 'outlined':
        baseStyle.push(styles.cardOutlined);
        break;
      default:
        baseStyle.push(styles.cardDefault);
    }

    return baseStyle;
  };

  return (
    <Container
      style={[...getCardStyle(), style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Badge */}
      {badge && (
        <View style={[styles.badge, { backgroundColor: badge.color || colors.primary }]}>
          <Text style={styles.badgeText}>{badge.text}</Text>
        </View>
      )}

      {/* Image */}
      {image && (
        <View style={styles.imageContainer}>
          {typeof image === 'string' ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name={icon || 'image'} size={48} color={iconColor} />
            </View>
          )}
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Header with icon */}
        {(icon || title) && !image && (
          <View style={styles.header}>
            {icon && (
              <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                <Ionicons name={icon} size={24} color={iconColor} />
              </View>
            )}
            <View style={styles.headerText}>
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
        )}

        {/* Title without icon (when image exists) */}
        {image && title && (
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )}

        {/* Description */}
        {description && (
          <Text style={styles.description} numberOfLines={3}>
            {description}
          </Text>
        )}

        {/* Children */}
        {children}
      </View>

      {/* Footer */}
      {footer && <View style={styles.footer}>{footer}</View>}

      {/* Arrow indicator for clickable cards */}
      {onPress && (
        <View style={styles.arrow}>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  cardDefault: {
    // Default styling
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardOutlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    zIndex: 10,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textInverse,
  },
  imageContainer: {
    width: '100%',
    height: 150,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  arrow: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    marginTop: -10,
  },
});

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Modal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant = 'center', // center, bottom, fullscreen
  showCloseButton = true,
  closeOnBackdrop = true,
  animationType = 'fade', // fade, slide, none
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'bottom':
        return styles.containerBottom;
      case 'fullscreen':
        return styles.containerFullscreen;
      default:
        return styles.containerCenter;
    }
  };

  const getContentStyle = () => {
    switch (variant) {
      case 'bottom':
        return styles.contentBottom;
      case 'fullscreen':
        return styles.contentFullscreen;
      default:
        return styles.contentCenter;
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, getContainerStyle()]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.content,
            getContentStyle(),
            variant !== 'center' && {
              transform: [{ translateY: slideAnim }],
            },
            variant === 'center' && {
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Handle for bottom sheet */}
          {variant === 'bottom' && <View style={styles.handle} />}

          {/* Header */}
          {(title || showCloseButton) && (
            <View style={styles.header}>
              <View style={styles.headerText}>
                {title && <Text style={styles.title}>{title}</Text>}
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>
              {showCloseButton && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {/* Footer */}
          {footer && <View style={styles.footer}>{footer}</View>}
        </Animated.View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

// Preset Modal Components
export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = colors.primary,
  danger = false,
}) {
  return (
    <Modal visible={visible} onClose={onClose} title={title}>
      <Text style={styles.confirmMessage}>{message}</Text>
      <View style={styles.confirmButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>{cancelText}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            { backgroundColor: danger ? colors.error : confirmColor },
          ]}
          onPress={() => {
            onConfirm();
            onClose();
          }}
        >
          <Text style={styles.confirmButtonText}>{confirmText}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export function AlertModal({
  visible,
  onClose,
  title,
  message,
  buttonText = 'OK',
  icon,
  iconColor = colors.primary,
}) {
  return (
    <Modal visible={visible} onClose={onClose} showCloseButton={false}>
      <View style={styles.alertContent}>
        {icon && (
          <View style={[styles.alertIcon, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={icon} size={48} color={iconColor} />
          </View>
        )}
        {title && <Text style={styles.alertTitle}>{title}</Text>}
        {message && <Text style={styles.alertMessage}>{message}</Text>}
        <TouchableOpacity style={styles.alertButton} onPress={onClose}>
          <Text style={styles.alertButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
  },
  containerCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  containerBottom: {
    justifyContent: 'flex-end',
  },
  containerFullscreen: {
    // Full screen
  },
  content: {
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  contentCenter: {
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  contentBottom: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  contentFullscreen: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  closeButton: {
    padding: spacing.xs,
  },
  body: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  bodyContent: {
    padding: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  // Confirm Modal
  confirmMessage: {
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: spacing.md,
    marginLeft: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
  // Alert Modal
  alertContent: {
    alignItems: 'center',
  },
  alertIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  alertTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  alertMessage: {
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  alertButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  alertButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  isDarkMode?: boolean;
  rightAction?: {
    iconName: keyof typeof Ionicons.glyphMap;
    label?: string;
    onPress: () => void;
  };
  secondaryAction?: {
    iconName: keyof typeof Ionicons.glyphMap;
    label?: string;
    onPress: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  isDarkMode = false,
  rightAction,
  secondaryAction,
}) => {
  const router = useRouter();

  const navigateBackSafely = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch {
      router.replace('/');
    }
  };

  const handleBack = () => {
    if (onBack) {
      try {
        onBack();
      } catch (err) {
        console.error('Error in custom onBack handler:', err);
        navigateBackSafely();
      }
    } else {
      navigateBackSafely();
    }
  };

  const textColor = isDarkMode ? '#F5EFE6' : Colors.ink;
  const subtextColor = isDarkMode ? '#8C7D70' : Colors.muted;
  const bgColor = isDarkMode ? '#100E0D' : Colors.paper;
  const borderColor = isDarkMode ? '#28211B' : Colors.rule;
  const actionBtnBg = isDarkMode ? 'rgba(255, 255, 255, 0.09)' : Colors.sheet;
  const actionBtnBorder = isDarkMode ? 'rgba(255, 255, 255, 0.18)' : Colors.rule;
  const actionIconColor = isDarkMode ? '#F5EFE6' : Colors.ink;

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderBottomColor: borderColor }]}>
      {/* Platen top ridge */}
      <View style={[styles.platenRidge, isDarkMode && { backgroundColor: '#1E1815' }]} />

      <View style={styles.innerRow}>
        {/* Left: Back button */}
        <View style={styles.leftContainer}>
          {showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.iconButton}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              activeOpacity={0.6}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 30 }}
            >
              <Ionicons name="arrow-back" size={22} color={textColor} />
              <Text style={[styles.backLabel, { color: textColor }]}>Back</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Center: Title */}
        <View style={styles.titleContainer} pointerEvents="none">
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title || 'PAPERTRAIL'}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: subtextColor }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Right: Actions */}
        <View style={styles.rightContainer}>
          {secondaryAction && (
            <TouchableOpacity
              onPress={secondaryAction.onPress}
              style={[
                styles.actionButton,
                {
                  backgroundColor: actionBtnBg,
                  borderColor: actionBtnBorder,
                },
              ]}
              accessibilityLabel={secondaryAction.label || 'Action'}
              accessibilityRole="button"
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name={secondaryAction.iconName}
                size={18}
                color={secondaryAction.iconName.includes('sun') && isDarkMode ? '#FFEBB5' : actionIconColor}
              />
            </TouchableOpacity>
          )}
          {rightAction && (
            <TouchableOpacity
              onPress={rightAction.onPress}
              style={[
                styles.actionButton,
                {
                  backgroundColor: actionBtnBg,
                  borderColor: actionBtnBorder,
                },
              ]}
              accessibilityLabel={rightAction.label || 'Action'}
              accessibilityRole="button"
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name={rightAction.iconName}
                size={18}
                color={rightAction.iconName === 'star' ? '#F5D061' : actionIconColor}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tactile platen ruler border */}
      <View style={styles.rulerContainer}>
        <View style={styles.rulerLine} />
        <View style={styles.rulerMarks}>
          {[...Array(11)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.rulerTick,
                i % 5 === 0 ? styles.rulerTickMajor : styles.rulerTickMinor,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
    paddingTop: Spacing.sm,
  },
  platenRidge: {
    height: 3,
    backgroundColor: Colors.walnut,
    opacity: 0.15,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  leftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 999,
  },
  titleContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    zIndex: 999,
  },
  title: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
    marginTop: 1,
    letterSpacing: 0.5,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    zIndex: 1000,
  },
  backLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.ink,
    marginLeft: 6,
    fontWeight: Typography.weights.semibold,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brassDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brass,
  },
  brandTiny: {
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 1,
    fontWeight: Typography.weights.semibold,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
  },
  rulerContainer: {
    height: 6,
    position: 'relative',
    justifyContent: 'center',
  },
  rulerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.rule,
  },
  rulerMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  rulerTick: {
    width: 1,
    backgroundColor: Colors.muted,
  },
  rulerTickMajor: {
    height: 5,
    opacity: 0.6,
  },
  rulerTickMinor: {
    height: 3,
    opacity: 0.3,
  },
});

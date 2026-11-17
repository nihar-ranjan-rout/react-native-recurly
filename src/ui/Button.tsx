import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii, shadows } from './tokens';
import Icon, { IconName } from './Icon';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  labelStyle,
  fullWidth = false,
}: ButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const getIconColor = () => {
    if (variant === 'primary' || variant === 'accent' || variant === 'danger') return '#FFFFFF';
    return colors.nearBlack;
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'accent' ? '#FFFFFF' : colors.nearBlack}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Icon
              name={icon}
              size={size === 'sm' ? 16 : 18}
              color={getIconColor()}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={[
              styles.label,
              styles[`${variant}Label` as keyof typeof styles] as TextStyle,
              styles[`${size}Label` as keyof typeof styles] as TextStyle,
              disabled && styles.disabledLabel,
              labelStyle,
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <Icon
              name={icon}
              size={size === 'sm' ? 16 : 18}
              color={getIconColor()}
              style={{ marginLeft: 8 }}
            />
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    minHeight: 44, // WCAG touch target
    paddingHorizontal: 18,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  // Variants
  primary: {
    backgroundColor: colors.nearBlack,
    ...shadows.button,
  },
  secondary: {
    backgroundColor: colors.cardCream,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  accent: {
    backgroundColor: colors.accentOrange,
    ...shadows.button,
  },
  danger: {
    backgroundColor: colors.dangerRed,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Sizes
  sm: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radii.md,
  },
  md: {
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: radii.full,
  },
  lg: {
    minHeight: 52,
    paddingHorizontal: 24,
    borderRadius: radii.full,
  },
  // Labels
  label: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  primaryLabel: {
    color: '#FFFFFF',
  },
  secondaryLabel: {
    color: colors.nearBlack,
  },
  accentLabel: {
    color: '#FFFFFF',
  },
  dangerLabel: {
    color: '#FFFFFF',
  },
  ghostLabel: {
    color: colors.nearBlack,
  },
  smLabel: {
    fontSize: 13,
  },
  mdLabel: {
    fontSize: 14,
  },
  lgLabel: {
    fontSize: 16,
  },
  disabledLabel: {
    color: colors.textMuted,
  },
});


import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radii } from './tokens';
import Icon, { IconName } from './Icon';

export type BadgeVariant =
  | 'active'
  | 'paused'
  | 'cancelled'
  | 'overdue'
  | 'due-today'
  | 'autopay'
  | 'gst'
  | 'paid'
  | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export default function Badge({
  label,
  variant = 'neutral',
  size = 'md',
  icon,
  style,
}: BadgeProps) {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'active':
      case 'paid':
        return {
          bg: colors.successGreenLight,
          border: colors.successGreenBorder,
          text: colors.successGreen,
        };
      case 'paused':
        return {
          bg: colors.warningOrangeLight,
          border: '#FFE0B2',
          text: colors.warningOrange,
        };
      case 'cancelled':
      case 'neutral':
        return {
          bg: '#EEF2F0',
          border: '#D8E2DC',
          text: colors.textSecondary,
        };
      case 'overdue':
        return {
          bg: colors.dangerRedLight,
          border: colors.dangerRedBorder,
          text: colors.dangerRed,
        };
      case 'due-today':
        return {
          bg: colors.accentOrangeLight,
          border: colors.accentOrangeBorder,
          text: colors.accentOrange,
        };
      case 'autopay':
        return {
          bg: colors.tealLight,
          border: colors.tealBorder,
          text: colors.teal,
        };
      case 'gst':
        return {
          bg: '#EAF0EC',
          border: '#CFDDD4',
          text: colors.textSecondary,
        };
      default:
        return {
          bg: '#EEF2F0',
          border: '#D8E2DC',
          text: colors.textSecondary,
        };
    }
  };

  const palette = getBadgeStyle();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingHorizontal: isSm ? 6 : 10,
          paddingVertical: isSm ? 2 : 4,
        },
        style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={isSm ? 10 : 12}
          color={palette.text}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: palette.text,
            fontSize: isSm ? 10 : 11,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});

